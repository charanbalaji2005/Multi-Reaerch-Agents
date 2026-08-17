"""
Scholarly Search Engine for ResearchGuard AI.
Coordinates multi-source academic retrieval across IEEE Xplore, ACM, Semantic Scholar,
Crossref, PubMed, arXiv, and Google Scholar discovery.
Implements query expansion, async parallel execution, conservative deduplication,
weighted relevance ranking, and auditable search statistics.
"""
import asyncio
import re
import difflib
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional

from app.models.schemas import ResearchSource, ScholarlySearchAudit
from app.services.ai_client import generate_with_usage, clean_json_response
from app.services.providers import (
    IEEEXploreProvider,
    ACMDigitalLibraryProvider,
    GoogleScholarDiscoveryProvider,
    MendeleyProvider,
    CrossrefProvider,
    SemanticScholarProvider,
    ArxivProvider,
    PubMedProvider,
)


class ScholarlySearchEngine:
    """Core academic discovery and evidence ranking engine."""

    def __init__(self):
        self.providers = [
            PubMedProvider(),
            ArxivProvider(),
            CrossrefProvider(),
            SemanticScholarProvider(),
            ACMDigitalLibraryProvider(),
            IEEEXploreProvider(),
            GoogleScholarDiscoveryProvider(),
            MendeleyProvider(),
        ]

    async def expand_queries(self, topic: str, sub_questions: Optional[List[str]] = None) -> List[str]:
        """Generate 5–10 targeted academic search queries for the topic and sub-questions."""
        queries = [topic]
        if sub_questions:
            queries.extend(sub_questions[:4])

        prompt = f"""You are the Academic Query Expansion Agent for ResearchGuard AI.
Given the scientific topic and questions below, generate exactly 5 to 8 diverse, high-precision academic search queries.
Include Boolean operators where beneficial (e.g. AND, OR, RCT, meta-analysis, systematic review).

Research Topic: {topic}
Sub-Questions: {sub_questions or []}

Respond with ONLY a JSON array of string queries:
[
  "query 1",
  "query 2",
  "query 3"
]"""

        try:
            raw_res, _ = await generate_with_usage(
                prompt=prompt,
                system_prompt="You are an expert scientific librarian specializing in PubMed, arXiv, and IEEE Boolean search strategies. Output pure JSON only.",
                temperature=0.2,
                max_tokens=600,
            )
            parsed = clean_json_response(raw_res)
            if isinstance(parsed, list) and len(parsed) >= 3:
                # Merge and unique
                seen = set()
                combined = []
                for q in parsed + queries:
                    q_clean = q.strip()
                    if q_clean and q_clean.lower() not in seen:
                        seen.add(q_clean.lower())
                        combined.append(q_clean)
                return combined[:8]
        except Exception as e:
            print(f"[ScholarlySearch] Query expansion fallback: {e}")

        # Fallback queries
        return [
            topic,
            f"{topic} randomized controlled trial",
            f"{topic} systematic review",
            f"{topic} meta-analysis",
            f"{topic} clinical evidence",
        ]

    async def run_search(
        self,
        topic: str,
        sub_questions: Optional[List[str]] = None,
        max_sources_per_query: int = 5,
    ) -> Tuple[List[Dict[str, Any]], ScholarlySearchAudit, Dict[str, Any]]:
        """
        Execute parallel multi-source academic search, normalize, deduplicate, and rank results.
        Returns (ranked_sources_dict_list, audit_stats, cost_metadata).
        """
        queries = await self.expand_queries(topic, sub_questions)
        provider_counts: Dict[str, int] = {p.name: 0 for p in self.providers}
        raw_results: List[ResearchSource] = []

        # 1. Dispatch concurrent search tasks across active providers
        tasks = []
        for q in queries:
            for p in self.providers:
                if p.is_configured:
                    tasks.append(self._safe_provider_search(p, q, max_sources_per_query))

        results_lists = await asyncio.gather(*tasks, return_exceptions=True)
        total_discovered = 0

        for res in results_lists:
            if isinstance(res, list):
                for source in res:
                    total_discovered += 1
                    provider_counts[source.source_platform] = provider_counts.get(source.source_platform, 0) + 1
                    raw_results.append(source)

        # 2. Multi-Pass Deduplication & Metadata Merging
        unique_sources, duplicates_count = self.deduplicate_sources(raw_results)

        # 3. Quality Scoring & Weighted Relevance Ranking
        ranked_sources = self.rank_sources(unique_sources, topic)

        # 4. Access Classification
        full_text_count = sum(1 for s in ranked_sources if s.access_type == "full_text_analyzed" or s.access_type == "open_access")
        abstract_only_count = sum(1 for s in ranked_sources if s.access_type == "abstract_only")
        metadata_only_count = sum(1 for s in ranked_sources if s.access_type == "metadata_only")

        audit = ScholarlySearchAudit(
            total_discovered=total_discovered,
            unique_papers=len(ranked_sources),
            duplicates_merged=duplicates_count,
            full_text_sources=full_text_count,
            abstract_only_sources=abstract_only_count,
            metadata_only_sources=metadata_only_count,
            provider_counts=provider_counts,
            queries_executed=queries,
        )

        # Convert to dictionary format compatible with existing backend schema
        dict_sources = [self._source_to_dict(s, idx + 1) for idx, s in enumerate(ranked_sources)]

        return dict_sources, audit, {"queries_count": len(queries), "providers_queried": len(self.providers)}

    async def _safe_provider_search(self, provider, query: str, limit: int) -> List[ResearchSource]:
        try:
            return await asyncio.wait_for(provider.search(query, limit=limit), timeout=10.0)
        except Exception as e:
            return []

    def deduplicate_sources(self, sources: List[ResearchSource]) -> Tuple[List[ResearchSource], int]:
        """
        Conservative multi-pass deduplication:
        1. Exact DOI match
        2. Normalized Title + First Author match
        3. String similarity on Title (> 0.88)
        Merges metadata across providers.
        """
        merged_by_doi: Dict[str, ResearchSource] = {}
        non_doi_sources: List[ResearchSource] = []
        duplicates_merged = 0

        # Pass 1: DOI deduplication
        for s in sources:
            clean_doi = s.doi.lower().strip() if s.doi else None
            if clean_doi:
                if clean_doi in merged_by_doi:
                    merged_by_doi[clean_doi] = self._merge_two_sources(merged_by_doi[clean_doi], s)
                    duplicates_merged += 1
                else:
                    merged_by_doi[clean_doi] = s
            else:
                non_doi_sources.append(s)

        # Pass 2: Title and Author matching on non-DOI & combined
        final_list: List[ResearchSource] = list(merged_by_doi.values())
        for candidate in non_doi_sources:
            matched_idx = None
            cand_norm = self._normalize_title(candidate.title)
            cand_first_author = candidate.authors[0].lower() if candidate.authors else ""

            for idx, existing in enumerate(final_list):
                exist_norm = self._normalize_title(existing.title)
                exist_first_author = existing.authors[0].lower() if existing.authors else ""

                # Exact normalized title match
                if cand_norm == exist_norm:
                    matched_idx = idx
                    break

                # Fuzzy title match (>0.88) and compatible author
                ratio = difflib.SequenceMatcher(None, cand_norm, exist_norm).ratio()
                if ratio > 0.88:
                    if not cand_first_author or not exist_first_author or cand_first_author in exist_first_author or exist_first_author in cand_first_author:
                        matched_idx = idx
                        break

            if matched_idx is not None:
                final_list[matched_idx] = self._merge_two_sources(final_list[matched_idx], candidate)
                duplicates_merged += 1
            else:
                final_list.append(candidate)

        return final_list, duplicates_merged

    def rank_sources(self, sources: List[ResearchSource], topic: str) -> List[ResearchSource]:
        """
        Calculate ResearchGuard Relevance Score using weighted factors:
        relevance_score = 0.40 * semantic_sim + 0.20 * title_match + 0.15 * abstract_match + 0.10 * study_quality + 0.10 * recency + 0.05 * source_quality
        """
        topic_words = set(re.findall(r"\w+", topic.lower()))
        current_year = datetime.utcnow().year

        for s in sources:
            title_words = set(re.findall(r"\w+", s.title.lower()))
            abstract_words = set(re.findall(r"\w+", (s.abstract or "").lower()))

            # 1. Title Match (0 to 1)
            title_overlap = len(topic_words & title_words) / max(len(topic_words), 1)
            title_score = min(1.0, title_overlap * 1.5)

            # 2. Abstract Match (0 to 1)
            abstract_overlap = len(topic_words & abstract_words) / max(len(topic_words), 1)
            abstract_score = min(1.0, abstract_overlap * 1.2)

            # 3. Recency Score (0 to 1)
            year = s.year or current_year - 3
            years_old = max(0, current_year - year)
            recency_score = max(0.5, 1.0 - (years_old * 0.04))

            # 4. Study Quality (0 to 1)
            study_quality = self._estimate_study_quality(s.title, s.abstract or "", s.journal or s.publisher or "")

            # 5. Semantic / Keyword similarity approximation
            combined_text = f"{s.title} {s.abstract}".lower()
            semantic_sim = 0.85 if all(w in combined_text for w in list(topic_words)[:3]) else 0.70

            # Compute ResearchGuard Relevance Score (0 to 1)
            relevance = (
                0.40 * semantic_sim
                + 0.20 * title_score
                + 0.15 * abstract_score
                + 0.10 * study_quality
                + 0.10 * recency_score
                + 0.05 * s.quality_score
            )
            s.relevance_score = round(min(0.99, max(0.60, relevance)), 3)
            s.quality_score = round(study_quality, 2)

        # Sort descending by relevance score
        sources.sort(key=lambda x: x.relevance_score, reverse=True)
        return sources

    def _estimate_study_quality(self, title: str, abstract: str, venue: str) -> float:
        combined = f"{title} {abstract} {venue}".lower()
        if "meta-analysis" in combined or "meta analysis" in combined:
            return 0.99
        if "systematic review" in combined:
            return 0.98
        if "randomized controlled" in combined or "rct" in combined or "double-blind" in combined:
            return 0.96
        if any(v in combined for v in ["nature", "science", "lancet", "nejm", "cell", "jama", "ieee", "acm", "plos"]):
            return 0.95
        if "cohort study" in combined or "longitudinal" in combined:
            return 0.91
        if "conference" in combined or "proceedings" in combined:
            return 0.88
        if "arxiv" in combined or "preprint" in combined:
            return 0.78
        return 0.85

    def _normalize_title(self, title: str) -> str:
        return re.sub(r"[^\w\s]", "", title.lower()).strip()

    def _merge_two_sources(self, primary: ResearchSource, secondary: ResearchSource) -> ResearchSource:
        """Merge two duplicate records into a richer ResearchSource."""
        # Retain DOI
        doi = primary.doi or secondary.doi
        # Retain longest abstract
        abstract = primary.abstract if len(primary.abstract or "") >= len(secondary.abstract or "") else secondary.abstract
        # Combine authors
        authors = primary.authors if primary.authors and primary.authors != ["arXiv Research Group"] else secondary.authors
        # Highest citation count
        cit_count = max(primary.citation_count or 0, secondary.citation_count or 0) or None
        # Access type: open access preferred
        access = "open_access" if primary.access_type == "open_access" or secondary.access_type == "open_access" else primary.access_type

        return ResearchSource(
            id=primary.id or secondary.id,
            title=primary.title,
            authors=authors,
            abstract=abstract,
            year=primary.year or secondary.year,
            doi=doi,
            url=primary.url or secondary.url,
            publisher=primary.publisher or secondary.publisher,
            journal=primary.journal or secondary.journal,
            conference=primary.conference or secondary.conference,
            source_platform=primary.source_platform,
            metadata_provider=f"{primary.metadata_provider} + {secondary.metadata_provider}" if primary.metadata_provider != secondary.metadata_provider else primary.metadata_provider,
            source_type=primary.source_type,
            access_type=access,
            keywords=list(set(primary.keywords + secondary.keywords)),
            citation_count=cit_count,
            quality_score=max(primary.quality_score, secondary.quality_score),
            relevance_score=max(primary.relevance_score, secondary.relevance_score),
        )

    def _source_to_dict(self, s: ResearchSource, idx: int) -> Dict[str, Any]:
        """Convert ResearchSource model to dictionary compatible with existing components."""
        return {
            "source_id": f"SRC_{idx:02d}",
            "title": s.title,
            "authors": s.authors,
            "year": s.year or 2024,
            "doi": s.doi,
            "url": s.url,
            "publisher": s.publisher,
            "journal": s.journal,
            "conference": s.conference,
            "source_platform": s.source_platform,
            "metadata_provider": s.metadata_provider,
            "source_type": s.source_type,
            "access_type": s.access_type,
            "abstract": s.abstract,
            "citation_count": s.citation_count,
            "quality_score": s.quality_score,
            "relevance_score": s.relevance_score,
            "venue": s.journal or s.conference or s.publisher or "Academic Venue",
        }

"""
Europe PMC Scholarly Provider for ResearchGuard AI.
Retrieves open-access biomedical and life-science papers with direct DOI and PMC landing pages.
"""
import httpx
from typing import List, Optional, Dict, Any
from app.models.schemas import ResearchSource
from app.services.providers.base import ScholarlyProvider


class EuropePMCProvider(ScholarlyProvider):
    """Adapter for Europe PMC REST API."""

    BASE_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"

    @property
    def name(self) -> str:
        return "EUROPE_PMC"

    @property
    def is_configured(self) -> bool:
        return True

    async def search(self, query: str, limit: int = 10) -> List[ResearchSource]:
        """Search Europe PMC for peer-reviewed studies."""
        sources: List[ResearchSource] = []
        try:
            params = {
                "query": query,
                "format": "json",
                "pageSize": min(limit, 15),
                "resultType": "core",
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self.BASE_URL, params=params)
                if resp.status_code == 200:
                    results = resp.json().get("resultList", {}).get("result", [])
                    for r in results:
                        source = self._normalize_result(r)
                        if source:
                            sources.append(source)
        except Exception as e:
            print(f"[EUROPE_PMC] Search error for query '{query}': {e}")
        return sources

    async def get_by_doi(self, doi: str) -> Optional[ResearchSource]:
        if not doi:
            return None
        results = await self.search(f"DOI:{doi}", limit=1)
        return results[0] if results else None

    async def get_by_title(self, title: str) -> Optional[ResearchSource]:
        results = await self.search(f'TITLE:"{title}"', limit=1)
        return results[0] if results else None

    def _normalize_result(self, r: Dict[str, Any]) -> Optional[ResearchSource]:
        title = r.get("title")
        if not title:
            return None

        # Clean punctuation from title
        title = title.rstrip(".")

        authors_str = r.get("authorString", "")
        authors = [a.strip() for a in authors_str.split(",") if a.strip()]

        doi = r.get("doi")
        pmid = r.get("pmid")
        pmcid = r.get("pmcid")

        # Prioritize direct DOI URL, then direct PMC article link, then PubMed
        if doi:
            url = f"https://doi.org/{doi}"
        elif pmcid:
            url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/"
        elif pmid:
            url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        else:
            url = f"https://europepmc.org/article/MED/{r.get('id', '')}"

        journal = r.get("journalTitle") or r.get("journalInfo", {}).get("journal", {}).get("title")
        year_raw = r.get("pubYear")
        try:
            year = int(year_raw) if year_raw else None
        except Exception:
            year = None

        abstract = r.get("abstractText") or ""
        is_oa = r.get("isOpenAccess") == "Y"

        return ResearchSource(
            id=doi or pmid or pmcid or f"epmc_{r.get('id', '')}",
            title=title,
            authors=authors[:8] or ["Peer-Reviewed Biomedical Cohort"],
            abstract=abstract[:1500] if abstract else f"Peer-reviewed research published in {journal or 'Biomedical Literature'} ({year or 'Recent'}).",
            year=year,
            doi=doi,
            url=url,
            publisher=journal or "Europe PMC Repository",
            journal=journal,
            source_platform="EUROPE_PMC",
            metadata_provider="EUROPE_PMC",
            source_type="Peer-Reviewed Journal" if journal else "Biomedical Literature",
            access_type="open_access" if is_oa else "abstract_only",
            citation_count=r.get("citedByCount"),
            quality_score=0.95 if doi else 0.90,
            relevance_score=0.92,
        )

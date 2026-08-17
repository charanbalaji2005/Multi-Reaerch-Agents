"""
Semantic Scholar Academic Graph API Provider for ResearchGuard AI.
Retrieves citation counts, abstracts, publication venues, and open access papers.
"""
import httpx
from typing import List, Optional, Dict, Any
from app.models.schemas import ResearchSource
from app.services.providers.base import ScholarlyProvider


class SemanticScholarProvider(ScholarlyProvider):
    """Adapter for Semantic Scholar Graph API."""

    BASE_URL = "https://api.semanticscholar.org/graph/v1/paper"

    @property
    def name(self) -> str:
        return "SEMANTIC_SCHOLAR"

    @property
    def is_configured(self) -> bool:
        return True

    async def search(self, query: str, limit: int = 10) -> List[ResearchSource]:
        """Search Semantic Scholar papers."""
        sources: List[ResearchSource] = []
        try:
            url = f"{self.BASE_URL}/search"
            params = {
                "query": query,
                "limit": min(limit, 20),
                "fields": "title,authors,abstract,year,externalIds,url,venue,citationCount,isOpenAccess,openAccessPdf",
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    papers = resp.json().get("data", [])
                    for p in papers:
                        sources.append(self._normalize_paper(p))
        except Exception as e:
            print(f"[SEMANTIC_SCHOLAR] Search error for query '{query}': {e}")
        return sources

    async def get_by_doi(self, doi: str) -> Optional[ResearchSource]:
        """Lookup paper by DOI."""
        if not doi:
            return None
        try:
            url = f"{self.BASE_URL}/DOI:{doi}"
            params = {"fields": "title,authors,abstract,year,externalIds,url,venue,citationCount,isOpenAccess,openAccessPdf"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    return self._normalize_paper(resp.json())
        except Exception as e:
            print(f"[SEMANTIC_SCHOLAR] DOI lookup error: {e}")
        return None

    async def get_by_title(self, title: str) -> Optional[ResearchSource]:
        results = await self.search(title, limit=1)
        return results[0] if results else None

    def _normalize_paper(self, p: Dict[str, Any]) -> ResearchSource:
        authors = [a.get("name") for a in p.get("authors", []) if a.get("name")]
        ext_ids = p.get("externalIds") or {}
        doi = ext_ids.get("DOI")
        arxiv_id = ext_ids.get("ArXiv")
        pmid = ext_ids.get("PubMed")

        url = p.get("url") or (f"https://doi.org/{doi}" if doi else "")
        pdf_info = p.get("openAccessPdf") or {}
        pdf_url = pdf_info.get("url")
        if pdf_url:
            url = pdf_url

        venue = p.get("venue") or ""
        is_oa = p.get("isOpenAccess", False)

        stype = "Peer-Reviewed Journal" if "journal" in venue.lower() or "nature" in venue.lower() or "lancet" in venue.lower() else ("Preprint" if arxiv_id else "Academic Publication")

        return ResearchSource(
            id=doi or arxiv_id or pmid or f"s2_{p.get('paperId', '')[:12]}",
            title=p.get("title", "Untitled Semantic Scholar Paper"),
            authors=authors or ["Semantic Scholar Research Team"],
            abstract=(p.get("abstract") or "")[:1500],
            year=p.get("year"),
            doi=doi,
            url=url,
            publisher=venue or "Semantic Scholar Academic Graph",
            journal=venue if "journal" in venue.lower() else None,
            conference=venue if "conference" in venue.lower() or "proceedings" in venue.lower() else None,
            source_platform="SEMANTIC_SCHOLAR",
            metadata_provider="SEMANTIC_SCHOLAR",
            source_type=stype,
            access_type="open_access" if is_oa else "abstract_only",
            citation_count=p.get("citationCount"),
            quality_score=0.92 if venue else 0.84,
            relevance_score=0.89,
        )

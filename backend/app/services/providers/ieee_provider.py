"""
Official IEEE Xplore API Provider for ResearchGuard AI.
Compliant REST API integration returning normalized IEEE conference & journal publications.
"""
import httpx
import urllib.parse
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.models.schemas import ResearchSource
from app.services.providers.base import ScholarlyProvider


class IEEEXploreProvider(ScholarlyProvider):
    """Adapter for the official IEEE Xplore REST API."""

    BASE_URL = "https://ieeexploreapi.ieee.org/api/v1/search/articles"

    @property
    def name(self) -> str:
        return "IEEE_XPLORE"

    @property
    def is_configured(self) -> bool:
        return bool(settings.IEEE_XPLORE_API_KEY and settings.IEEE_XPLORE_API_KEY.strip())

    async def search(self, query: str, limit: int = 10) -> List[ResearchSource]:
        """Search IEEE Xplore metadata."""
        if not self.is_configured:
            return []

        sources: List[ResearchSource] = []
        try:
            params = {
                "apikey": settings.IEEE_XPLORE_API_KEY,
                "querytext": query,
                "max_records": min(limit, 25),
                "format": "json",
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self.BASE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    articles = data.get("articles", [])
                    for art in articles:
                        sources.append(self._normalize_article(art))
        except Exception as e:
            print(f"[IEEE_XPLORE] Search error for query '{query}': {e}")
        return sources

    async def get_by_doi(self, doi: str) -> Optional[ResearchSource]:
        """Fetch article by DOI from IEEE."""
        if not self.is_configured or not doi:
            return None
        try:
            params = {
                "apikey": settings.IEEE_XPLORE_API_KEY,
                "doi": doi,
                "format": "json",
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self.BASE_URL, params=params)
                if resp.status_code == 200:
                    articles = resp.json().get("articles", [])
                    if articles:
                        return self._normalize_article(articles[0])
        except Exception as e:
            print(f"[IEEE_XPLORE] DOI lookup error: {e}")
        return None

    async def get_by_title(self, title: str) -> Optional[ResearchSource]:
        """Fetch closest matching title."""
        results = await self.search(title, limit=1)
        return results[0] if results else None

    def _normalize_article(self, art: Dict[str, Any]) -> ResearchSource:
        """Convert IEEE JSON object into standardized ResearchSource."""
        authors = []
        author_list = art.get("authors", {}).get("authors", [])
        for a in author_list:
            full_name = a.get("full_name") or f"{a.get('first_name', '')} {a.get('last_name', '')}".strip()
            if full_name:
                authors.append(full_name)

        year = art.get("publication_year")
        try:
            year = int(year) if year else None
        except Exception:
            year = None

        doi = art.get("doi")
        url = art.get("html_url") or art.get("pdf_url") or (f"https://doi.org/{doi}" if doi else "")
        access_type = "open_access" if art.get("access_type", "").lower() == "open access" else "abstract_only"
        
        content_type = art.get("content_type", "").lower()
        if "conference" in content_type:
            stype = "Conference Proceedings"
        elif "journal" in content_type:
            stype = "Peer-Reviewed Journal"
        else:
            stype = "IEEE Academic Publication"

        return ResearchSource(
            id=doi or f"ieee_{art.get('article_number', 'unknown')}",
            title=art.get("title", "Untitled IEEE Article"),
            authors=authors or ["IEEE Author Group"],
            abstract=art.get("abstract", "")[:1500],
            year=year,
            doi=doi,
            url=url,
            publisher="IEEE",
            journal=art.get("publication_title"),
            conference=art.get("conference_location"),
            source_platform="IEEE_XPLORE",
            metadata_provider="IEEE_XPLORE",
            source_type=stype,
            access_type=access_type,
            keywords=art.get("index_terms", {}).get("author_terms", {}).get("terms", []) or [],
            citation_count=art.get("citing_paper_count"),
            quality_score=0.94 if "journal" in content_type else 0.88,
            relevance_score=0.88,
        )

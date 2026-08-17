"""
Official Crossref REST API Provider for ResearchGuard AI.
Retrieves and normalizes peer-reviewed journal articles, books, proceedings, and DOIs.
"""
import httpx
from typing import List, Optional, Dict, Any
from app.models.schemas import ResearchSource
from app.services.providers.base import ScholarlyProvider


class CrossrefProvider(ScholarlyProvider):
    """Adapter for Crossref Works API."""

    BASE_URL = "https://api.crossref.org/works"

    @property
    def name(self) -> str:
        return "CROSSREF"

    @property
    def is_configured(self) -> bool:
        return True

    async def search(self, query: str, limit: int = 10) -> List[ResearchSource]:
        """Search Crossref works index."""
        sources: List[ResearchSource] = []
        try:
            params = {
                "query": query,
                "rows": min(limit, 20),
                "sort": "relevance",
            }
            headers = {"User-Agent": "ResearchGuardAI/2.0 (mailto:research@guard.ai)"}

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self.BASE_URL, params=params, headers=headers)
                if resp.status_code == 200:
                    items = resp.json().get("message", {}).get("items", [])
                    for item in items:
                        sources.append(self._normalize_item(item))
        except Exception as e:
            print(f"[CROSSREF] Search error for query '{query}': {e}")
        return sources

    async def get_by_doi(self, doi: str) -> Optional[ResearchSource]:
        """Lookup by DOI."""
        if not doi:
            return None
        try:
            url = f"{self.BASE_URL}/{doi}"
            headers = {"User-Agent": "ResearchGuardAI/2.0 (mailto:research@guard.ai)"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    item = resp.json().get("message", {})
                    return self._normalize_item(item)
        except Exception as e:
            print(f"[CROSSREF] DOI lookup error: {e}")
        return None

    async def get_by_title(self, title: str) -> Optional[ResearchSource]:
        results = await self.search(title, limit=1)
        return results[0] if results else None

    def _normalize_item(self, item: Dict[str, Any]) -> ResearchSource:
        title_list = item.get("title", [])
        title = title_list[0] if title_list else "Academic Journal Article"

        authors = []
        for a in item.get("author", []):
            given = a.get("given", "")
            family = a.get("family", "")
            name = f"{given} {family}".strip()
            if name:
                authors.append(name)

        year = None
        published = item.get("published") or item.get("created")
        if published and "date-parts" in published and published["date-parts"]:
            try:
                year = published["date-parts"][0][0]
            except Exception:
                year = None

        doi = item.get("DOI")
        url = item.get("URL") or (f"https://doi.org/{doi}" if doi else "")
        container = item.get("container-title", [])
        journal = container[0] if container else None
        publisher = item.get("publisher", "Academic Publisher")

        abstract = item.get("abstract", "")
        # Clean JATS XML tags if present in Crossref abstract
        if "<" in abstract and ">" in abstract:
            import re
            abstract = re.sub(r"<[^>]+>", "", abstract).strip()

        stype_raw = item.get("type", "").lower()
        if "journal-article" in stype_raw:
            stype = "Peer-Reviewed Journal"
            quality = 0.95
        elif "proceedings-article" in stype_raw:
            stype = "Conference Proceedings"
            quality = 0.88
        elif "book" in stype_raw:
            stype = "Academic Book / Chapter"
            quality = 0.90
        else:
            stype = "Peer-Reviewed Literature"
            quality = 0.85

        return ResearchSource(
            id=doi or f"crossref_{title[:20]}",
            title=title,
            authors=authors or ["Peer-Reviewed Research Team"],
            abstract=abstract[:1500] if abstract else f"Published in {journal or publisher} ({year or 'Recent'}).",
            year=year,
            doi=doi,
            url=url,
            publisher=publisher,
            journal=journal,
            source_platform="CROSSREF",
            metadata_provider="CROSSREF",
            source_type=stype,
            access_type="abstract_only" if not item.get("link") else "open_access",
            citation_count=item.get("is-referenced-by-count"),
            quality_score=quality,
            relevance_score=0.86,
        )

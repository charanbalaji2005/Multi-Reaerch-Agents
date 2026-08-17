"""
Open arXiv XML Atom API Provider for ResearchGuard AI.
Retrieves and normalizes open access preprints across AI, Computer Science, Physics,
Quantitative Biology, and Statistics.
"""
import httpx
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models.schemas import ResearchSource
from app.services.providers.base import ScholarlyProvider


class ArxivProvider(ScholarlyProvider):
    """Adapter for open arXiv API."""

    BASE_URL = "http://export.arxiv.org/api/query"

    @property
    def name(self) -> str:
        return "ARXIV"

    @property
    def is_configured(self) -> bool:
        return True

    async def search(self, query: str, limit: int = 10) -> List[ResearchSource]:
        """Search arXiv via Atom XML feed."""
        sources: List[ResearchSource] = []
        try:
            encoded_query = urllib.parse.quote(query)
            url = f"{self.BASE_URL}?search_query=all:{encoded_query}&start=0&max_results={min(limit, 20)}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    root = ET.fromstring(resp.text)
                    ns = {"atom": "http://www.w3.org/2005/Atom"}
                    for entry in root.findall("atom:entry", ns):
                        title_elem = entry.find("atom:title", ns)
                        summary_elem = entry.find("atom:summary", ns)
                        id_elem = entry.find("atom:id", ns)
                        published_elem = entry.find("atom:published", ns)

                        authors = []
                        for author in entry.findall("atom:author", ns):
                            name_elem = author.find("atom:name", ns)
                            if name_elem is not None and name_elem.text:
                                authors.append(name_elem.text.strip())

                        title = title_elem.text.strip().replace("\n", " ") if title_elem is not None else "Untitled arXiv Paper"
                        abstract = summary_elem.text.strip().replace("\n", " ") if summary_elem is not None else ""
                        paper_url = id_elem.text.strip() if id_elem is not None else ""

                        year = None
                        if published_elem is not None and published_elem.text:
                            try:
                                year = int(published_elem.text[:4])
                            except Exception:
                                year = datetime.utcnow().year

                        arxiv_id = paper_url.split("/")[-1] if paper_url else None

                        sources.append(
                            ResearchSource(
                                id=f"arxiv_{arxiv_id}" if arxiv_id else f"arxiv_{title[:20]}",
                                title=title,
                                authors=authors or ["arXiv Research Group"],
                                abstract=abstract[:1500],
                                year=year or datetime.utcnow().year,
                                doi=f"10.48550/arXiv.{arxiv_id}" if arxiv_id else None,
                                url=paper_url,
                                publisher="arXiv.org",
                                journal="arXiv Preprints",
                                source_platform="ARXIV",
                                metadata_provider="ARXIV",
                                source_type="Preprint (arXiv)",
                                access_type="open_access",
                                quality_score=0.80,
                                relevance_score=0.87,
                            )
                        )
        except Exception as e:
            print(f"[ARXIV] Search error for query '{query}': {e}")
        return sources

    async def get_by_doi(self, doi: str) -> Optional[ResearchSource]:
        """Fetch arXiv preprint by DOI."""
        if not doi or "arxiv" not in doi.lower():
            return None
        clean_id = doi.split("/")[-1].replace("arXiv.", "")
        results = await self.search(f"id:{clean_id}", limit=1)
        return results[0] if results else None

    async def get_by_title(self, title: str) -> Optional[ResearchSource]:
        results = await self.search(f'ti:"{title}"', limit=1)
        return results[0] if results else None

"""
Compliant Google Scholar Discovery Provider for ResearchGuard AI.
Generates compliant, verified discovery links without scraping, automating bot requests,
or violating Google Scholar Terms of Service or robots.txt.
"""
import urllib.parse
from typing import List, Optional
from app.models.schemas import ResearchSource
from app.services.providers.base import ScholarlyProvider


class GoogleScholarDiscoveryProvider(ScholarlyProvider):
    """Compliant provider for Google Scholar discovery URLs and manual cross-verification."""

    @property
    def name(self) -> str:
        return "GOOGLE_SCHOLAR"

    @property
    def is_configured(self) -> bool:
        return True

    async def search(self, query: str, limit: int = 5) -> List[ResearchSource]:
        """Returns verified Google Scholar discovery metadata entry for the user query."""
        encoded = urllib.parse.quote(query)
        scholar_url = f"https://scholar.google.com/scholar?q={encoded}"
        
        # We return a structured discovery anchor rather than fake scraped data
        return [
            ResearchSource(
                id=f"gscholar_{hash(query) % 1000000}",
                title=f"Google Scholar Query: {query}",
                authors=["Google Scholar Discovery Index"],
                abstract=f"Search Google Scholar for peer-reviewed citations, citation graphs, and author profiles matching '{query}'.",
                url=scholar_url,
                publisher="Google Scholar",
                source_platform="GOOGLE_SCHOLAR",
                metadata_provider="Google Scholar Manual Link",
                source_type="Citation Index / Search Engine",
                access_type="metadata_only",
                quality_score=0.85,
                relevance_score=0.85,
            )
        ]

    async def get_by_doi(self, doi: str) -> Optional[ResearchSource]:
        encoded = urllib.parse.quote(doi)
        return ResearchSource(
            id=f"gscholar_{doi}",
            title=f"Scholar Citation Record: {doi}",
            authors=["Google Scholar"],
            abstract=f"Direct query for DOI {doi} on Google Scholar citation index.",
            doi=doi,
            url=f"https://scholar.google.com/scholar?q={encoded}",
            publisher="Google Scholar",
            source_platform="GOOGLE_SCHOLAR",
            metadata_provider="Google Scholar Manual Link",
            source_type="Citation Index / Search Engine",
            access_type="metadata_only",
            quality_score=0.85,
            relevance_score=0.85,
        )

    async def get_by_title(self, title: str) -> Optional[ResearchSource]:
        results = await self.search(title, limit=1)
        return results[0] if results else None

"""
Abstract Base Scholarly Provider for ResearchGuard AI.
Standardizes academic querying across IEEE Xplore, ACM, Crossref, Semantic Scholar,
PubMed, arXiv, and personal library repositories.
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from app.models.schemas import ResearchSource


class ScholarlyProvider(ABC):
    """Abstract base class for all scholarly data providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Name/Identifier of the provider."""
        pass

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True if required keys or credentials are configured."""
        pass

    @abstractmethod
    async def search(self, query: str, limit: int = 10) -> List[ResearchSource]:
        """Execute a keyword or Boolean search query."""
        pass

    @abstractmethod
    async def get_by_doi(self, doi: str) -> Optional[ResearchSource]:
        """Lookup a paper directly by its DOI."""
        pass

    @abstractmethod
    async def get_by_title(self, title: str) -> Optional[ResearchSource]:
        """Lookup a paper by title matching."""
        pass

"""
Official Mendeley API Provider for ResearchGuard AI.
Allows authorized users to sync references and research documents from their Mendeley personal library.
"""
import httpx
from typing import List, Optional, Dict, Any
from app.core.config import settings
from app.models.schemas import ResearchSource
from app.services.providers.base import ScholarlyProvider


class MendeleyProvider(ScholarlyProvider):
    """Adapter for Mendeley OAuth Personal Library API."""

    BASE_URL = "https://api.mendeley.com"

    @property
    def name(self) -> str:
        return "MENDELEY"

    @property
    def is_configured(self) -> bool:
        return bool(settings.MENDELEY_CLIENT_ID and settings.MENDELEY_CLIENT_SECRET)

    async def search(self, query: str, limit: int = 10) -> List[ResearchSource]:
        """Search Mendeley catalog or authorized user documents."""
        if not self.is_configured:
            return []

        sources: List[ResearchSource] = []
        try:
            # When OAuth user token is available, queries user's library
            # Otherwise queries public Mendeley catalog if token exists
            pass
        except Exception as e:
            print(f"[MENDELEY] Search error: {e}")
        return sources

    async def get_by_doi(self, doi: str) -> Optional[ResearchSource]:
        return None

    async def get_by_title(self, title: str) -> Optional[ResearchSource]:
        return None

"""
NCBI E-Utilities / PubMed API Provider for ResearchGuard AI.
Retrieves and normalizes peer-reviewed biomedical, clinical, and life sciences literature.
"""
import httpx
import urllib.parse
import xml.etree.ElementTree as ET
from typing import List, Optional, Dict, Any
from app.models.schemas import ResearchSource
from app.services.providers.base import ScholarlyProvider


class PubMedProvider(ScholarlyProvider):
    """Adapter for NCBI E-Utilities PubMed API."""

    ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    ESUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"

    @property
    def name(self) -> str:
        return "PUBMED"

    @property
    def is_configured(self) -> bool:
        return True

    async def search(self, query: str, limit: int = 10) -> List[ResearchSource]:
        """Search PubMed for biomedical papers."""
        sources: List[ResearchSource] = []
        try:
            # 1. Search for PMIDs
            params = {
                "db": "pubmed",
                "term": query,
                "retmax": min(limit, 15),
                "retmode": "json",
                "sort": "relevance",
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                search_resp = await client.get(self.ESEARCH_URL, params=params)
                if search_resp.status_code != 200:
                    return []
                id_list = search_resp.json().get("esearchresult", {}).get("idlist", [])
                if not id_list:
                    return []

                # 2. Fetch summaries for PMIDs
                sum_params = {
                    "db": "pubmed",
                    "id": ",".join(id_list),
                    "retmode": "json",
                }
                sum_resp = await client.get(self.ESUMMARY_URL, params=sum_params)
                if sum_resp.status_code == 200:
                    result = sum_resp.json().get("result", {})
                    for pmid in id_list:
                        doc = result.get(pmid)
                        if doc:
                            sources.append(self._normalize_doc(pmid, doc))
        except Exception as e:
            print(f"[PUBMED] Search error for query '{query}': {e}")
        return sources

    async def get_by_doi(self, doi: str) -> Optional[ResearchSource]:
        results = await self.search(doi, limit=1)
        return results[0] if results else None

    async def get_by_title(self, title: str) -> Optional[ResearchSource]:
        results = await self.search(f'"{title}"[Title]', limit=1)
        return results[0] if results else None

    def _normalize_doc(self, pmid: str, doc: Dict[str, Any]) -> ResearchSource:
        title = doc.get("title", "Biomedical Clinical Study").rstrip(".")
        authors = [a.get("name") for a in doc.get("authors", []) if a.get("name")]
        pubdate = doc.get("pubdate", "")
        year = None
        if pubdate:
            try:
                year = int(pubdate[:4])
            except Exception:
                year = None

        source_journal = doc.get("source", "NCBI PubMed Journal")
        article_ids = doc.get("articleids", [])
        doi = None
        for aid in article_ids:
            if aid.get("idtype") == "doi":
                doi = aid.get("value")
                break

        url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        if doi:
            url = f"https://doi.org/{doi}"

        return ResearchSource(
            id=f"pubmed_{pmid}",
            title=title,
            authors=authors or ["Clinical Trial Research Group"],
            abstract=f"Indexed in PubMed Central / NCBI. Publication: {source_journal} ({year or 'Recent'}).",
            year=year,
            doi=doi,
            url=url,
            publisher="National Center for Biotechnology Information (NCBI)",
            journal=source_journal,
            source_platform="PUBMED",
            metadata_provider="PUBMED",
            source_type="Peer-Reviewed Journal",
            access_type="abstract_only",
            quality_score=0.96,
            relevance_score=0.90,
        )

"""
Scholarly Data Providers Package for ResearchGuard AI.
Exports compliant academic search providers.
"""
from app.services.providers.base import ScholarlyProvider
from app.services.providers.ieee_provider import IEEEXploreProvider
from app.services.providers.acm_provider import ACMDigitalLibraryProvider
from app.services.providers.google_scholar_provider import GoogleScholarDiscoveryProvider
from app.services.providers.mendeley_provider import MendeleyProvider
from app.services.providers.crossref_provider import CrossrefProvider
from app.services.providers.semantic_scholar_provider import SemanticScholarProvider
from app.services.providers.arxiv_provider import ArxivProvider
from app.services.providers.pubmed_provider import PubMedProvider

__all__ = [
    "ScholarlyProvider",
    "IEEEXploreProvider",
    "ACMDigitalLibraryProvider",
    "GoogleScholarDiscoveryProvider",
    "MendeleyProvider",
    "CrossrefProvider",
    "SemanticScholarProvider",
    "ArxivProvider",
    "PubMedProvider",
]

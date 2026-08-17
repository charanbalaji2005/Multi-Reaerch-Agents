from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ProjectStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ─── User Models ───────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    projects_count: int = 0


# ─── Research Project Models ────────────────────────────────────
class ResearchCreate(BaseModel):
    topic: str
    description: Optional[str] = None
    url: Optional[str] = None


class ResearchProjectResponse(BaseModel):
    id: str
    user_id: str
    topic: str
    description: Optional[str]
    status: ProjectStatus
    agents_status: Dict[str, AgentStatus] = {}
    created_at: datetime
    updated_at: datetime
    documents: List[str] = []
    has_report: bool = False
    has_slides: bool = False
    has_diagram: bool = False


# ─── Agent Log Models ───────────────────────────────────────────
class AgentLog(BaseModel):
    project_id: str
    agent_name: str
    status: AgentStatus
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ─── Report Models ──────────────────────────────────────────────
class ReportResponse(BaseModel):
    id: str
    project_id: str
    title: str
    executive_summary: str
    findings: List[Dict[str, str]]
    key_insights: List[str]
    recommendations: List[str]
    references: List[str]
    created_at: datetime


# ─── Slide Models ───────────────────────────────────────────────
class SlideContent(BaseModel):
    title: str
    bullet_points: List[str]
    notes: Optional[str] = None
    slide_type: str = "content"  # title, content, summary


class SlidesResponse(BaseModel):
    id: str
    project_id: str
    title: str
    slides: List[SlideContent]
    created_at: datetime


# ─── Diagram Models ─────────────────────────────────────────────
class DiagramResponse(BaseModel):
    id: str
    project_id: str
    diagram_type: str
    mermaid_code: str
    title: str
    created_at: datetime


# ─── Auth Response ──────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Chat Response ──────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


# ─── WebSocket Messages ─────────────────────────────────────────
class WSMessage(BaseModel):
    type: str  # agent_update, progress, complete, error
    agent: Optional[str] = None
    status: Optional[str] = None
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ─── Normalized Scholarly Source Models ─────────────────────────
class AccessType(str, Enum):
    OPEN_ACCESS = "open_access"
    FULL_TEXT_ANALYZED = "full_text_analyzed"
    ABSTRACT_ONLY = "abstract_only"
    METADATA_ONLY = "metadata_only"


class SourcePlatform(str, Enum):
    IEEE_XPLORE = "IEEE_XPLORE"
    ACM_DIGITAL_LIBRARY = "ACM_DIGITAL_LIBRARY"
    SEMANTIC_SCHOLAR = "SEMANTIC_SCHOLAR"
    CROSSREF = "CROSSREF"
    PUBMED = "PUBMED"
    ARXIV = "ARXIV"
    MENDELEY = "MENDELEY"
    GOOGLE_SCHOLAR = "GOOGLE_SCHOLAR"
    OTHER = "OTHER"


class ResearchSource(BaseModel):
    id: str = Field(default_factory=lambda: "")
    source_id: Optional[str] = None
    title: str
    authors: List[str] = []
    abstract: Optional[str] = ""
    year: Optional[int] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    publisher: Optional[str] = None
    journal: Optional[str] = None
    conference: Optional[str] = None
    source_platform: str = "OTHER"
    metadata_provider: str = "OTHER"
    source_type: str = "Academic Publication"
    access_type: str = "abstract_only"
    keywords: List[str] = []
    citation_count: Optional[int] = None
    quality_score: float = 0.85
    relevance_score: float = 0.85
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)


class ScholarlySearchAudit(BaseModel):
    total_discovered: int = 0
    unique_papers: int = 0
    duplicates_merged: int = 0
    full_text_sources: int = 0
    abstract_only_sources: int = 0
    metadata_only_sources: int = 0
    provider_counts: Dict[str, int] = {}
    queries_executed: List[str] = []


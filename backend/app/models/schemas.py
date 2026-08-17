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

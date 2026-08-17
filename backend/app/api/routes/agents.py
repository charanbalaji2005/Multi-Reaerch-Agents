from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.core.database import get_db

router = APIRouter()

AGENT_DESCRIPTIONS = {
    "coordinator": {
        "name": "Coordinator Agent",
        "icon": "🎯",
        "description": "Orchestrates all agents, manages task flow and communication",
        "capabilities": ["Task orchestration", "Agent communication", "Workflow management"],
    },
    "research": {
        "name": "Research Agent",
        "icon": "🔍",
        "description": "Searches the web and academic sources for relevant information",
        "capabilities": ["Web search", "Paper extraction", "Source validation"],
    },
    "summarizer": {
        "name": "Summarizer Agent",
        "icon": "📝",
        "description": "Condenses and analyzes research findings into key insights",
        "capabilities": ["Text summarization", "Key insight extraction", "Content analysis"],
    },
    "diagram": {
        "name": "Diagram Agent",
        "icon": "🗺️",
        "description": "Creates visual diagrams, flowcharts, and mind maps",
        "capabilities": ["Flowchart generation", "Mind maps", "Architecture diagrams"],
    },
    "presentation": {
        "name": "Presentation Agent",
        "icon": "🎨",
        "description": "Generates professional presentation slides",
        "capabilities": ["Slide creation", "Layout design", "Content structuring"],
    },
    "report": {
        "name": "Report Agent",
        "icon": "📊",
        "description": "Produces comprehensive research reports with citations",
        "capabilities": ["Report writing", "Citation formatting", "Executive summaries"],
    },
}


@router.get("/")
async def get_agents(current_user: dict = Depends(get_current_user)):
    return AGENT_DESCRIPTIONS


@router.get("/status/{project_id}")
async def get_agent_status(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    from bson import ObjectId
    project = await db.research_projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        return {"agents_status": {}}
    return {
        "project_id": project_id,
        "project_status": project["status"],
        "agents_status": project.get("agents_status", {}),
    }

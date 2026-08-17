from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from datetime import datetime
from bson import ObjectId
from typing import Optional, List
import os
import aiofiles

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.schemas import (
    ResearchCreate, ResearchProjectResponse, ProjectStatus, AgentStatus,
    ReportResponse, SlidesResponse, DiagramResponse, ChatRequest, ChatResponse
)
from app.services.ai_client import generate
from app.services.orchestrator import ResearchOrchestrator

router = APIRouter()


def obj_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")


@router.post("/create", status_code=201)
async def create_research(
    background_tasks: BackgroundTasks,
    topic: str = Form(...),
    description: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    research_mode: Optional[str] = Form("literature_review"),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    user_id = str(current_user["_id"])

    # Save uploaded file
    file_path = None
    if file:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".pdf", ".docx", ".txt"]:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        filename = f"{ObjectId()}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(await file.read())

    # Create project
    project_doc = {
        "user_id": user_id,
        "topic": topic,
        "description": description,
        "url": url,
        "file_path": file_path,
        "research_mode": research_mode,
        "status": ProjectStatus.PENDING,
        "agents_status": {
            "coordinator": AgentStatus.IDLE,
            "planner": AgentStatus.IDLE,
            "literature": AgentStatus.IDLE,
            "evidence": AgentStatus.IDLE,
            "verifier": AgentStatus.IDLE,
            "critic": AgentStatus.IDLE,
            "report": AgentStatus.IDLE,
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "documents": [file.filename] if file else [],
        "has_report": False,
        "has_slides": False,
        "has_diagram": False,
        "integrity_score": None,
    }

    result = await db.research_projects.insert_one(project_doc)
    project_id = str(result.inserted_id)

    # Update user projects count
    await db.users.update_one({"_id": current_user["_id"]}, {"$inc": {"projects_count": 1}})

    # Start orchestration in background
    background_tasks.add_task(
        ResearchOrchestrator.run,
        project_id=project_id,
        topic=topic,
        description=description,
        url=url,
        file_path=file_path,
        research_mode=research_mode or "literature_review",
    )

    return {"id": project_id, "status": "pending", "message": "Research started"}


@router.get("/list")
async def list_projects(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = str(current_user["_id"])

    cursor = db.research_projects.find(
        {"user_id": user_id},
        sort=[("created_at", -1)],
        limit=50,
    )
    projects = []
    async for p in cursor:
        projects.append({
            "id": str(p["_id"]),
            "topic": p["topic"],
            "status": p["status"],
            "created_at": p["created_at"].isoformat(),
            "has_report": p.get("has_report", False),
            "has_slides": p.get("has_slides", False),
            "has_diagram": p.get("has_diagram", False),
            "integrity_score": p.get("integrity_score"),
        })
    return projects


@router.get("/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    project = await db.research_projects.find_one({"_id": obj_id(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project["id"] = str(project.pop("_id"))
    project["created_at"] = project["created_at"].isoformat()
    project["updated_at"] = project["updated_at"].isoformat()
    return project


@router.get("/{project_id}/report")
async def get_report(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    report = await db.reports.find_one({"project_id": project_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not ready yet")
    report["id"] = str(report.pop("_id"))
    report["created_at"] = report["created_at"].isoformat()
    return report


@router.get("/{project_id}/slides")
async def get_slides(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    slides = await db.slides.find_one({"project_id": project_id})
    if not slides:
        raise HTTPException(status_code=404, detail="Slides not ready yet")
    slides["id"] = str(slides.pop("_id"))
    slides["created_at"] = slides["created_at"].isoformat()
    return slides


@router.get("/{project_id}/diagram")
async def get_diagram(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    diagram = await db.diagrams.find_one({"project_id": project_id})
    if not diagram:
        raise HTTPException(status_code=404, detail="Diagram not ready yet")
    diagram["id"] = str(diagram.pop("_id"))
    diagram["created_at"] = diagram["created_at"].isoformat()
    return diagram


@router.get("/{project_id}/evidence")
async def get_evidence(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.evidence_items.find_one({"project_id": project_id})
    if not doc:
        return []
    return doc.get("evidence", [])


@router.get("/{project_id}/verifications")
async def get_verifications(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.claim_verifications.find_one({"project_id": project_id})
    if not doc:
        return []
    return doc.get("verifications", [])


@router.get("/{project_id}/sources")
async def get_sources(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.literature_sources.find_one({"project_id": project_id})
    if not doc:
        return []
    return doc.get("sources", [])


@router.get("/{project_id}/critiques")
async def get_critiques(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.critiques.find_one({"project_id": project_id})
    if not doc:
        return []
    return doc.get("critiques", [])


@router.get("/{project_id}/cost")
async def get_cost(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.cost_summaries.find_one({"project_id": project_id})
    if not doc:
        return {
            "total_tokens": 0,
            "total_cost_usd": 0.0,
            "total_execution_time_s": 0.0,
            "agent_breakdown": [],
        }
    doc.pop("_id", None)
    return doc


@router.get("/{project_id}/plan")
async def get_plan(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.research_plans.find_one({"project_id": project_id})
    if not doc:
        return {}
    return doc.get("plan", {})


@router.get("/{project_id}/logs")
async def get_logs(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.agent_logs.find(
        {"project_id": project_id},
        sort=[("timestamp", 1)],
    )
    logs = []
    async for log in cursor:
        log["id"] = str(log.pop("_id"))
        log["timestamp"] = log["timestamp"].isoformat()
        logs.append(log)
    return logs


@router.post("/{project_id}/chat", response_model=ChatResponse)
async def chat_with_research(project_id: str, request: ChatRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    # Ensure project belongs to user
    project = await db.research_projects.find_one({"_id": obj_id(project_id), "user_id": str(current_user["_id"])})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    report = await db.reports.find_one({"project_id": project_id})
    if not report:
        raise HTTPException(status_code=400, detail="Report not ready yet")

    # Context string
    context = f"Title: {report.get('title')}\nExecutive Summary: {report.get('executive_summary')}\n"
    if report.get('findings'):
        context += "Findings:\n" + "\n".join([f"- {f['section']}: {f['content']}" for f in report['findings']])
    if report.get('key_insights'):
        context += "Key Insights:\n" + "\n".join([f"- {k}" for k in report['key_insights']])
    if report.get('critic_evaluation'):
        context += f"\nCritic Audit:\n{report.get('critic_evaluation')}\n"

    system_prompt = (
        "You are an AI research assistant for ResearchGuard AI. You are answering queries regarding an auditable scientific report. "
        "Your task is to answer the user's questions about this specific research report in a helpful, "
        "accurate, and scientifically grounded manner. Use clear citations and distinguish between verified findings and critic warnings.\n\n"
        f"--- RESEARCH REPORT ---\n{context}\n--- END REPORT ---"
    )

    answer = await generate(system=system_prompt, user_prompt=request.question, max_tokens=1500)
    return ChatResponse(answer=answer)


@router.post("/agent-chat", response_model=ChatResponse)
async def chat_with_specialized_agent(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Direct conversation with any of the 6 specialized scientific agents."""
    agent_type = request.get("agent", "planner")
    question = request.get("question", "")
    project_id = request.get("project_id")

    if not question.trim() if hasattr(question, "trim") else not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    context_str = ""
    if project_id:
        try:
            db = get_db()
            project = await db.research_projects.find_one({"_id": obj_id(project_id), "user_id": str(current_user["_id"])})
            if project:
                context_str = f"Current Project Context: {project.get('topic')}\n"
        except Exception:
            pass

    AGENT_PROMPTS = {
        "planner": (
            "You are the Lead Scientific Research Planner Agent for ResearchGuard AI. "
            "Your role is to formulate Boolean search strategies, define target cohorts, establish inclusion/exclusion criteria, "
            "and construct research matrices with utmost academic rigor. "
            "Always organize answers with clear structure, Markdown tables where relevant, and Boolean search queries."
        ),
        "literature": (
            "You are the Academic Literature Search Agent for ResearchGuard AI. "
            "You specialize in PubMed MeSH queries, arXiv Atom searches, IEEE Xplore, Crossref DOI registries, and Semantic Scholar. "
            "Provide precise academic references, Boolean operators, DOI syntax, and source quality classifications."
        ),
        "evidence": (
            "You are the Empirical Evidence Extraction Agent for ResearchGuard AI. "
            "You specialize in extracting statistical parameters: hazard ratios, odds ratios, p-values, confidence intervals (95% CI), "
            "sample sizes (N), and cohort endpoints. Format study comparisons using Markdown tables."
        ),
        "verifier": (
            "You are the Citation Grounding & Verification Agent for ResearchGuard AI. "
            "Your role is to audit claims against primary literature, check for fake or hallucinated DOIs, verify if the cited text "
            "genuinely supports the conclusion, and assign calibration verdicts: SUPPORTED, PARTIALLY_SUPPORTED, CONTRADICTED, or UNSUPPORTED."
        ),
        "critic": (
            "You are the Adversarial Peer Review Critic Agent for ResearchGuard AI. "
            "Your role is to aggressively stress-test methodology, detect correlation vs causation fallacies, identify small sample sizes, "
            "point out missing control groups, publication biases, and confounding variables. Be critical, constructive, and uncompromising."
        ),
        "writer": (
            "You are the Scientific Synthesis & Report Writer Agent for ResearchGuard AI. "
            "You synthesize audited evidence into executive summaries, key findings, and structured scientific dossiers. "
            "Use formal academic tone, clear headings, Markdown tables, and verified citations."
        ),
    }

    system_prompt = AGENT_PROMPTS.get(agent_type, AGENT_PROMPTS["planner"])
    if context_str:
        system_prompt += f"\n\n{context_str}"

    answer = await generate(system=system_prompt, user_prompt=question, max_tokens=1800)
    return ChatResponse(answer=answer)


@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.research_projects.delete_one({"_id": obj_id(project_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.reports.delete_many({"project_id": project_id})
    await db.slides.delete_many({"project_id": project_id})
    await db.diagrams.delete_many({"project_id": project_id})
    await db.evidence_items.delete_many({"project_id": project_id})
    await db.claim_verifications.delete_many({"project_id": project_id})
    await db.literature_sources.delete_many({"project_id": project_id})
    await db.critiques.delete_many({"project_id": project_id})
    await db.research_plans.delete_many({"project_id": project_id})
    await db.cost_summaries.delete_many({"project_id": project_id})
    await db.agent_logs.delete_many({"project_id": project_id})
    await db.users.update_one({"_id": current_user["_id"]}, {"$inc": {"projects_count": -1}})
    return {"message": "Project deleted"}

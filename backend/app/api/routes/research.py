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
from app.services.orchestrator import ResearchOrchestrator, extract_text_from_file

router = APIRouter()


def obj_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")


@router.post("/extract-text")
async def extract_text_from_upload(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Extract text from an uploaded PDF, DOCX or TXT without needing a project. Used for Fresh Mode chat."""
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".pdf", ".docx", ".txt", ".md"]
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}. Supported: PDF, DOCX, TXT")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"tmp_{ObjectId()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    content_bytes = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content_bytes)

    try:
        extracted_text = extract_text_from_file(file_path)
    except Exception as e:
        extracted_text = ""
    finally:
        # Clean up temp file
        try:
            os.remove(file_path)
        except Exception:
            pass

    if not extracted_text:
        return {"extracted_text": "", "characters": 0, "status": "empty", "filename": file.filename}

    return {
        "extracted_text": extracted_text,
        "characters": len(extracted_text),
        "status": "ok",
        "filename": file.filename
    }


@router.post("/{project_id}/upload-document")
async def upload_project_document(
    project_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a research paper, PDF, DOCX, TXT or image to an active research investigation."""
    db = get_db()
    project = await db.research_projects.find_one({"_id": obj_id(project_id), "user_id": str(current_user["_id"])})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = [".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg"]
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}. Supported: PDF, DOCX, TXT, PNG, JPG")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"{ObjectId()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    content_bytes = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content_bytes)

    extracted_text = ""
    status = "Ready"
    image_analysis_data = {}

    if ext == ".pdf":
        try:
            extracted_text = extract_text_from_file(file_path)
            if not extracted_text:
                status = "Unable to extract readable text from this PDF."
                extracted_text = "Unable to extract readable text from this PDF."
        except Exception as e:
            status = f"Unable to extract readable text from this PDF: {str(e)}"
            extracted_text = "Unable to extract readable text from this PDF."
    elif ext in [".docx", ".txt"]:
        try:
            extracted_text = extract_text_from_file(file_path)
            if not extracted_text:
                status = "No text content found in document."
        except Exception as e:
            status = f"Error extracting document text: {str(e)}"
    elif ext in [".png", ".jpg", ".jpeg"]:
        from app.services.image_analyzer import analyze_scientific_image
        img_res = await analyze_scientific_image(file_path, file.filename, user_id=str(current_user["_id"]))
        extracted_text = img_res.get("full_summary", "Image analysis is currently unavailable with the configured model.")
        status = img_res.get("status", "Ready")
        image_analysis_data = img_res

    file_doc = {
        "id": str(ObjectId()),
        "filename": file.filename,
        "file_type": ext.replace(".", "").upper(),
        "file_size": len(content_bytes),
        "file_path": file_path,
        "status": status,
        "extracted_text": extracted_text,
        "image_analysis": image_analysis_data,
        "characters": len(extracted_text),
        "uploaded_at": datetime.utcnow().isoformat(),
    }

    await db.research_projects.update_one(
        {"_id": obj_id(project_id)},
        {
            "$push": {"uploaded_files": file_doc, "documents": file.filename},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    return file_doc


@router.get("/{project_id}/files")
async def get_project_files(project_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve all uploaded documents and files associated with this research investigation."""
    db = get_db()
    project = await db.research_projects.find_one({"_id": obj_id(project_id), "user_id": str(current_user["_id"])})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.get("uploaded_files", [])


@router.get("/{project_id}/chat-history")
async def get_project_chat_history(project_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve full conversation history for this research investigation from MongoDB."""
    db = get_db()
    cursor = db.agent_chats.find({"user_id": str(current_user["_id"]), "project_id": project_id}).sort("timestamp", 1).limit(100)
    messages = []
    async for doc in cursor:
        messages.append({
            "id": str(doc["_id"]),
            "role": doc["role"],
            "content": doc["content"],
            "timestamp": doc["timestamp"].isoformat() if isinstance(doc.get("timestamp"), datetime) else str(doc.get("timestamp")),
            "agent": doc.get("agent", "Luminar AI"),
        })
    return messages


@router.post("/{project_id}/chat", response_model=ChatResponse)
async def chat_with_research(project_id: str, request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """Unified conversational intelligence with full memory of previous research context & uploaded files."""
    db = get_db()
    project = None
    if project_id and project_id not in ["new", "general", "null", "undefined"]:
        try:
            project = await db.research_projects.find_one({"_id": obj_id(project_id), "user_id": str(current_user["_id"])})
        except Exception:
            project = None

    report = {}
    sources_list = []
    evidence_list = []
    uploaded_files = []

    if project:
        report = await db.reports.find_one({"project_id": project_id}) or {}
        sources_doc = await db.literature_sources.find_one({"project_id": project_id}) or {}
        evidence_doc = await db.evidence_items.find_one({"project_id": project_id}) or {}
        sources_list = sources_doc.get("sources", [])
        evidence_list = evidence_doc.get("evidence", [])
        uploaded_files = project.get("uploaded_files", [])

    # Build comprehensive research context
    context_blocks = []
    if project:
        context_blocks.append(f"Research Topic: {project.get('topic')}")
        if project.get('description'):
            context_blocks.append(f"Description: {project.get('description')}")
        if report.get('title'):
            context_blocks.append(f"Verified Report Title: {report.get('title')}")
        if report.get('executive_summary'):
            context_blocks.append(f"Executive Summary: {report.get('executive_summary')}")
        if report.get('findings'):
            findings_str = "\n".join([f"- {f.get('section')}: {f.get('content')}" for f in report.get('findings', [])[:6]])
            context_blocks.append(f"Primary Findings:\n{findings_str}")
        if report.get('critic_evaluation'):
            context_blocks.append(f"Critic Audit & Limitations: {report.get('critic_evaluation')}")

        if sources_list:
            sources_str = "\n".join([
                f"[{idx+1}] {s.get('title')} ({s.get('year', 2024)}) - {s.get('source_platform', 'Academic')}. DOI: {s.get('doi', 'N/A')}. URL: {s.get('url', 'N/A')}"
                for idx, s in enumerate(sources_list[:12])
            ])
            context_blocks.append(f"Verified Sources & Bibliography:\n{sources_str}")

        if evidence_list:
            ev_str = "\n".join([
                f"- Claim: {e.get('claim')} | Metric: {e.get('metric', '')} | Effect: {e.get('effect_size', '')} | p-value: {e.get('p_value', '')} | Sample N: {e.get('sample_size', '')}"
                for e in evidence_list[:8]
            ])
            context_blocks.append(f"Extracted Empirical Metrics:\n{ev_str}")

    # Add uploaded documents / papers text
    if request.file_text:
        context_blocks.append(f"--- NEWLY UPLOADED DOCUMENT ({request.file_name or 'Uploaded File'}) ---\n{request.file_text[:8000]}\n--- END UPLOADED DOCUMENT ---")
    elif uploaded_files:
        for uf in uploaded_files[-3:]:
            if uf.get("extracted_text") and uf.get("extracted_text") not in ["Unable to extract readable text from this PDF.", ""]:
                context_blocks.append(f"--- ATTACHED WORKSPACE FILE ({uf.get('filename')}) ---\n{uf.get('extracted_text')[:4000]}\n--- END ATTACHED FILE ---")

    full_context = "\n\n".join(context_blocks) if context_blocks else "General Scientific Research Workspace."

    system_prompt = (
        "You are Luminar AI (ResearchGuard AI), an elite scientific research intelligence assistant and autonomous co-pilot. "
        "You help researchers investigate complex scientific questions, formulate search strategies, audit literature, extract empirical metrics, "
        "and compare newly uploaded trials/manuscripts against existing evidence.\n\n"
        "GUIDELINES:\n"
        "1. Communicate warmly, intelligently, and clearly. Handle standard greetings and conversation naturally while offering concrete research assistance.\n"
        "2. When discussing research questions, ground your analysis in peer-reviewed scientific literature, empirical methodologies, and statistical principles.\n"
        "3. When referencing sources, provide exact clickable markdown links: DOIs [DOI: 10.xxxx/...](https://doi.org/10.xxxx/...), PubMed URLs (https://pubmed.ncbi.nlm.nih.gov/...), or arXiv links (https://arxiv.org/abs/...). NEVER hallucinate fake URLs.\n"
        "4. Format comparisons, statistical data (hazard ratios, p-values, 95% CI), and structured answers using clean GFM Markdown tables.\n"
        "5. CRITICAL: If document content is provided under '--- NEWLY UPLOADED DOCUMENT ---' or '--- ATTACHED WORKSPACE FILE ---' in the research context, you MUST read it carefully and thoroughly. Extract key findings, methodology, sample sizes, limitations, and conclusions from the document. Reference specific passages from the document in your response.\n"
        "6. If a document appears to contain clinical trial, systematic review, or meta-analysis data, proactively extract CONSORT-style metrics: N, intervention, control, endpoints, HR/OR/RR, 95% CI, p-values.\n\n"
        f"=== RESEARCH CONTEXT ===\n{full_context}\n=== END RESEARCH CONTEXT ==="
    )

    answer = await generate(system=system_prompt, user_prompt=request.question, max_tokens=1800)

    # Persist chat dialogue to database
    try:
        await db.agent_chats.insert_many([
            {
                "user_id": str(current_user["_id"]),
                "project_id": project_id if project else "general",
                "agent": "Luminar AI",
                "role": "user",
                "content": request.question,
                "timestamp": datetime.utcnow(),
            },
            {
                "user_id": str(current_user["_id"]),
                "project_id": project_id if project else "general",
                "agent": "Luminar AI",
                "role": "assistant",
                "content": answer,
                "timestamp": datetime.utcnow(),
            }
        ])
    except Exception as e:
        print(f"Chat persistence warning: {e}")

    return ChatResponse(answer=answer)


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


@router.post("/agent-chat", response_model=ChatResponse)
async def chat_with_specialized_agent(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Direct conversation with any of the 6 specialized scientific agents with persistent DB history."""
    agent_type = request.get("agent", "planner")
    question = request.get("question", "")
    project_id = request.get("project_id")

    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    db = get_db()
    context_str = ""
    if project_id:
        try:
            project = await db.research_projects.find_one({"_id": obj_id(project_id), "user_id": str(current_user["_id"])})
            if project:
                context_str = f"Current Project Context: {project.get('topic')}\n"
        except Exception:
            pass

    AGENT_PROMPTS = {
        "planner": (
            "You are the Lead Scientific Research Planner Agent for ResearchGuard AI. "
            "Your scope is strictly academic and scientific research planning. "
            "Formulate Boolean search strategies, define target cohorts, establish inclusion/exclusion criteria, "
            "and construct research matrices. Organize answers with Markdown tables and Boolean queries. "
            "Always include direct academic discovery links (e.g. PubMed https://pubmed.ncbi.nlm.nih.gov/?term=..., arXiv https://arxiv.org/abs/..., DOI https://doi.org/...). "
            "If asked off-topic non-research questions, politely decline and refocus on scientific research."
        ),
        "literature": (
            "You are the Academic Literature Search Agent for ResearchGuard AI. "
            "Your scope is strictly scientific literature retrieval. "
            "Provide precise academic references, Boolean operators, MeSH queries, DOI links (https://doi.org/...), "
            "PubMed links (https://pubmed.ncbi.nlm.nih.gov/...), and arXiv links (https://arxiv.org/abs/...). "
            "Classify source quality and include clickable URLs for every referenced study."
        ),
        "evidence": (
            "You are the Empirical Evidence Extraction Agent for ResearchGuard AI. "
            "Your scope is strictly empirical data analysis: hazard ratios, odds ratios, p-values, confidence intervals (95% CI), "
            "sample sizes (N), and quantitative endpoints. Format study comparisons using Markdown tables and provide source DOI/PubMed links."
        ),
        "verifier": (
            "You are the Citation Grounding & Verification Agent for ResearchGuard AI. "
            "Your scope is strictly auditing claims against primary literature, validating DOIs, detecting fake citations, "
            "and assigning verdicts: SUPPORTED, PARTIALLY_SUPPORTED, CONTRADICTED, or UNSUPPORTED. "
            "Always cite full DOIs with active links (https://doi.org/...) and verify grounding."
        ),
        "critic": (
            "You are the Adversarial Peer Review Critic Agent for ResearchGuard AI. "
            "Your scope is strictly methodological stress-testing, identifying confounding variables, survival bias, "
            "correlation vs causation fallacies, and sample size limitations. Be critical, constructive, and scientifically grounded."
        ),
        "writer": (
            "You are the Scientific Synthesis & Report Writer Agent for ResearchGuard AI. "
            "Your scope is strictly synthesizing audited scientific evidence into structured IMRaD reports and executive briefings. "
            "Use formal academic tone, structured headings, Markdown tables, and verified citations with links."
        ),
    }

    system_prompt = AGENT_PROMPTS.get(agent_type, AGENT_PROMPTS["planner"])
    if context_str:
        system_prompt += f"\n\n{context_str}"

    answer = await generate(system=system_prompt, user_prompt=question, max_tokens=1800)

    # Persist chat history to database
    try:
        await db.agent_chats.insert_many([
            {
                "user_id": str(current_user["_id"]),
                "project_id": project_id,
                "agent": agent_type,
                "role": "user",
                "content": question,
                "timestamp": datetime.utcnow(),
            },
            {
                "user_id": str(current_user["_id"]),
                "project_id": project_id,
                "agent": agent_type,
                "role": "assistant",
                "content": answer,
                "timestamp": datetime.utcnow(),
            }
        ])
    except Exception as e:
        print(f"Agent chat persistence warning: {e}")

    return ChatResponse(answer=answer)


@router.get("/agent-chat/history")
async def get_agent_chat_history(
    agent: str = "planner",
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve saved chat history for this user and agent from MongoDB."""
    db = get_db()
    query = {"user_id": str(current_user["_id"]), "agent": agent}
    if project_id:
        query["project_id"] = project_id
    cursor = db.agent_chats.find(query).sort("timestamp", 1).limit(50)
    messages = []
    async for doc in cursor:
        messages.append({
            "id": str(doc["_id"]),
            "role": doc["role"],
            "content": doc["content"],
            "timestamp": doc["timestamp"].isoformat() if isinstance(doc.get("timestamp"), datetime) else str(doc.get("timestamp")),
            "agent": doc.get("agent"),
        })
    return messages


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

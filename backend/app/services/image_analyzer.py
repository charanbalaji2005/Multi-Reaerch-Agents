"""
Scientific Image & Figure Understanding Service for ResearchGuard AI.
Uses Groq Vision (qwen/qwen3.6-27b) and Gemini Vision to interpret scientific charts,
Kaplan-Meier survival curves, forest plots, biochemical pathways, and tables.
Enforces a daily limit of 2 image analyses per user.
"""
import os
import re
import base64
from datetime import datetime
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.database import get_db
from app.services.ai_client import get_groq_client, get_gemini_client


async def check_and_increment_daily_image_quota(user_id: str) -> bool:
    """
    Enforce 2 images per user daily limit.
    Returns True if permitted, False if limit exceeded.
    """
    if not user_id:
        return True

    db = get_db()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    record = await db.daily_image_usage.find_one({"user_id": user_id, "date": today_str})

    if record and record.get("count", 0) >= 2:
        return False

    await db.daily_image_usage.update_one(
        {"user_id": user_id, "date": today_str},
        {"$inc": {"count": 1}, "$setOnInsert": {"created_at": datetime.utcnow()}},
        upsert=True
    )
    return True


async def analyze_scientific_image(file_path: str, filename: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Perform deep scientific figure / chart interpretation on uploaded images using Groq Qwen Vision.
    Enforces a strict 2 image/day quota per user.
    """
    if not os.path.exists(file_path):
        return {
            "status": "error",
            "full_summary": f"Image file not found: {filename}",
            "observations": [],
        }

    # 1. Enforce Daily Quota (2 images / user / day)
    if user_id:
        permitted = await check_and_increment_daily_image_quota(user_id)
        if not permitted:
            return {
                "status": "Quota Exceeded",
                "image_type": "Scientific Image",
                "full_summary": "Daily image analysis quota reached (2 images/day limit per user). You can continue analyzing PDF, DOCX, TXT documents or asking research questions.",
                "observations": ["Daily image limit (2/2) reached. Quota resets at 00:00 UTC."],
                "limitations": "Daily usage limit reached.",
            }

    # Read and base64 encode image
    with open(file_path, "rb") as f:
        image_bytes = f.read()

    ext = os.path.splitext(file_path)[1].lower().replace(".", "")
    if ext == "jpg":
        ext = "jpeg"
    mime_type = f"image/{ext}" if ext in ["png", "jpeg", "webp", "gif"] else "image/png"
    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    prompt = (
        "You are the Scientific Visual Extraction Agent for ResearchGuard AI (Luminar AI). "
        "Analyze this scientific chart, figure, or biomedical diagram with rigorous precision. "
        "Provide:\n"
        "1. FIGURE TYPE: (e.g. Kaplan-Meier survival curve, Forest plot meta-analysis, Bar chart with error bars, Scatter plot, Biochemical signaling pathway, Clinical flow diagram)\n"
        "2. AXES, COHORTS & VARIABLES: Exact x-axis, y-axis labels, units, sample size (N), and intervention vs control groups\n"
        "3. QUANTITATIVE TRENDS & VALUES: Hazard ratios (HR), relative risks (RR), p-values, 95% confidence intervals, and percentage changes visible in the graph\n"
        "4. SCIENTIFIC TAKEAWAY: Core empirical conclusion and whether the data supports or contradicts the research hypothesis\n"
        "5. METHODOLOGICAL LIMITATIONS: Missing error bars, truncated axes, or potential presentation bias."
    )

    # 2. Try Groq Vision with Qwen 3.6 27B
    groq_client = get_groq_client()
    if groq_client:
        try:
            response = await groq_client.chat.completions.create(
                model="qwen/qwen3.6-27b",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64_image}"}},
                        ],
                    }
                ],
                max_tokens=1800,
                temperature=0.2,
            )
            raw_content = response.choices[0].message.content or ""
            # Strip <think>...</think> reasoning blocks from Qwen
            cleaned = re.sub(r"<think>[\s\S]*?</think>", "", raw_content).strip()
            if cleaned:
                return {
                    "status": "Ready",
                    "image_type": "Scientific Chart / Figure (Groq Vision)",
                    "full_summary": cleaned,
                    "observations": [line.strip() for line in cleaned.split("\n") if line.strip() and not line.startswith("#")][:6],
                    "limitations": "Visual data extracted from uploaded raster figure via Groq Qwen Vision.",
                }
        except Exception as groq_err:
            print(f"[ImageAnalyzer] Groq Vision error: {groq_err}. Trying Gemini fallback...")

    # 3. Fallback to Gemini Vision if available
    gemini_client = get_gemini_client()
    if gemini_client:
        try:
            import asyncio
            from google.genai import types

            def _call_gemini():
                part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                resp = gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[part, prompt],
                )
                return resp.text

            loop = asyncio.get_event_loop()
            gemini_text = await loop.run_in_executor(None, _call_gemini)
            if gemini_text:
                return {
                    "status": "Ready",
                    "image_type": "Scientific Chart / Figure (Gemini Vision)",
                    "full_summary": gemini_text.strip(),
                    "observations": [line.strip() for line in gemini_text.split("\n") if line.strip() and not line.startswith("#")][:6],
                    "limitations": "Visual data extracted from uploaded raster figure.",
                }
        except Exception as gem_err:
            print(f"[ImageAnalyzer] Gemini Vision error: {gem_err}")

    # 4. Graceful offline notice
    return {
        "status": "unavailable",
        "image_type": "Scientific Image",
        "full_summary": "Image analysis is currently unavailable with the configured model.",
        "observations": ["Image uploaded to workspace."],
        "limitations": "Visual OCR/Vision analysis currently unavailable.",
    }

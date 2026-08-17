"""
Scientific Image & Figure Understanding Service for ResearchGuard AI.
Analyzes uploaded scientific charts, figures, Kaplan-Meier curves, and tables using configured vision models.
Extracts empirical trends, labels, p-values, sample sizes, and methodological caveats.
"""
import os
import base64
from typing import Dict, Any, Optional
from app.services.ai_client import get_gemini_client


async def analyze_scientific_image(file_path: str, filename: str) -> Dict[str, Any]:
    """
    Perform deep scientific figure / chart interpretation on uploaded images.
    Returns structured visual findings or graceful unavailable notice.
    """
    if not os.path.exists(file_path):
        return {
            "status": "error",
            "full_summary": f"Image file not found: {filename}",
            "observations": [],
        }

    gemini_client = get_gemini_client()
    if not gemini_client:
        return {
            "status": "unavailable",
            "full_summary": "Image analysis is currently unavailable with the configured model.",
            "image_type": "Scientific Image",
            "observations": ["Visual model not configured. Please supply GEMINI_API_KEY for deep chart and figure extraction."],
            "limitations": "Automated OCR/vision requires configured vision credentials.",
        }

    try:
        import asyncio
        from google.genai import types

        with open(file_path, "rb") as f:
            image_bytes = f.read()

        mime_type = "image/png"
        ext = os.path.splitext(file_path)[1].lower()
        if ext in [".jpg", ".jpeg"]:
            mime_type = "image/jpeg"

        prompt = (
            "You are the Scientific Visual Extraction Agent for ResearchGuard AI (Luminar AI). "
            "Analyze this scientific chart, figure, or biomedical diagram with rigorous precision. "
            "Provide:\n"
            "1. FIGURE TYPE: (e.g. Kaplan-Meier survival curve, Forest plot meta-analysis, Bar chart with error bars, Scatter plot, Biochemical signaling pathway, Clinical flow diagram)\n"
            "2. AXES & COHORTS: Exact x-axis, y-axis labels, units, sample size (N), and intervention vs control groups\n"
            "3. STATISTICAL DATA & ENDPOINTS: Hazard ratios (HR), relative risks (RR), p-values, 95% confidence intervals, and percentage changes visible in the graph\n"
            "4. SCIENTIFIC FINDINGS: Core empirical takeaway and whether the data supports or contradicts the paper's hypothesis\n"
            "5. METHODOLOGICAL LIMITATIONS: Missing error bars, truncated axes, or potential presentation bias."
        )

        def _call_vision():
            part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            resp = gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[part, prompt],
            )
            return resp.text

        loop = asyncio.get_event_loop()
        extracted_text = await loop.run_in_executor(None, _call_vision)

        return {
            "status": "Ready",
            "image_type": "Scientific Chart / Figure",
            "full_summary": extracted_text,
            "observations": [line.strip() for line in extracted_text.split("\n") if line.strip() and not line.startswith("#")][:6],
            "limitations": "Visual data extracted from uploaded raster figure.",
        }
    except Exception as e:
        print(f"[ImageAnalyzer] Vision interpretation error: {e}")
        return {
            "status": "unavailable",
            "full_summary": "Image analysis is currently unavailable with the configured model.",
            "error": str(e),
        }

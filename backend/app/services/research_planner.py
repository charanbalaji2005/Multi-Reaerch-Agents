"""
Research Planner Agent for ResearchGuard AI.
Deconstructs a user research question into rigorous sub-questions, targeted academic queries,
and scientific evidence criteria.
"""
from typing import Optional, Dict, Any, Tuple
import json
from app.services.ai_client import generate_with_usage, clean_json_response

class ResearchPlannerAgent:
    NAME = "planner"

    async def run(
        self,
        topic: str,
        description: Optional[str] = None,
        url: Optional[str] = None,
        file_content: Optional[str] = None,
        research_mode: str = "literature_review"
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Generate structured research plan and academic search strategy.
        Returns (research_plan_dict, usage_stats).
        """
        context_parts = []
        if description:
            context_parts.append(f"Additional User Context: {description}")
        if url:
            context_parts.append(f"Target Reference URL: {url}")
        if file_content:
            context_parts.append(f"Uploaded Manuscript / Document Template Context:\n{file_content[:8000]}")
        context_str = "\n".join(context_parts)

        system_prompt = (
            "You are the Lead Scientific Research Planner for ResearchGuard AI, a multi-agent verification system. "
            "Your objective is to formalize the user's research inquiry into a rigorous scientific investigation plan. "
            "You must formulate focused sub-questions, generate precise academic search queries tailored for PubMed, arXiv, "
            "Semantic Scholar, and Crossref, and define explicit evidence quality requirements. "
            "Always output valid JSON only."
        )

        user_prompt = f"""Research Inquiry: "{topic}"
Research Mode: {research_mode}
{context_str}

Deconstruct this inquiry into an exhaustive, structured scientific research plan.
Formulate:
1. `research_question`: Precise formalized scientific question.
2. `domain`: Scientific field/discipline (e.g. Molecular Biology, Oncology, Cryptography, Distributed Systems).
3. `sub_questions`: 4-6 specific analytical sub-questions covering clinical/empirical evidence, populations studied, measured endpoints, and potential contradictory/null findings.
4. `search_queries`: 4-6 academic search query strings designed for PubMed/Semantic Scholar/arXiv (use Boolean operators and scientific terminology).
5. `evidence_requirements`: List of study types required (e.g. "Randomized Controlled Trials (RCT)", "Systematic Reviews & Meta-Analyses", "Cohort Studies", "Empirical Benchmarks").
6. `hypothesis_or_focus`: Core hypothesis or objective being tested.
7. `critical_risk_areas`: Potential methodological biases, confounding variables, or common pitfalls to scrutinize.

Return ONLY a valid JSON object with these exact keys:
- research_question (string)
- domain (string)
- sub_questions (list of strings)
- search_queries (list of strings)
- evidence_requirements (list of strings)
- hypothesis_or_focus (string)
- critical_risk_areas (list of strings)
"""

        raw_text, usage = await generate_with_usage(
            system=system_prompt,
            user_prompt=user_prompt,
            max_tokens=2500,
            json_mode=True
        )

        try:
            plan = clean_json_response(raw_text)
        except Exception:
            # Fallback plan
            plan = {
                "research_question": topic,
                "domain": "Interdisciplinary Science",
                "sub_questions": [
                    f"What empirical evidence exists regarding {topic}?",
                    "What methodologies and study designs have been employed?",
                    "What quantitative outcomes and effect sizes were measured?",
                    "Are there contradictory or conflicting findings in the literature?"
                ],
                "search_queries": [
                    f"{topic} meta-analysis systematic review",
                    f"{topic} clinical trial empirical study",
                    f"{topic} outcomes mechanisms evaluation",
                    f"{topic} contradictory evidence limitations"
                ],
                "evidence_requirements": [
                    "Randomized Controlled Trials (RCTs)",
                    "Systematic Reviews and Meta-Analyses",
                    "Peer-reviewed empirical studies"
                ],
                "hypothesis_or_focus": f"Investigating evidence quality and validity for: {topic}",
                "critical_risk_areas": [
                    "Sample size limitations",
                    "Correlation vs causation conflation",
                    "Publication bias"
                ]
            }

        # Ensure search_queries is present and not empty
        if not plan.get("search_queries"):
            plan["search_queries"] = [topic, f"{topic} study", f"{topic} systematic review"]

        return plan, usage

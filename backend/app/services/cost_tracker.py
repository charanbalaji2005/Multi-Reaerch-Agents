"""
Cost and Token Tracker for ResearchGuard AI.
Tracks per-agent and global token usage, execution latency, and estimated cost in USD.
"""
from typing import Dict, Any, List
from datetime import datetime

class CostTracker:
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.agent_metrics: Dict[str, Dict[str, Any]] = {}
        self.total_prompt_tokens = 0
        self.total_completion_tokens = 0
        self.total_tokens = 0
        self.total_cost_usd = 0.0
        self.start_time = datetime.utcnow()

    def record_usage(self, agent_name: str, usage: Dict[str, Any], duration_s: float = 0.0):
        """Record token usage and execution stats for a specific agent."""
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)
        total_tokens = usage.get("total_tokens", prompt_tokens + completion_tokens)
        cost = usage.get("estimated_cost_usd", 0.0)
        model = usage.get("model", "llama-3.3-70b-versatile")
        latency = usage.get("latency_s", duration_s)

        if agent_name not in self.agent_metrics:
            self.agent_metrics[agent_name] = {
                "agent_name": agent_name,
                "model": model,
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
                "estimated_cost_usd": 0.0,
                "execution_time_s": 0.0,
                "calls_count": 0,
            }

        m = self.agent_metrics[agent_name]
        m["prompt_tokens"] += prompt_tokens
        m["completion_tokens"] += completion_tokens
        m["total_tokens"] += total_tokens
        m["estimated_cost_usd"] = round(m["estimated_cost_usd"] + cost, 6)
        m["execution_time_s"] = round(m["execution_time_s"] + latency, 2)
        m["calls_count"] += 1
        m["model"] = model

        self.total_prompt_tokens += prompt_tokens
        self.total_completion_tokens += completion_tokens
        self.total_tokens += total_tokens
        self.total_cost_usd = round(self.total_cost_usd + cost, 6)

    def get_summary(
        self,
        sources_count: int = 0,
        evidence_count: int = 0,
        verified_count: int = 0,
        verifications_count: int = 0,
        verdicts: Dict[str, int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Produce the complete Run Summary document for API and UI."""
        total_duration = round((datetime.utcnow() - self.start_time).total_seconds(), 2)
        final_verified = verified_count or verifications_count
        
        return {
            "project_id": self.project_id,
            "total_tokens": self.total_tokens,
            "total_prompt_tokens": self.total_prompt_tokens,
            "total_completion_tokens": self.total_completion_tokens,
            "total_cost_usd": self.total_cost_usd,
            "total_execution_time_s": total_duration,
            "agents_count": len(self.agent_metrics),
            "sources_analyzed": sources_count,
            "evidence_items": evidence_count,
            "claims_verified": verified_count,
            "verdicts_breakdown": verdicts or {
                "supported": 0,
                "partially_supported": 0,
                "contradicted": 0,
                "unsupported": 0,
            },
            "agent_breakdown": list(self.agent_metrics.values()),
            "timestamp": datetime.utcnow().isoformat(),
        }

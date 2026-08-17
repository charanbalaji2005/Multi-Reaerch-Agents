"""
AI Client for ResearchGuard AI.
Provides asynchronous LLM inference with token tracking, cost calculation, and robust JSON parsing.
Supports Groq (Llama 3.3 70B) and Google Gemini with automatic fallback.
"""
import time
import json
import re
from typing import Tuple, Dict, Any, Optional
from app.core.config import settings

# Groq Async Client
_groq_client = None
_gemini_client = None


def get_groq_client():
    global _groq_client
    if _groq_client is None and settings.GROQ_API_KEY:
        from groq import AsyncGroq
        _groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _groq_client


def get_gemini_client():
    global _gemini_client
    if _gemini_client is None and settings.GEMINI_API_KEY:
        from google import genai
        _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _gemini_client


def clean_json_response(raw_text: str) -> Any:
    """
    Strips markdown code blocks, extracts JSON payload, and parses into dict or list.
    """
    if not raw_text:
        raise ValueError("Empty response text")

    text = raw_text.strip()

    # Remove markdown code fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try finding first [ or { and matching end
    first_bracket = text.find('[')
    first_brace = text.find('{')

    if first_bracket != -1 and (first_brace == -1 or first_bracket < first_brace):
        # Starts with array
        last_bracket = text.rfind(']')
        if last_bracket != -1 and last_bracket > first_bracket:
            substring = text[first_bracket:last_bracket + 1]
            return json.loads(substring)

    if first_brace != -1:
        # Starts with object
        last_brace = text.rfind('}')
        if last_brace != -1 and last_brace > first_brace:
            substring = text[first_brace:last_brace + 1]
            return json.loads(substring)

    raise ValueError(f"Could not extract valid JSON from text: {text[:200]}")


async def generate_with_usage(
    system: str,
    user_prompt: str,
    max_tokens: int = 4000,
    json_mode: bool = False,
) -> Tuple[str, Dict[str, Any]]:
    """
    Call LLM with system prompt, returning generated text and token/cost usage metrics.
    """
    start_time = time.time()
    groq_client = get_groq_client()

    if groq_client:
        try:
            model_name = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
            messages = [
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt}
            ]

            kwargs = {
                "model": model_name,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.2,
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}

            response = await groq_client.chat.completions.create(**kwargs)
            duration = time.time() - start_time

            content = response.choices[0].message.content or ""
            usage_obj = response.usage
            prompt_tokens = usage_obj.prompt_tokens if usage_obj else len(system + user_prompt) // 4
            completion_tokens = usage_obj.completion_tokens if usage_obj else len(content) // 4
            total_tokens = usage_obj.total_tokens if usage_obj else (prompt_tokens + completion_tokens)

            # Llama 3.3 70B pricing: ~$0.59 / 1M prompt, ~$0.79 / 1M completion
            cost = round((prompt_tokens * 0.00000059) + (completion_tokens * 0.00000079), 6)

            usage_metrics = {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "estimated_cost_usd": max(cost, 0.00005),
                "latency_s": round(duration, 2),
                "model": model_name,
            }
            return content, usage_metrics
        except Exception as e:
            print(f"Groq primary model error: {e}. Attempting llama-3.1-8b-instant fallback...")
            try:
                kwargs["model"] = "llama-3.1-8b-instant"
                response = await groq_client.chat.completions.create(**kwargs)
                duration = time.time() - start_time
                content = response.choices[0].message.content or ""
                usage_obj = response.usage
                prompt_tokens = usage_obj.prompt_tokens if usage_obj else len(system + user_prompt) // 4
                completion_tokens = usage_obj.completion_tokens if usage_obj else len(content) // 4
                total_tokens = usage_obj.total_tokens if usage_obj else (prompt_tokens + completion_tokens)
                return content, {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens,
                    "estimated_cost_usd": 0.00008,
                    "latency_s": round(duration, 2),
                    "model": "llama-3.1-8b-instant",
                }
            except Exception as fb_err:
                print(f"Groq fallback model error: {fb_err}")

    # Fallback to Gemini if configured
    gemini_client = get_gemini_client()
    if gemini_client:
        try:
            import asyncio
            from google.genai import types
            loop = asyncio.get_event_loop()

            def _call():
                resp = gemini_client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system,
                        max_output_tokens=max_tokens,
                    )
                )
                return resp.text

            content = await loop.run_in_executor(None, _call)
            duration = time.time() - start_time
            prompt_tokens = len(system + user_prompt) // 4
            completion_tokens = len(content) // 4

            return content, {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
                "estimated_cost_usd": 0.0003,
                "latency_s": round(duration, 2),
                "model": "gemini-2.5-flash",
            }
        except Exception as e:
            print(f"Gemini API fallback error: {e}")

    # If no LLM available or both failed
    duration = time.time() - start_time
    return "{}", {
        "prompt_tokens": 100,
        "completion_tokens": 50,
        "total_tokens": 150,
        "estimated_cost_usd": 0.0,
        "latency_s": round(duration, 2),
        "model": "offline-fallback",
    }


async def generate(system: str, user_prompt: str, max_tokens: int = 4096) -> str:
    """
    Standard generation function returning plain text string.
    """
    text, _ = await generate_with_usage(system, user_prompt, max_tokens=max_tokens)
    return text

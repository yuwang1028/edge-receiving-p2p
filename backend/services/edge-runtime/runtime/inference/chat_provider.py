"""Text-chat provider for the per-console copilot — mode-aware like extraction:
  gcp / online -> Vertex Gemini
  offline      -> local Ollama text model (qwen2.5:7b)

Online falls back to local on failure, so the copilot always answers (we have a
local text model). Returns the assistant's text given OpenAI-style messages
([{role, content}], role in system|user|assistant)."""

from __future__ import annotations

from ..settings import settings


def ollama_chat_raw(messages: list[dict], tools: list[dict] | None = None) -> dict:
    """One Ollama /api/chat turn. Returns the raw assistant message dict, which
    may carry `tool_calls` — the building block of the agent loop."""
    import httpx

    payload: dict = {
        "model": settings.local_chat_model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.2},
    }
    if tools:
        payload["tools"] = tools
    r = httpx.post(settings.local_llm_url.rstrip("/") + "/api/chat", json=payload, timeout=120.0)
    r.raise_for_status()
    return r.json().get("message", {}) or {}


def _ollama_chat(messages: list[dict]) -> str:
    return (ollama_chat_raw(messages).get("content", "") or "").strip()


def _vertex_chat(messages: list[dict]) -> str:
    from google import genai
    from google.genai import types

    if not settings.gcp_project:
        raise RuntimeError("GCP_PROJECT not set")
    client = genai.Client(vertexai=True, project=settings.gcp_project, location=settings.gcp_location)
    system = "\n".join(m["content"] for m in messages if m["role"] == "system")
    convo = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in messages if m["role"] != "system"
    )
    resp = client.models.generate_content(
        model=settings.vertex_model,
        contents=[convo],
        config=types.GenerateContentConfig(
            temperature=0.2, system_instruction=system or None
        ),
    )
    return (resp.text or "").strip()


def chat(messages: list[dict], *, online: bool) -> str:
    if online:
        try:
            return _vertex_chat(messages)
        except Exception:
            pass  # fall back to local so the copilot always answers
    return _ollama_chat(messages)

"""Reusable agent loop — reason → call tool → observe → repeat → answer.

Every per-console copilot uses this: the model isn't handed pre-fetched facts, it
DECIDES which read-tools to call against the real backend, sees the results, and
loops until it produces a final answer. Two backends, same tool set:
  offline -> Ollama tool-calling (manual loop)
  gcp     -> Vertex Gemini automatic function calling

Tools are read/propose only — they never execute money actions (those go through
the guarded endpoints + human confirmation)."""

from __future__ import annotations

import json

from ..inference import chat_provider
from ..settings import settings

MAX_STEPS = 5


def run_ollama_agent(messages: list[dict], tool_specs: list[dict], tool_impls: dict) -> str:
    for _ in range(MAX_STEPS):
        msg = chat_provider.ollama_chat_raw(messages, tools=tool_specs)
        tool_calls = msg.get("tool_calls") or []
        if not tool_calls:
            return (msg.get("content") or "").strip()
        messages.append({"role": "assistant", "content": msg.get("content") or "", "tool_calls": tool_calls})
        for tc in tool_calls:
            fn = tc.get("function", {}) or {}
            name = fn.get("name", "")
            impl = tool_impls.get(name)
            try:
                out = impl() if impl else f"unknown tool: {name}"
            except Exception as e:  # tool failures are observations, not crashes
                out = f"tool error: {e}"
            messages.append({
                "role": "tool",
                "name": name,
                "content": out if isinstance(out, str) else json.dumps(out, default=str),
            })
    # Out of steps — make one final answer without tools.
    return (chat_provider.ollama_chat_raw(messages).get("content") or "").strip()


def run_vertex_agent(system: str, messages: list[dict], tool_callables: list) -> str:
    """Vertex Gemini with automatic function calling — the SDK runs the loop,
    invoking the same python tool callables."""
    from google import genai
    from google.genai import types

    if not settings.gcp_project:
        raise RuntimeError("GCP_PROJECT not set")
    client = genai.Client(vertexai=True, project=settings.gcp_project, location=settings.gcp_location)
    convo = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in messages if m["role"] != "system")
    resp = client.models.generate_content(
        model=settings.vertex_model,
        contents=[convo],
        config=types.GenerateContentConfig(
            system_instruction=system or None, tools=tool_callables, temperature=0.2
        ),
    )
    return (resp.text or "").strip()

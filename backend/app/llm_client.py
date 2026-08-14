"""Thin wrapper around the LLM for the agent loop.

Unlike project 1/2, where we forced exactly one tool call and read the result,
here the model chooses *which* tool to call (or none) on every turn. This
module only knows how to send messages + tool schemas and hand back whatever
the model decided - the looping logic itself lives in agent.py.
"""

import os

from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=os.environ["GROQ_API_KEY"],
            base_url="https://api.groq.com/openai/v1",
            timeout=60.0,
            max_retries=2,
        )
    return _client


def _model() -> str:
    return os.environ.get("LLM_MODEL", "llama-3.3-70b-versatile")


def next_step(messages: list[dict], tools: list[dict]):
    """Ask the model what to do next, given the conversation so far.

    Returns the raw assistant message object. It may contain `tool_calls`
    (the model wants to use a tool) or just `content` (the model is done and
    is giving its final answer as text).
    """
    response = _get_client().chat.completions.create(
        model=_model(),
        messages=messages,
        tools=tools,
        tool_choice="auto",  # the key difference from project 1/2: model decides
    )
    return response.choices[0].message

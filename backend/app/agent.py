"""The agent loop itself.

Shape: give the model a starting URL and a goal. On every turn it either calls
a tool (fetch_page to look at a page, finish_report to stop) or the loop
force-stops after MAX_STEPS. That cap is deliberate - without it, a confused
model could call fetch_page forever and never finish. Real "retries and
failure handling" means: the model seeing an error and adapting (handled by
tools.run_tool returning errors as text), AND the loop itself never hanging.
"""

from dataclasses import dataclass, field

from . import llm_client, tools

MAX_STEPS = 6
STEP_RETRIES = 2  # Groq/Llama occasionally emits a malformed tool call (400,
# "tool_use_failed") - this is a known, documented quirk, not a real outage. Asking
# again almost always works, so we retry a couple of times before treating the whole
# run as failed.

SYSTEM_PROMPT = """You are a competitor research assistant.

Given a company's URL, research it using the fetch_page tool and produce a short,
factual report. Rules:
- Only state what you actually read on a fetched page. Never guess a price or
  feature that wasn't in the text.
- Start with the URL you were given. If it looks like a homepage and you need
  pricing, try following an obvious pricing URL (e.g. /pricing, /plans) - you may
  fetch up to 4 pages total.
- If a page fails to load, try one alternative URL, then move on rather than
  retrying the same URL repeatedly.
- When you have enough information (or you've tried reasonably and pricing
  genuinely isn't public), call finish_report exactly once. Do not call it before
  fetching at least one page.
"""


@dataclass
class Report:
    summary: str
    pricing_summary: str
    key_findings: list[str]
    pages_visited: list[str]
    ok: bool = True
    error: str | None = None


def _to_message_dict(msg) -> dict:
    """Convert the SDK's message object into a plain dict we can append to history."""
    d = {"role": "assistant", "content": msg.content}
    if msg.tool_calls:
        d["tool_calls"] = [
            {
                "id": tc.id,
                "type": "function",
                "function": {"name": tc.function.name, "arguments": tc.function.arguments},
            }
            for tc in msg.tool_calls
        ]
    return d


def research(url: str) -> Report:
    import json

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Research this competitor: {url}"},
    ]

    for step in range(MAX_STEPS):
        msg = None
        last_error: Exception | None = None
        for attempt in range(STEP_RETRIES + 1):
            try:
                msg = llm_client.next_step(messages, tools.TOOLS)
                break
            except Exception as e:
                last_error = e

        if msg is None:
            # The model/API call kept failing even after retries - now it's a real
            # outage, not a one-off glitch. Nothing more to try.
            return Report(
                summary="", pricing_summary="", key_findings=[], pages_visited=[],
                ok=False, error=f"LLM call failed after {STEP_RETRIES + 1} attempts: {last_error}",
            )

        messages.append(_to_message_dict(msg))

        if not msg.tool_calls:
            # Model answered in plain text instead of calling finish_report. Nudge it
            # once rather than silently accepting an unstructured answer.
            messages.append({
                "role": "user",
                "content": "Please call the finish_report tool with your findings.",
            })
            continue

        for call in msg.tool_calls:
            name = call.function.name
            args = json.loads(call.function.arguments)

            if name == "finish_report":
                return Report(
                    summary=args["summary"],
                    pricing_summary=args["pricing_summary"],
                    key_findings=args["key_findings"],
                    pages_visited=args["pages_visited"],
                )

            result = tools.run_tool(name, args)
            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": result,
            })

    # Ran out of steps without a finish_report call - a real failure mode to show,
    # not hide.
    return Report(
        summary="", pricing_summary="", key_findings=[], pages_visited=[],
        ok=False, error=f"Gave up after {MAX_STEPS} steps without finishing.",
    )

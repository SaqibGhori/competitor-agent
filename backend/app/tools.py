"""The two tools the agent is allowed to use, and how to run them.

Only two, on purpose:
- `fetch_page` - the agent's only way to see a real page (built on browser.py).
- `finish_report` - how the agent signals "I'm done" and hands back its findings
  in a structured shape, instead of just trailing off in prose. Same idea as the
  `answered`/`is_invoice` escape hatches in projects 1 and 2: give the model an
  explicit, structured way to stop.
"""

from . import browser

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "fetch_page",
            "description": (
                "Load a URL in a real browser and return its visible text. Use this to "
                "read the competitor's homepage, then follow it to a pricing or features "
                "page if one is linked. If a page fails to load, try a different URL "
                "(e.g. site.com/pricing) rather than giving up."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Full URL to load, including https://",
                    }
                },
                "required": ["url"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "finish_report",
            "description": (
                "Call this when you have enough information to summarise the "
                "competitor. This ends the research - only call it once."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "summary": {
                        "type": "string",
                        "description": "2-3 sentences: what the company/product does.",
                    },
                    "pricing_summary": {
                        "type": "string",
                        "description": (
                            "What you found about pricing. If no pricing page was "
                            "reachable or pricing isn't public, say so explicitly - "
                            "do not guess a number."
                        ),
                    },
                    "key_findings": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "3-5 short, concrete observations (features, positioning, target audience).",
                    },
                    "pages_visited": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Every URL you actually fetched during research.",
                    },
                },
                "required": ["summary", "pricing_summary", "key_findings", "pages_visited"],
            },
        },
    },
]


def run_tool(name: str, arguments: dict) -> str:
    """Execute a tool call and return its result as a string for the model to read.

    Errors are returned as text (not raised) so the agent loop can see "that
    failed" and decide what to do next, the same failure-handling shape as
    browser.py's PageResult.error.
    """
    if name == "fetch_page":
        result = browser.fetch_page(arguments["url"])
        if not result.ok:
            return f"ERROR fetching {arguments['url']}: {result.error}"
        return f"Title: {result.title}\n\n{result.text}"

    return f"ERROR: unknown tool '{name}'"

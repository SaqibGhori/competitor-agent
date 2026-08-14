"""Gradio wrapper used for the Hugging Face Space deployment.

Free HF hosting runs Gradio, not a plain ASGI server (Docker Spaces need a card), so
production serves the exact same agent through Gradio instead of FastAPI. The FastAPI
app in app/main.py is the real API and still runs locally with uvicorn.
"""

import truststore

truststore.inject_into_ssl()

from dotenv import load_dotenv

# On the Space these come from the Space's secrets/variables; locally from .env.
load_dotenv()

import subprocess

import gradio as gr
import spaces

# The Space's free Gradio SDK build has no hook to run arbitrary setup commands, so
# the Chromium binary Playwright needs is fetched here, once, at cold start, rather
# than at build time. System-level libraries it needs (fonts, libnss3, etc.) are
# installed separately at build time via packages.txt - this call only fetches the
# browser binary itself, which needs no root.
subprocess.run(["playwright", "install", "chromium"], check=True)

from app.agent import research as run_research


@spaces.GPU
def _gpu_placeholder():
    # ZeroGPU hardware requires at least one @spaces.GPU function to exist.
    # Nothing here needs a GPU - the LLM runs on Groq, the browser is headless
    # Chromium on CPU - so this is never called.
    pass


def research(url: str) -> dict:
    """Research a competitor's site: browse it, then report back what was found."""
    url = (url or "").strip()
    if not url:
        return {"error": "Please enter a URL."}
    if not (url.startswith("http://") or url.startswith("https://")):
        url = f"https://{url}"

    try:
        report = run_research(url)
    except Exception as e:
        return {"error": f"Could not research this right now: {e}"}

    if not report.ok:
        return {"error": report.error}

    return {
        "summary": report.summary,
        "pricing_summary": report.pricing_summary,
        "key_findings": report.key_findings,
        "pages_visited": report.pages_visited,
    }


demo = gr.Interface(
    fn=research,
    inputs=gr.Textbox(label="Competitor URL", placeholder="https://a-competitor.com"),
    outputs=gr.JSON(label="Research report"),
    title="Competitor Research Agent",
    description=(
        "Give it a URL. The agent decides for itself which pages to open (a pricing "
        "page, a plans page) and stops once it has enough to report. Everything it "
        "says came from a page it actually opened."
    ),
    examples=[
        ["https://plausible.io"],
        ["https://tally.so"],
    ],
    flagging_mode="never",
)

if __name__ == "__main__":
    demo.launch()

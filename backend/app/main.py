import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

from app.agent import research

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    url: HttpUrl


@app.get("/health")
async def health():
    return {"status": "ok"}


# Deliberately a sync `def`, not `async def`. research() calls Playwright's sync API
# (via browser.py), which raises immediately if it detects it's running inside an
# active asyncio event loop - which an `async def` route would be. A plain `def`
# route makes FastAPI run it in a worker thread instead, sidestepping the conflict.
@app.post("/research")
def research_endpoint(req: ResearchRequest):
    report = research(str(req.url))

    if not report.ok:
        # The agent itself already tried and gave up (max steps, or the LLM kept
        # failing even after retries) - that is a clean, expected failure mode, not
        # a server bug, so it is reported as a normal error response, not a 500.
        raise HTTPException(status_code=502, detail=report.error)

    return {
        "summary": report.summary,
        "pricing_summary": report.pricing_summary,
        "key_findings": report.key_findings,
        "pages_visited": report.pages_visited,
    }

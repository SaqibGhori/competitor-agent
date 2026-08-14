# Competitor Research Agent

Give it a URL. The agent browses the site itself - deciding which pages to open next
(a pricing page, a plans page) - and stops once it has enough to report. Built with
React + FastAPI + an agent loop over a real headless browser.

## How it's different from projects 1 and 2

Projects 1 and 2 are a fixed pipeline: input goes in, exactly one LLM call happens,
structured output comes out. This project is a **loop**: on every turn the model
chooses to either call a tool (open a page) or finish with a structured report - never
both, never neither - until it decides it has enough, or a hard step cap forces it to
stop. That's what makes it an agent rather than a single-shot call.

```
URL in → agent loop (fetch_page tool ⇄ model decides what's next) → finish_report tool → JSON report
```

- **Frontend:** React + TypeScript (Vite) + Tailwind CSS
- **Backend:** Python + FastAPI
- **Browser:** Playwright (Chromium), headless - the agent's only way to see the internet
- **AI:** Llama 3.3 70B via Groq (OpenAI-compatible API), tool calling with `tool_choice: "auto"` so the model itself picks the next action

## Report fields

`summary`, `pricing_summary`, `key_findings`, `pages_visited`

## Failure handling (the actual point of this project)

- A hard step cap (`MAX_STEPS = 6`) so a confused model can never browse forever
- A page that fails to load is reported as failed text back to the model, which is
  told to try one alternative URL rather than retry the same one forever
- Groq occasionally returns a malformed tool call (a real, documented API quirk, not
  an outage) - retried transparently once before surfacing an error
- If the model runs out of steps without calling `finish_report`, that's returned as
  a clean, honest failure - not hidden, not guessed around

## Run locally

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
playwright install chromium
cp .env.example .env    # then fill in your key
uvicorn app.main:app --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `GROQ_API_KEY` | backend | Groq inference key |
| `LLM_MODEL` | backend | Model ID (e.g. `llama-3.3-70b-versatile`) |
| `FRONTEND_ORIGIN` | backend | Allowed CORS origin(s), comma-separated |
| `VITE_API_URL` | frontend | Backend base URL (defaults to local dev server) |

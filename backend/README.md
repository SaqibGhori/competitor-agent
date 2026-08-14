---
title: Competitor Research Agent
emoji: 🔎
colorFrom: blue
colorTo: gray
sdk: gradio
sdk_version: 6.24.0
app_file: app.py
pinned: false
license: mit
---

Give it a competitor's URL. The agent decides for itself which pages to open (a
pricing page, a plans page) and stops once it has enough to report — it never states
anything it did not actually read on a page it opened.

Built as an agent loop: on every turn the model either calls a tool (open a page,
finish with a report) or the loop force-stops, so a confused model can never browse
forever. Retries are handled explicitly rather than hidden — a flaky tool call is
retried; a page that fails to load is reported as failed, not guessed around.

Code: https://github.com/SaqibGhori/competitor-agent

"""The agent's one window onto the outside world: fetch a page's text and a screenshot.

This is deliberately the only way the agent touches the internet. Every tool the
agent loop can call is built on top of this function, which keeps the failure
handling (timeouts, bad URLs, blocked sites) in one place instead of scattered
across every tool.

Uses Playwright rather than a plain HTTP fetch because competitor sites are
frequently JS-rendered (pricing tables built client-side) - a raw requests.get()
would often return an empty shell.
"""

from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = Path(__file__).resolve().parent.parent / "data" / "screenshots"
NAV_TIMEOUT_MS = 20_000
MAX_TEXT_CHARS = 15_000  # keep individual pages from blowing out the LLM context
MIN_TEXT_CHARS = 30  # below this, treat the page as having no real content


@dataclass
class PageResult:
    url: str
    title: str
    text: str
    screenshot_path: str | None
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.error is None


def fetch_page(url: str, screenshot: bool = True) -> PageResult:
    """Load a URL in a real browser, return its visible text (and optionally a screenshot).

    Failures (bad URL, timeout, site blocks bots) are returned as a PageResult with
    `error` set rather than raised - the agent loop needs to see and reason about a
    failed fetch ("this page doesn't exist, try a different URL") rather than crash.

    Two failure modes found by testing against real sites (facebook.com/plans,
    facebook.com/pricing) are treated as errors rather than quiet successes, because
    a "successful" fetch that actually taught the agent nothing is worse than an
    honest failure - the agent would otherwise report a page as "visited" when it
    read either nothing or a different site entirely:
    - The page redirected to a different domain (guessed URLs like "/pricing" often
      land on an unrelated site rather than a real 404).
    - The page loaded but rendered no real text (JS-only content, a bot wall).
    """
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            page.goto(url, timeout=NAV_TIMEOUT_MS, wait_until="domcontentloaded")
            page.wait_for_timeout(1000)  # let client-side rendering settle

            requested_host = urlparse(url).netloc.removeprefix("www.")
            final_host = urlparse(page.url).netloc.removeprefix("www.")
            if requested_host and final_host and requested_host != final_host:
                browser.close()
                return PageResult(
                    url=url, title="", text="", screenshot_path=None,
                    error=f"Redirected away to a different site ({page.url}) - this is not {requested_host}'s content.",
                )

            title = page.title()
            text = page.inner_text("body")[:MAX_TEXT_CHARS]

            if len(text.strip()) < MIN_TEXT_CHARS:
                browser.close()
                return PageResult(
                    url=url, title=title, text="", screenshot_path=None,
                    error="Page loaded but had no readable text (likely JS-only content or a bot wall).",
                )

            screenshot_path = None
            if screenshot:
                safe_name = "".join(c if c.isalnum() else "_" for c in url)[:80]
                screenshot_path = str(SCREENSHOT_DIR / f"{safe_name}.png")
                page.screenshot(path=screenshot_path, full_page=False)

            browser.close()
            return PageResult(url=url, title=title, text=text, screenshot_path=screenshot_path)

    except Exception as e:
        return PageResult(url=url, title="", text="", screenshot_path=None, error=str(e))

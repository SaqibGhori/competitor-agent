"""One-off manual test: run the agent against a real URL and print the report."""

from dotenv import load_dotenv

load_dotenv()

from app.agent import research

if __name__ == "__main__":
    import sys

    url = sys.argv[1] if len(sys.argv) > 1 else "https://gdpr-citations.vercel.app"
    report = research(url)

    print("--- REPORT ---")
    print("ok:", report.ok)
    if not report.ok:
        print("error:", report.error)
    else:
        print("summary:", report.summary)
        print("pricing:", report.pricing_summary)
        print("findings:")
        for f in report.key_findings:
            print(" -", f)
        print("pages visited:", report.pages_visited)

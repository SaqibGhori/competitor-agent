import { useState, type FormEvent } from 'react'
import { researchCompetitor, type Report } from './api'

const EXAMPLES = ['https://plausible.io', 'https://gdpr-citations.vercel.app', 'https://tally.so']

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const result = await researchCompetitor(url.trim())
      setReport(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <span className="font-semibold">Competitor Research Agent</span>
          <div className="flex gap-4 text-sm text-slate-500">
            <a
              className="hover:text-slate-900"
              href="https://github.com/SaqibGhori/competitor-agent"
              target="_blank"
              rel="noreferrer"
            >
              Source
            </a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">
          Give it a URL. It browses the site, decides what matters, and reports back.
        </h1>
        <p className="mt-3 text-slate-600">
          This isn't a fixed pipeline like a form-filler - the AI decides for itself which
          pages to open next (a pricing page, a plans page) and stops once it has enough to
          report. Everything it says came from a page it actually opened; if pricing genuinely
          isn't public, it says so instead of guessing.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex gap-2">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://a-competitor.com"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Researching…' : 'Research'}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setUrl(ex)}
              className="underline decoration-dotted hover:text-slate-900"
              type="button"
            >
              {ex.replace('https://', '')}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Browsing the site live - this usually takes 15-40 seconds while the agent
            fetches and reads pages.
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {report && (
          <div className="mt-8 space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Summary
              </h2>
              <p className="mt-2 text-slate-800">{report.summary}</p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pricing
              </h2>
              <p className="mt-2 text-slate-800">{report.pricing_summary}</p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Key findings
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-800">
                {report.key_findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Pages the agent actually visited
              </h2>
              <ul className="mt-2 space-y-1 text-sm">
                {report.pages_visited.map((p) => (
                  <li key={p}>
                    <a
                      href={p}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-600 underline hover:text-slate-900"
                    >
                      {p}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        <section className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-500">
          <h2 className="mb-2 font-semibold text-slate-700">How it's built</h2>
          <p>
            An agent loop: on every turn the model chooses to either open a page (a tool call)
            or finish with a structured report - never both, never neither, and never more
            than a few pages before it must stop. It is only ever allowed to state what it
            actually read; nothing is filled in from general knowledge.
          </p>
        </section>
      </main>
    </div>
  )
}

export default App

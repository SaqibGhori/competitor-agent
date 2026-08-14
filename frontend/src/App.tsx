import { useEffect, useState, type FormEvent } from 'react'
import { researchCompetitor, type Report } from './api'

const EXAMPLES = ['plausible.io', 'gdpr-citations.vercel.app', 'tally.so']

const LOOP_STEPS = [
  'Opening the page…',
  'Reading what it actually says…',
  'Deciding whether to look further…',
  'Following a pricing link…',
  'Writing the report…',
]

function GlobeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 12h18M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9s1.3-6.3 3.8-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function LoopBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-500" />
      </span>
      Agent loop, not a fixed pipeline
    </span>
  )
}

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!loading) return
    setStepIndex(0)
    const id = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, LOOP_STEPS.length - 1))
    }, 3200)
    return () => clearInterval(id)
  }, [loading])

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
    <div className="min-h-screen bg-[#fafafa] text-slate-900">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(124,58,237,0.10),rgba(250,250,250,0))]" />

      <nav className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
              <GlobeIcon className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Competitor Research Agent</span>
          </div>
          <a
            className="text-sm text-slate-500 transition hover:text-slate-900"
            href="https://github.com/SaqibGhori/competitor-agent"
            target="_blank"
            rel="noreferrer"
          >
            Source ↗
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-14">
        <LoopBadge />

        <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-[2.75rem]">
          Give it a URL.
          <br />
          <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
            It browses the site itself
          </span>{' '}
          and reports back.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600">
          Not a form-filler with a fixed script — on every step the model decides what
          to do next: open a pricing page, follow a plans link, or stop and write the
          report. Everything it says came from a page it actually opened; if pricing
          genuinely isn't public, it says so instead of guessing.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] transition focus-within:border-slate-300 focus-within:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_32px_-12px_rgba(124,58,237,0.35)]">
            <GlobeIcon className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://a-competitor.com"
              className="w-full bg-transparent py-2 text-sm placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Researching…' : 'Research'}
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setUrl(`https://${ex}`)}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              type="button"
            >
              {ex}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                <span className="absolute h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">{LOOP_STEPS[stepIndex]}</p>
                <p className="text-xs text-slate-400">Live in a real headless browser · usually 15-40s</p>
              </div>
            </div>
            <div className="mt-4 flex gap-1.5">
              {LOOP_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                    i <= stepIndex ? 'bg-violet-500' : 'bg-slate-100'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {report && (
          <div className="mt-10 space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">
                Summary
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-slate-800">{report.summary}</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">
                Pricing
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-slate-800">
                {report.pricing_summary}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">
                Key findings
              </h2>
              <ul className="mt-3 space-y-2">
                {report.key_findings.map((f, i) => (
                  <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-800">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Pages the agent actually visited
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {report.pages_visited.map((p) => (
                  <a
                    key={p}
                    href={p}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <GlobeIcon className="h-3 w-3" />
                    {p.replace(/^https?:\/\//, '')}
                  </a>
                ))}
              </div>
            </section>
          </div>
        )}

        <section className="mt-20 border-t border-slate-200 pt-10">
          <h2 className="text-sm font-semibold text-slate-800">How it's built</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['1', 'Open a page', 'A tool call to a real headless browser — the only way the agent sees the internet.'],
              ['2', 'Decide', 'On every turn the model chooses: read further, or it already knows enough.'],
              ['3', 'Report, verified', 'Only pages it actually, successfully read are listed as sources — never taken on its word.'],
            ].map(([n, title, body]) => (
              <div key={n} className="rounded-xl border border-slate-200 bg-white p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                  {n}
                </span>
                <p className="mt-2.5 text-sm font-medium text-slate-800">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App

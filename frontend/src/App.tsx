import { useEffect, useRef, useState, type FormEvent } from 'react'
import { researchCompetitor, type Report } from './api'

const EXAMPLES = ['plausible.io', 'gdpr-citations.vercel.app', 'tally.so']

const LOG_LINES = [
  { icon: '→', text: 'fetch_page(url)', tone: 'text-violet-300' },
  { icon: '✓', text: 'page loaded · reading visible text', tone: 'text-emerald-400' },
  { icon: '•', text: 'model deciding next step…', tone: 'text-slate-400' },
  { icon: '→', text: 'fetch_page(pricing_url)', tone: 'text-violet-300' },
  { icon: '✓', text: 'pricing found · verifying source', tone: 'text-emerald-400' },
  { icon: '■', text: 'finish_report()', tone: 'text-fuchsia-300' },
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

function SparkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />
    </svg>
  )
}

function useCursorGlow() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.left = `${e.clientX}px`
        ref.current.style.top = `${e.clientY}px`
      }
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return ref
}

function GlassCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <section
      className="animate-fade-up rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition-colors hover:border-white/[0.14]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </section>
  )
}

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [lineIndex, setLineIndex] = useState(0)
  const glowRef = useCursorGlow()

  useEffect(() => {
    if (!loading) return
    setLineIndex(0)
    const id = setInterval(() => {
      setLineIndex((i) => Math.min(i + 1, LOG_LINES.length - 1))
    }, 2600)
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#060608] text-white selection:bg-violet-500/30">
      {/* cursor glow */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed z-30 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06] blur-[90px] transition-transform duration-100"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }}
      />
      <div className="grain-overlay" />

      {/* background blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-blob absolute -top-40 left-[10%] h-[520px] w-[520px] rounded-full bg-violet-600/25 blur-[120px]" />
        <div className="animate-blob-slow absolute top-20 right-[5%] h-[480px] w-[480px] rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="animate-blob absolute bottom-0 left-[30%] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%)',
          }}
        />
      </div>

      <nav className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#060608]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_20px_-4px_rgba(168,85,247,0.7)]">
              <GlobeIcon className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-[15px] font-semibold tracking-tight">
              Competitor Research Agent
            </span>
          </div>
          <a
            className="text-sm text-slate-400 transition hover:text-white"
            href="https://github.com/SaqibGhori/competitor-agent"
            target="_blank"
            rel="noreferrer"
          >
            Source ↗
          </a>
        </div>
      </nav>

      <main className="relative mx-auto max-w-3xl px-6 pb-28 pt-16">
        <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
          <SparkIcon className="h-3 w-3" />
          Agent loop, not a fixed pipeline
        </span>

        <h1 className="font-display animate-fade-up mt-6 text-[2.75rem] font-semibold leading-[1.1] tracking-tight sm:text-6xl" style={{ animationDelay: '80ms' }}>
          Give it a URL.
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
            It browses the site
          </span>{' '}
          and reports back.
        </h1>
        <p className="animate-fade-up mt-5 max-w-xl text-[15px] leading-relaxed text-slate-400" style={{ animationDelay: '160ms' }}>
          Not a form-filler with a fixed script — on every step the model decides what
          to do next: open a pricing page, follow a plans link, or stop and write the
          report. Everything it says came from a page it actually opened; if pricing
          genuinely isn't public, it says so instead of guessing.
        </p>

        <form
          onSubmit={handleSubmit}
          className="animate-fade-up mt-9"
          style={{ animationDelay: '240ms' }}
        >
          <div className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl transition focus-within:border-violet-400/40 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_4px_rgba(168,85,247,0.12)]">
            <GlobeIcon className="ml-2 h-4 w-4 shrink-0 text-slate-500 transition group-focus-within:text-violet-300" />
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://a-competitor.com"
              className="font-mono w-full bg-transparent py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="shrink-0 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_-6px_rgba(168,85,247,0.8)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Researching…' : 'Research →'}
            </button>
          </div>
        </form>

        <div
          className="animate-fade-up mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500"
          style={{ animationDelay: '300ms' }}
        >
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setUrl(`https://${ex}`)}
              className="font-mono rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-slate-400 transition hover:border-violet-400/30 hover:text-violet-200"
              type="button"
            >
              {ex}
            </button>
          ))}
        </div>

        {loading && (
          <div className="animate-fade-up mt-10 overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
            <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              <span className="font-mono ml-3 text-xs text-slate-500">agent — running</span>
            </div>
            <div className="font-mono space-y-2.5 px-5 py-5 text-[13px]">
              {LOG_LINES.slice(0, lineIndex + 1).map((line, i) => (
                <div key={i} className="animate-fade-up flex items-center gap-2.5">
                  <span className={line.tone}>{line.icon}</span>
                  <span className="text-slate-300">{line.text}</span>
                  {i === lineIndex && (
                    <span className="animate-caret text-violet-400">▍</span>
                  )}
                </div>
              ))}
            </div>
            <div className="h-[3px] w-full bg-white/[0.04]">
              <div
                className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-300 transition-all duration-700 ease-out"
                style={{ width: `${((lineIndex + 1) / LOG_LINES.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="animate-fade-up mt-10 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {report && (
          <div className="mt-10 space-y-4">
            <GlassCard delay={0}>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">
                Summary
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-slate-200">{report.summary}</p>
            </GlassCard>

            <GlassCard delay={80}>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-fuchsia-300">
                Pricing
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-slate-200">
                {report.pricing_summary}
              </p>
            </GlassCard>

            <GlassCard delay={160}>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                Key findings
              </h2>
              <ul className="mt-3 space-y-2.5">
                {report.key_findings.map((f, i) => (
                  <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-slate-200">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard delay={240}>
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
                    className="font-mono inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-violet-200"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {p.replace(/^https?:\/\//, '')}
                  </a>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        <section className="mt-24 border-t border-white/[0.06] pt-10">
          <h2 className="font-display text-sm font-semibold text-slate-200">How it's built</h2>
          <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
            <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent sm:block" />
            {[
              ['1', 'Open a page', 'A tool call to a real headless browser — the only way the agent sees the internet.', 'from-violet-500 to-violet-600'],
              ['2', 'Decide', 'On every turn the model chooses: read further, or it already knows enough.', 'from-fuchsia-500 to-fuchsia-600'],
              ['3', 'Report, verified', 'Only pages it actually, successfully read are listed as sources — never taken on its word.', 'from-cyan-500 to-cyan-600'],
            ].map(([n, title, body, grad]) => (
              <div
                key={n}
                className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition hover:border-white/[0.16]"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${grad} text-[11px] font-semibold text-white shadow-[0_0_16px_-4px_rgba(168,85,247,0.7)]`}
                >
                  {n}
                </span>
                <p className="mt-2.5 text-sm font-medium text-slate-100">{title}</p>
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

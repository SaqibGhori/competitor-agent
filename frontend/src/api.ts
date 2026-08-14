import { Client } from '@gradio/client'

export type Report = {
  summary: string
  pricing_summary: string
  key_findings: string[]
  pages_visited: string[]
}

// Two transports, same shape - same pattern as project 2. Local dev talks to the
// FastAPI server directly; production talks to the Hugging Face Space, because free
// HF hosting runs Gradio rather than a plain ASGI server. Set VITE_API_URL to use
// the local backend during development.
const API_URL = import.meta.env.VITE_API_URL as string | undefined
const SPACE_URL =
  (import.meta.env.VITE_SPACE_URL as string | undefined) ??
  'https://silky779sap-competitor-agent.hf.space'

let spaceClient: Promise<Client> | null = null

function getSpaceClient(): Promise<Client> {
  if (!spaceClient) spaceClient = Client.connect(SPACE_URL)
  return spaceClient
}

export async function researchCompetitor(url: string): Promise<Report> {
  if (API_URL) {
    const response = await fetch(`${API_URL}/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.detail ?? `Request failed (${response.status})`)
    }
    return response.json()
  }

  const client = await getSpaceClient()
  const result = await client.predict('/research', { url })
  const payload = (result.data as unknown[])[0] as Report & { error?: string }
  if (payload?.error) throw new Error(payload.error)
  return payload
}

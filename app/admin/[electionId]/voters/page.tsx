'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'

interface PinResult {
  indexNumber: string
  pin: string
}

export default function VotersRegistrationPage() {
  const router = useRouter()
  const params = useParams()
  const electionId = params.electionId as string

  const [mounted, setMounted] = useState(false)
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<PinResult[] | null>(null)
  const [summary, setSummary] = useState<{ attempted: number; inserted: number; skipped: number } | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const authed = sessionStorage.getItem('admin_authed')
      if (authed !== 'true') { router.push('/admin'); return }
    } catch (e) {}
  }, [router])

  function parseIndexNumbers(text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    return lines.filter(line => !/^index\s*number$/i.test(line) && !/^indexnumber$/i.test(line))
  }

  function handleTextChange(text: string) {
    setRawText(text)
    setResults(null)
    setSummary(null)
    setParsed(parseIndexNumbers(text))
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      handleTextChange(text)
    }
    reader.readAsText(file)
  }

  async function handleRegister() {
    if (parsed.length === 0) {
      toast.error('No index numbers found. Add one per line.')
      return
    }
    setUploading(true)
    setResults(null)
    setSummary(null)

    try {
      const response = await fetch('/api/voters/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId, indexNumbers: parsed }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Registration failed')
        setUploading(false)
        return
      }

      setResults(data.results || [])
      setSummary({ attempted: data.attempted, inserted: data.inserted, skipped: data.skipped })

      if (data.inserted > 0) {
        toast.success(`Generated ${data.inserted} new PIN${data.inserted === 1 ? '' : 's'}!`)
      } else {
        toast.info('All index numbers already registered — no new PINs generated.')
      }
    } catch (err) {
      toast.error('Registration failed. Check your connection.')
    }
    setUploading(false)
  }

  function downloadCSV() {
    if (!results || results.length === 0) return

    const header = 'Index Number,PIN\n'
    const rows = results.map(r => `${r.indexNumber},${r.pin}`).join('\n')
    const csv = header + rows

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voter-pins-${electionId}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!mounted) return null

  const card = { background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }
  const btn = { height: '44px', padding: '0 16px', borderRadius: '10px', background: '#4f46e5', color: 'white', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }
  const btnSm = { padding: '5px 10px', borderRadius: '7px', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '11px', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer' }

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        <div style={{ marginBottom: '24px' }}>
          <button onClick={() => router.push(`/admin/${electionId}/setup`)} style={{ ...btnSm, marginBottom: '8px' }}>← Back to Setup</button>
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 500, margin: 0 }}>Register Voters</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
            Enter Index Numbers — the system generates a unique PIN for each. Like a WAEC results checker card: Index Number + PIN to vote.
          </p>
        </div>

        {/* Upload area */}
        <div style={{ ...card, marginBottom: '16px' }}>
          <h2 style={{ color: 'white', fontSize: '15px', fontWeight: 500, marginBottom: '10px' }}>1. Add Index Numbers</h2>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', height: '48px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '0.5px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer', marginBottom: '12px' }}>
            📄 Upload CSV / TXT file
            <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginBottom: '8px' }}>
            ...or paste Index Numbers below — one per line
          </p>

          <textarea
            placeholder={'AHS-2026-001\nAHS-2026-002\nAHS-2026-003'}
            value={rawText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={8}
            style={{ width: '100%', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', outline: 'none', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)', color: 'white', fontFamily: 'monospace', resize: 'vertical' }}
          />

          {parsed.length > 0 && (
            <p style={{ color: '#a5b4fc', fontSize: '12px', marginTop: '8px' }}>
              {parsed.length} index number{parsed.length === 1 ? '' : 's'} ready
            </p>
          )}
        </div>

        {/* Register button */}
        <button onClick={handleRegister} disabled={uploading || parsed.length === 0} style={{ ...btn, width: '100%', opacity: uploading || parsed.length === 0 ? 0.5 : 1 }}>
          {uploading ? 'Generating PINs...' : `Generate PINs & Register ${parsed.length || ''}`}
        </button>

        {/* Summary */}
        {summary && (
          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', border: '0.5px solid rgba(16,185,129,0.3)' }}>
            <p style={{ color: '#10b981', fontSize: '13px', margin: 0 }}>
              ✓ Generated {summary.inserted} new PIN{summary.inserted === 1 ? '' : 's'}. {summary.skipped} already existed and were skipped.
            </p>
          </div>
        )}

        {/* Results table */}
        {results && results.length > 0 && (
          <div style={{ ...card, marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ color: 'white', fontSize: '15px', fontWeight: 500, margin: 0 }}>
                New PINs ({results.length})
              </h2>
              <button onClick={downloadCSV} style={btn}>⬇ Download CSV</button>
            </div>

            <div style={{ background: 'rgba(234,179,8,0.08)', border: '0.5px solid rgba(234,179,8,0.25)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
              <p style={{ color: '#eab308', fontSize: '12px', margin: 0 }}>
                ⚠️ PINs are shown only once. Download this CSV now — it cannot be retrieved again.
              </p>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Index Number</span>
                <span>PIN</span>
              </div>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', fontSize: '13px', fontFamily: 'monospace' }}>
                  <span style={{ color: '#a5b4fc' }}>{r.indexNumber}</span>
                  <span style={{ color: 'white', letterSpacing: '2px' }}>{r.pin}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
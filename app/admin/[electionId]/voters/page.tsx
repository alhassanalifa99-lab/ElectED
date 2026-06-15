'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { canAccessSchool } from '@/lib/school-guard'
import { toast } from 'sonner'

type VoterRow = { studentId: string; email: string }

function parseVoterText(text: string): VoterRow[] {
  const rows: VoterRow[] = []
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim())
    if (parts.length < 2) continue

    const [studentId, email] = parts
    const normalizedId = studentId.replace(/\s/g, '').toLowerCase()

    if (
      normalizedId === 'studentid' ||
      normalizedId === 'student_id' ||
      /^student\s*id$/i.test(studentId)
    ) {
      continue
    }

    if (!email.includes('@') || !studentId) continue

    rows.push({ studentId, email })
  }

  return rows
}

export default function VotersPage() {
  const router = useRouter()
  const params = useParams()
  const electionId = params.electionId as string

  const [mounted, setMounted] = useState(false)
  const [rawText, setRawText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ attempted: number; inserted: number } | null>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const authed = sessionStorage.getItem('admin_authed')
      if (authed !== 'true') {
        router.push('/admin')
        return
      }
    } catch (e) {}
    if (electionId && electionId !== 'undefined') fetchElection()
  }, [router, electionId])

  async function fetchElection() {
    const { data: el } = await supabase.from('elections').select('*').eq('id', electionId).single()
    if (!el || !canAccessSchool(el.school_id)) {
      router.push('/admin')
    }
  }

  const previewRows = useMemo(() => parseVoterText(rawText), [rawText])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setRawText(text)
      setImportResult(null)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleImport() {
    if (previewRows.length === 0) {
      toast.error('No valid voter rows to import')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const res = await fetch('/api/voters/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId, voters: previewRows }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Import failed')
        setImporting(false)
        return
      }

      setImportResult({ attempted: data.attempted, inserted: data.inserted })
      toast.success(`Imported ${data.inserted} of ${data.attempted} voters (duplicates skipped)`)
    } catch (e) {
      toast.error('Import failed')
    }

    setImporting(false)
  }

  if (!mounted) return null

  const input = {
    width: '100%',
    height: '44px',
    borderRadius: '10px',
    padding: '0 14px',
    fontSize: '14px',
    outline: 'none',
    background: 'rgba(255,255,255,0.06)',
    border: '0.5px solid rgba(255,255,255,0.15)',
    color: 'white',
  }
  const btn = {
    height: '44px',
    padding: '0 16px',
    borderRadius: '10px',
    background: '#4f46e5',
    color: 'white',
    fontSize: '13px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  }
  const btnSm = {
    padding: '5px 10px',
    borderRadius: '7px',
    background: 'transparent',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '11px',
    border: '0.5px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
  }
  const card = {
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '20px',
  }

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <button
            onClick={() => router.push(`/admin/${electionId}/setup`)}
            style={{ ...btnSm, marginBottom: '8px' }}
          >
            ← Back to Setup
          </button>
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 500, margin: 0 }}>
            Manage Voters
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
            Bulk register voters via CSV or pasted text (StudentID,Email per line)
          </p>
        </div>

        <div style={{ ...card, marginBottom: '16px' }}>
          <h2 style={{ color: 'white', fontSize: '15px', fontWeight: 500, marginBottom: '14px' }}>
            Upload or Paste
          </h2>

          <label
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            📄 Upload .csv file
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          <textarea
            placeholder={'STU001,student1@school.edu.gh\nSTU002,student2@school.edu.gh'}
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value)
              setImportResult(null)
            }}
            rows={6}
            style={{ ...input, height: 'auto', padding: '12px 14px', resize: 'vertical', fontFamily: 'monospace' }}
          />
        </div>

        {previewRows.length > 0 && (
          <div style={{ ...card, marginBottom: '16px' }}>
            <h2 style={{ color: 'white', fontSize: '15px', fontWeight: 500, marginBottom: '14px' }}>
              Preview ({previewRows.length} valid rows)
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        color: 'rgba(255,255,255,0.4)',
                        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      Student ID
                    </th>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        color: 'rgba(255,255,255,0.4)',
                        borderBottom: '0.5px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          padding: '8px 12px',
                          color: 'white',
                          borderBottom: '0.5px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {row.studentId}
                      </td>
                      <td
                        style={{
                          padding: '8px 12px',
                          color: 'rgba(255,255,255,0.7)',
                          borderBottom: '0.5px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        {row.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {importResult && (
          <div
            style={{
              ...card,
              marginBottom: '16px',
              background: 'rgba(16,185,129,0.08)',
              border: '0.5px solid rgba(16,185,129,0.3)',
            }}
          >
            <p style={{ color: '#10b981', fontSize: '14px', margin: 0 }}>
              Imported {importResult.inserted} of {importResult.attempted} voters (duplicates skipped)
            </p>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={importing || previewRows.length === 0}
          style={{
            ...btn,
            width: '100%',
            opacity: importing || previewRows.length === 0 ? 0.6 : 1,
            cursor: importing || previewRows.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {importing ? 'Importing...' : `Import ${previewRows.length} Voter${previewRows.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ComparePage() {
  const router = useRouter()
  const params = useParams()
  const electionId = params.electionId as string
  const positionId = params.positionId as string

  const [position, setPosition] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [summary, setSummary] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (electionId && positionId) fetchData()
  }, [electionId, positionId])

  async function fetchData() {
    const { data: pos } = await supabase.from('positions').select('*').eq('id', positionId).single()
    setPosition(pos)

    const { data: cands } = await supabase.from('candidates').select('*').eq('position_id', positionId)
    setCandidates(cands || [])
    setLoading(false)

    if (cands && cands.length >= 2) {
      generateSummary(cands)
    }
  }

  async function generateSummary(cands: any[]) {
    setLoadingSummary(true)
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: cands }),
      })
      const data = await response.json()
      setSummary(data.summary || '')
    } catch (e) {
      console.error('Summary error:', e)
    }
    setLoadingSummary(false)
  }

  function getKeyPoints(manifesto: string): string[] {
    if (!manifesto) return []
    const sentences = manifesto.split(/[.!?]+/).filter(s => s.trim().length > 20)
    return sentences.slice(0, 3).map(s => s.trim())
  }

  if (loading) {
    return (
      <div style={{ background: '#0f0c29', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
            ← Back to Ballot
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚖️</span>
            <div>
              <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 500, margin: 0 }}>
                Compare Candidates
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
                {position?.title}
              </p>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {(summary || loadingSummary) && (
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '0.5px solid rgba(99,102,241,0.25)', borderRadius: '14px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>🤖</span>
              <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 500 }}>AI Summary</span>
            </div>
            {loadingSummary ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>Generating comparison...</p>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{summary}</p>
            )}
          </div>
        )}

        {/* Candidate cards */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(candidates.length, 2)}, 1fr)`, gap: '16px' }}>
          {candidates.map((candidate, index) => {
            const keyPoints = getKeyPoints(candidate.manifesto)
            const colors = ['#4f46e5', '#7c3aed', '#0891b2', '#059669']
            const color = colors[index % colors.length]

            return (
              <div key={candidate.id} style={{ background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${color}40`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}40` }}>
                    {candidate.photo_url ? (
                      <img src={candidate.photo_url} alt={candidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color, fontSize: '20px', fontWeight: 600 }}>{candidate.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 500, margin: 0 }}>{candidate.name}</h2>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${color}20`, color, marginTop: '4px', display: 'inline-block' }}>
                      {position?.title}
                    </span>
                  </div>
                </div>

                {/* Key promises */}
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Key Promises
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {keyPoints.length > 0 ? keyPoints.map((point, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0, marginTop: '6px' }} />
                        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{point}</p>
                      </div>
                    )) : (
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', margin: 0 }}>No manifesto available</p>
                    )}
                  </div>
                </div>

                {/* Full manifesto */}
                {candidate.manifesto && (
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Full Manifesto
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>
                      {candidate.manifesto}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => router.push(`/chat/${electionId}/${candidate.id}`)}
                    style={{ flex: 1, height: '38px', borderRadius: '10px', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '12px', border: '0.5px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>
                    🤖 Ask AI
                  </button>
                  <button
                    onClick={() => { router.back(); toast.success(`Selected ${candidate.name}`) }}
                    style={{ flex: 1, height: '38px', borderRadius: '10px', background: color, color: 'white', fontSize: '12px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    Vote →
                  </button>
                </div>

              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function BallotPage() {
  const router = useRouter()
  const params = useParams()
  const electionId = params.electionId as string

  const [election, setElection] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [voterId, setVoterId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const vid = sessionStorage.getItem('voter_id')
    const eid = sessionStorage.getItem('election_id')
    const hasVoted = sessionStorage.getItem('has_voted')

    if (!vid || eid !== electionId) {
      router.push('/vote')
      return
    }
    if (hasVoted === 'true') {
      router.push(`/results/${electionId}`)
      return
    }
    setVoterId(vid)
    fetchData()
  }, [])

  async function fetchData() {
    const { data: el } = await supabase.from('elections').select('*').eq('id', electionId).single()
    setElection(el)

    const { data: pos } = await supabase.from('positions').select('*').eq('election_id', electionId)
    setPositions(pos || [])

    const { data: cands } = await supabase.from('candidates').select('*').eq('election_id', electionId)
    setCandidates(cands || [])

    setLoading(false)
  }

  function selectCandidate(positionId: string, candidateId: string) {
    setSelections(prev => ({ ...prev, [positionId]: candidateId }))
  }

  async function submitVote() {
    if (Object.keys(selections).length !== positions.length) {
      toast.error('Please select a candidate for every position')
      return
    }
    setSubmitting(true)

    const votes = positions.map(p => ({
      election_id: electionId,
      position_id: p.id,
      candidate_id: selections[p.id],
      voter_id: voterId,
    }))

    const { error: voteError } = await supabase.from('votes').insert(votes)
    if (voteError) {
      toast.error('Failed to submit vote. Please try again.')
      setSubmitting(false)
      return
    }

    const { error: voterError } = await supabase
      .from('voters')
      .update({ has_voted: true })
      .eq('id', voterId)

    if (voterError) {
      toast.error('Error updating voter status')
      setSubmitting(false)
      return
    }

    sessionStorage.setItem('has_voted', 'true')
    setSubmitted(true)
    toast.success('Vote submitted successfully!')
    setSubmitting(false)
  }

  if (!mounted) return null

  if (loading) {
    return (
      <div style={{ background: '#0f0c29', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Loading ballot...</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ background: '#0f0c29', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 500, marginBottom: '12px' }}>Vote Submitted!</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '28px' }}>
            Your vote has been recorded securely. Thank you for participating!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => router.push(`/results/${electionId}`)}
              style={{ width: '100%', height: '48px', borderRadius: '12px', background: '#4f46e5', color: 'white', fontSize: '15px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              📊 View Live Results
            </button>
            <button
              onClick={() => router.push('/')}
              style={{ width: '100%', height: '44px', borderRadius: '12px', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '14px', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const allSelected = Object.keys(selections).length === positions.length

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', padding: '32px 24px 100px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 500, margin: 0 }}>
            {election?.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
            {election?.school_name} · Select one candidate per position
          </p>
          <div style={{ marginTop: '12px', height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '4px', background: '#4f46e5', width: `${(Object.keys(selections).length / positions.length) * 100}%`, transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '6px' }}>
            {Object.keys(selections).length} of {positions.length} positions selected
          </p>
        </div>

        {/* Positions */}
        {positions.map(position => {
          const posCandidates = candidates.filter(c => c.position_id === position.id)
          const selected = selections[position.id]
          return (
            <div key={position.id} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <h2 style={{ color: '#818cf8', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {position.title}
                </h2>
                {selected && <span style={{ fontSize: '11px', color: '#10b981' }}>✓ Selected</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {posCandidates.map(candidate => {
                  const isSelected = selected === candidate.id
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => selectCandidate(position.id, candidate.id)}
                      style={{
                        padding: '16px',
                        borderRadius: '14px',
                        border: isSelected ? '1.5px solid #4f46e5' : '0.5px solid rgba(255,255,255,0.08)',
                        background: isSelected ? 'rgba(79,70,229,0.12)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                      }}>

                      {/* Avatar */}
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {candidate.photo_url ? (
                          <img src={candidate.photo_url} alt={candidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: '#818cf8', fontSize: '18px', fontWeight: 600 }}>
                            {candidate.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <h3 style={{ color: 'white', fontSize: '15px', fontWeight: 500, margin: 0 }}>{candidate.name}</h3>
                          {isSelected && (
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>✓</div>
                          )}
                        </div>
                        {candidate.manifesto && (
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {candidate.manifesto}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/compare/${electionId}/${position.id}`) }}
                            style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                            Compare
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/chat/${electionId}/${candidate.id}`) }}
                            style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                            Ask AI 🤖
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Submit */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: 'rgba(15,12,41,0.95)', borderTop: '0.5px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <button
              onClick={submitVote}
              disabled={!allSelected || submitting}
              style={{ width: '100%', height: '52px', borderRadius: '14px', background: allSelected ? '#4f46e5' : 'rgba(255,255,255,0.06)', color: allSelected ? 'white' : 'rgba(255,255,255,0.3)', fontSize: '15px', fontWeight: 500, border: 'none', cursor: allSelected ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease' }}>
              {submitting ? 'Submitting...' : allSelected ? '🗳️ Submit Vote' : `Select all ${positions.length} positions to continue`}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const REACTIONS = ['👍', '👏', '🔥']

export default function CandidatePage() {
  const router = useRouter()
  const params = useParams()
  const candidateId = params.candidateId as string

  const [candidate, setCandidate] = useState<any>(null)
  const [position, setPosition] = useState<any>(null)
  const [election, setElection] = useState<any>(null)
  const [reactions, setReactions] = useState<Record<string, number>>({ '👍': 0, '👏': 0, '🔥': 0 })
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [reacting, setReacting] = useState<string | null>(null)

  useEffect(() => {
    if (candidateId) fetchData()
    const stored = localStorage.getItem(`reactions_${candidateId}`)
    if (stored) setUserReactions(JSON.parse(stored))
  }, [candidateId])

  async function fetchData() {
    const { data: cand } = await supabase.from('candidates').select('*').eq('id', candidateId).single()
    setCandidate(cand)

    if (cand?.reactions) setReactions(cand.reactions)

    if (cand?.position_id) {
      const { data: pos } = await supabase.from('positions').select('*').eq('id', cand.position_id).single()
      setPosition(pos)
    }

    if (cand?.election_id) {
      const { data: el } = await supabase.from('elections').select('*').eq('id', cand.election_id).single()
      setElection(el)
    }

    setLoading(false)
  }

  async function handleReaction(emoji: string) {
    if (reacting) return
    setReacting(emoji)

    const alreadyReacted = userReactions[emoji]
    const newCount = alreadyReacted
      ? Math.max(0, (reactions[emoji] || 0) - 1)
      : (reactions[emoji] || 0) + 1

    const newReactions = { ...reactions, [emoji]: newCount }
    const newUserReactions = { ...userReactions, [emoji]: !alreadyReacted }

    setReactions(newReactions)
    setUserReactions(newUserReactions)
    localStorage.setItem(`reactions_${candidateId}`, JSON.stringify(newUserReactions))

    await supabase
      .from('candidates')
      .update({ reactions: newReactions })
      .eq('id', candidateId)

    setReacting(null)
  }

  function shareCandidate() {
    if (navigator.share) {
      navigator.share({
        title: `Vote for ${candidate?.name}`,
        text: `Check out ${candidate?.name}'s manifesto for the ${position?.title} position!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div style={{ background: '#0f0c29', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Loading...</p>
      </div>
    )
  }

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0)

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', padding: '32px 24px 48px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}>
          ← Back
        </button>

        {/* Profile card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', marginBottom: '16px' }}>

          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(99,102,241,0.3)' }}>
              {candidate?.photo_url ? (
                <img src={candidate.photo_url} alt={candidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#818cf8', fontSize: '28px', fontWeight: 600 }}>{candidate?.name?.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 500, margin: 0 }}>{candidate?.name}</h1>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                  {position?.title}
                </span>
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                  {election?.school_name}
                </span>
              </div>
            </div>
          </div>

          {/* Reactions */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Community Reactions
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                {totalReactions} total
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  style={{
                    flex: 1,
                    height: '52px',
                    borderRadius: '12px',
                    background: userReactions[emoji] ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: userReactions[emoji] ? '1px solid rgba(99,102,241,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease',
                  }}>
                  <span style={{ fontSize: '20px' }}>{emoji}</span>
                  <span style={{ color: userReactions[emoji] ? '#a5b4fc' : 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 500 }}>
                    {reactions[emoji] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Manifesto */}
          <div>
            <h2 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Manifesto
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              {candidate?.manifesto || 'No manifesto provided.'}
            </p>
          </div>

          {/* Campaign updates */}
          {candidate?.campaign_updates && candidate.campaign_updates.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h2 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Campaign Updates
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...candidate.campaign_updates].reverse().map((update: any, i: number) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 14px', borderLeft: '2px solid #4f46e5' }}>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{update.text}</p>
                    {update.timestamp && (
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '6px', marginBottom: 0 }}>
                        {new Date(update.timestamp).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => router.push(`/chat/${candidate?.election_id}/${candidateId}`)}
            style={{ flex: 1, height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontSize: '14px', border: '0.5px solid rgba(99,102,241,0.3)', cursor: 'pointer', fontWeight: 500 }}>
            🤖 Ask AI
          </button>
          <button
            onClick={shareCandidate}
            style={{ flex: 1, height: '48px', borderRadius: '12px', background: '#4f46e5', color: 'white', fontSize: '14px', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            📤 Share
          </button>
        </div>

        {/* Back to vote */}
        {election && (
          <button
            onClick={() => router.push(`/vote/${election.id}`)}
            style={{ width: '100%', height: '44px', borderRadius: '12px', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', border: '0.5px solid rgba(255,255,255,0.08)', cursor: 'pointer', marginTop: '10px' }}>
            ← Back to Ballot
          </button>
        )}

      </div>
    </div>
  )
}
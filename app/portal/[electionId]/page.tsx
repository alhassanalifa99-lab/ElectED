'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function PortalPage() {
  const router = useRouter()
  const params = useParams()
  const electionId = params.electionId as string

  const [election, setElection] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [voter, setVoter] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'candidates' | 'vote' | 'results'>('candidates')

  useEffect(() => {
    setMounted(true)
    const vid = sessionStorage.getItem('voter_id')
    const eid = sessionStorage.getItem('election_id')

    if (!vid || eid !== electionId) {
      router.push('/vote')
      return
    }
    fetchData(vid)
  }, [electionId])

  async function fetchData(vid: string) {
    const { data: el } = await supabase.from('elections').select('*').eq('id', electionId).single()
    setElection(el)

    const { data: pos } = await supabase.from('positions').select('*').eq('election_id', electionId)
    setPositions(pos || [])

    const { data: cands } = await supabase.from('candidates').select('*').eq('election_id', electionId)
    setCandidates(cands || [])

    const { data: v } = await supabase.from('voters').select('*').eq('id', vid).single()
    setVoter(v)

    setLoading(false)
  }

  function handleVote() {
    if (voter?.has_voted) {
      toast.info('You have already voted!')
      router.push(`/results/${electionId}`)
    } else {
      router.push(`/vote/${electionId}`)
    }
  }

  if (!mounted) return null

  if (loading) {
    return (
      <div style={{ background: '#0f0c29', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Loading portal...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'candidates', label: '👥 Candidates' },
    { id: 'vote', label: '🗳️ Vote' },
    { id: 'results', label: '📊 Results' },
  ]

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ padding: '24px 24px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 500, margin: 0 }}>{election?.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>{election?.school_name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '999px', background: voter?.has_voted ? 'rgba(16,185,129,0.15)' : 'rgba(234,179,8,0.15)', color: voter?.has_voted ? '#10b981' : '#eab308' }}>
                {voter?.has_voted ? '✓ Voted' : '⏳ Not voted'}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px 10px 0 0',
                  background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: activeTab === tab.id ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #4f46e5' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeTab === tab.id ? 500 : 400,
                }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px' }}>

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px' }}>
              Browse all candidates before you vote. Tap a candidate to view their full profile.
            </p>
            {positions.map(position => {
              const posCandidates = candidates.filter(c => c.position_id === position.id)
              return (
                <div key={position.id} style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h2 style={{ color: '#818cf8', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      {position.title}
                    </h2>
                    <button
                      onClick={() => router.push(`/compare/${electionId}/${position.id}`)}
                      style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                      ⚖️ Compare all
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {posCandidates.map(candidate => (
                      <div
                        key={candidate.id}
                        onClick={() => router.push(`/candidate/${candidate.id}`)}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {candidate.photo_url ? (
                            <img src={candidate.photo_url} alt={candidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ color: '#818cf8', fontSize: '20px', fontWeight: 600 }}>{candidate.name.charAt(0)}</span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ color: 'white', fontSize: '15px', fontWeight: 500, margin: 0 }}>{candidate.name}</h3>
                          {candidate.manifesto && (
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {candidate.manifesto}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/chat/${electionId}/${candidate.id}`) }}
                              style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '0.5px solid rgba(99,102,241,0.2)', cursor: 'pointer' }}>
                              🤖 Ask AI
                            </button>
                          </div>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '16px' }}>›</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Vote Tab */}
        {activeTab === 'vote' && (
          <div style={{ textAlign: 'center', paddingTop: '40px' }}>
            {voter?.has_voted ? (
              <>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 500, marginBottom: '10px' }}>You have voted!</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '28px' }}>
                  Your vote has been recorded securely.
                </p>
                <button
                  onClick={() => router.push(`/results/${electionId}`)}
                  style={{ width: '100%', maxWidth: '320px', height: '52px', borderRadius: '14px', background: '#4f46e5', color: 'white', fontSize: '15px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                  📊 View Live Results
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗳️</div>
                <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 500, marginBottom: '10px' }}>Ready to Vote?</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '28px' }}>
                  You haven't voted yet. Browse the candidates first, then cast your vote.
                </p>
                <button
                  onClick={handleVote}
                  style={{ width: '100%', maxWidth: '320px', height: '52px', borderRadius: '14px', background: '#4f46e5', color: 'white', fontSize: '15px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                  🗳️ Go to Ballot
                </button>
              </>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div style={{ textAlign: 'center', paddingTop: '40px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
            <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 500, marginBottom: '10px' }}>Live Results</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '28px' }}>
              See how the votes are coming in.
            </p>
            <button
              onClick={() => router.push(`/results/${electionId}`)}
              style={{ width: '100%', maxWidth: '320px', height: '52px', borderRadius: '14px', background: '#4f46e5', color: 'white', fontSize: '15px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              View Results →
            </button>
          </div>
        )}

      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 24px', background: 'rgba(15,12,41,0.95)', borderTop: '0.5px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', gap: '16px' }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '18px' }}>🏠</span>
          Home
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'candidates' ? '#a5b4fc' : 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '18px' }}>👥</span>
          Candidates
        </button>
        <button
          onClick={() => setActiveTab('vote')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'vote' ? '#a5b4fc' : 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '18px' }}>🗳️</span>
          Vote
        </button>
        <button
          onClick={() => setActiveTab('results')}
          style={{ background: 'transparent', border: 'none', color: activeTab === 'results' ? '#a5b4fc' : 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          Results
        </button>
      </div>

    </div>
  )
}
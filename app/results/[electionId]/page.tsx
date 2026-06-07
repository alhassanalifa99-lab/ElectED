'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const electionId = params.electionId as string

  const [election, setElection] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [voters, setVoters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    const { data: el } = await supabase.from('elections').select('*').eq('id', electionId).single()
    setElection(el)

    const { data: pos } = await supabase.from('positions').select('*').eq('election_id', electionId)
    setPositions(pos || [])

    const { data: cands } = await supabase.from('candidates').select('*').eq('election_id', electionId)
    setCandidates(cands || [])

    const { data: v } = await supabase.from('votes').select('*').eq('election_id', electionId)
    setVotes(v || [])

    const { data: vt } = await supabase.from('voters').select('*').eq('election_id', electionId)
    setVoters(vt || [])

    setLoading(false)
  }

  function getVoteCount(candidateId: string) {
    return votes.filter(v => v.candidate_id === candidateId).length
  }

  function getWinner(positionId: string) {
    const posCandidates = candidates.filter(c => c.position_id === positionId)
    if (posCandidates.length === 0) return null
    return posCandidates.reduce((a, b) =>
      getVoteCount(a.id) >= getVoteCount(b.id) ? a : b
    )
  }

  const totalVoters = voters.length
  const votedCount = voters.filter(v => v.has_voted).length
  const turnout = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0

  const COLORS = ['#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff']

  if (loading) {
    return (
      <div style={{ background: '#0f0c29', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Loading results...</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <button
            onClick={() => router.push('/')}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
            ← Back to Home
          </button>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 500, margin: 0 }}>
            {election?.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
            {election?.school_name} · Live Results
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Total Voters', value: totalVoters },
            { label: 'Votes Cast', value: votedCount },
            { label: 'Turnout', value: `${turnout}%` },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '22px', fontWeight: 500 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Results per position */}
        {positions.map(position => {
          const posCandidates = candidates.filter(c => c.position_id === position.id)
          const winner = getWinner(position.id)
          const chartData = posCandidates.map(c => ({
            name: c.name.split(' ')[0],
            votes: getVoteCount(c.id),
            id: c.id,
          }))
          const totalPosVotes = chartData.reduce((sum, c) => sum + c.votes, 0)

          return (
            <div key={position.id} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <h2 style={{ color: '#818cf8', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                {position.title}
              </h2>

              {/* Winner card */}
              {winner && votedCount > 0 && (
                <div style={{ background: 'rgba(79,70,229,0.1)', border: '0.5px solid rgba(79,70,229,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>🏆</span>
                  <div>
                    <div style={{ color: 'white', fontSize: '15px', fontWeight: 500 }}>{winner.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>
                      Leading with {getVoteCount(winner.id)} votes
                      {totalPosVotes > 0 && ` (${Math.round((getVoteCount(winner.id) / totalPosVotes) * 100)}%)`}
                    </div>
                  </div>
                </div>
              )}

              {/* Bar chart */}
              {chartData.length > 0 && (
                <div style={{ height: '180px', marginBottom: '16px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: '#1e1b4b', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '13px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={entry.id} fill={entry.id === winner?.id ? '#4f46e5' : 'rgba(99,102,241,0.3)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Candidate list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {posCandidates
                  .sort((a, b) => getVoteCount(b.id) - getVoteCount(a.id))
                  .map((c, i) => {
                    const voteCount = getVoteCount(c.id)
                    const pct = totalPosVotes > 0 ? Math.round((voteCount / totalPosVotes) * 100) : 0
                    const isWinner = winner?.id === c.id && votedCount > 0
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isWinner ? 'rgba(79,70,229,0.2)' : 'rgba(255,255,255,0.04)', border: `0.5px solid ${isWinner ? '#4f46e5' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
                          {isWinner ? '👑' : i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'white', fontSize: '13px' }}>{c.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{voteCount} ({pct}%)</span>
                          </div>
                          <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '4px', background: isWinner ? '#4f46e5' : 'rgba(99,102,241,0.4)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )
        })}

        {/* Refresh note */}
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
          Results refresh automatically every 10 seconds
        </p>

      </div>
    </div>
  )
}
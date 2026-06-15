'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { exportToCSV, formatDate } from '@/lib/helpers'
import { canAccessSchool } from '@/lib/school-guard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function AdminResultsPage() {
  const router = useRouter()
  const params = useParams()
  const electionId = params.electionId as string

  const [election, setElection] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [voters, setVoters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const authed = sessionStorage.getItem('admin_authed')
      if (authed !== 'true') { router.push('/admin'); return }
    } catch (e) {}
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    const { data: el } = await supabase.from('elections').select('*').eq('id', electionId).single()
    if (!el || !canAccessSchool(el.school_id)) {
      router.push('/admin')
      return
    }
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
    return posCandidates.reduce((a, b) => getVoteCount(a.id) >= getVoteCount(b.id) ? a : b)
  }

  function handleExport() {
    const rows = candidates.map(c => {
      const position = positions.find(p => p.id === c.position_id)
      return {
        Position: position?.title || '',
        Candidate: c.name,
        Votes: getVoteCount(c.id),
        Percentage: (() => {
          const posCandidates = candidates.filter(x => x.position_id === c.position_id)
          const total = posCandidates.reduce((sum, x) => sum + getVoteCount(x.id), 0)
          return total > 0 ? `${Math.round((getVoteCount(c.id) / total) * 100)}%` : '0%'
        })(),
      }
    })
    exportToCSV(rows, `${election?.title || 'results'}.csv`)
  }

  const totalVoters = voters.length
  const votedCount = voters.filter(v => v.has_voted).length
  const turnout = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 100) : 0

  if (!mounted) return null

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
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <button onClick={() => router.push('/admin')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', marginBottom: '8px', padding: 0 }}>
              ← Back to Dashboard
            </button>
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 500, margin: 0 }}>{election?.title}</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
              {election?.school_name} · {formatDate(election?.start_date)} → {formatDate(election?.end_date)}
            </p>
          </div>
          <button
            onClick={handleExport}
            style={{ height: '40px', padding: '0 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', border: '0.5px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>
            ⬇️ Export CSV
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '28px' }}>
          {[
            { label: 'Total Voters', value: totalVoters },
            { label: 'Votes Cast', value: votedCount },
            { label: 'Turnout', value: `${turnout}%` },
            { label: 'Positions', value: positions.length },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '20px', fontWeight: 500 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Turnout bar */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Voter Turnout</span>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>{votedCount} / {totalVoters}</span>
          </div>
          <div style={{ height: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '8px', background: turnout >= 50 ? '#10b981' : '#4f46e5', width: `${turnout}%`, transition: 'width 0.5s ease' }} />
          </div>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ color: '#818cf8', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {position.title}
                </h2>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{totalPosVotes} votes</span>
              </div>

              {/* Winner */}
              {winner && votedCount > 0 && (
                <div style={{ background: 'rgba(79,70,229,0.1)', border: '0.5px solid rgba(79,70,229,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>🏆</span>
                  <div>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>{winner.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                      {getVoteCount(winner.id)} votes
                      {totalPosVotes > 0 && ` · ${Math.round((getVoteCount(winner.id) / totalPosVotes) * 100)}%`}
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div style={{ height: '160px', marginBottom: '16px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#1e1b4b', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '13px' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell key={entry.id} fill={entry.id === winner?.id ? '#4f46e5' : 'rgba(99,102,241,0.3)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Candidate rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {posCandidates
                  .sort((a, b) => getVoteCount(b.id) - getVoteCount(a.id))
                  .map((c, i) => {
                    const voteCount = getVoteCount(c.id)
                    const pct = totalPosVotes > 0 ? Math.round((voteCount / totalPosVotes) * 100) : 0
                    const isWinner = winner?.id === c.id && votedCount > 0
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '24px', color: isWinner ? '#818cf8' : 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', flexShrink: 0 }}>
                          {isWinner ? '👑' : i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'white', fontSize: '13px' }}>{c.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{voteCount} ({pct}%)</span>
                          </div>
                          <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '4px', background: isWinner ? '#4f46e5' : 'rgba(99,102,241,0.3)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )
        })}

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>
          Auto-refreshes every 10 seconds
        </p>

      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function SetupPage() {
  const router = useRouter()
  const params = useParams()
  const electionId = params.electionId as string

  const [election, setElection] = useState<any>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [newPosition, setNewPosition] = useState('')
  const [newCandidate, setNewCandidate] = useState({ name: '', manifesto: '', photo_url: '', position_id: '' })
  const [activatingId, setActivatingId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const authed = sessionStorage.getItem('admin_authed')
    if (authed !== 'true') {
      router.push('/admin')
      return
    }
    fetchAll()
  }, [])

  async function fetchAll() {
    const { data: el } = await supabase.from('elections').select('*').eq('id', electionId).single()
    setElection(el)

    const { data: pos } = await supabase.from('positions').select('*').eq('election_id', electionId)
    setPositions(pos || [])

    const { data: cands } = await supabase.from('candidates').select('*').eq('election_id', electionId)
    setCandidates(cands || [])
  }

  async function addPosition() {
    if (!newPosition.trim()) return
    const { data, error } = await supabase
      .from('positions')
      .insert([{ election_id: electionId, title: newPosition.trim() }])
      .select()
      .single()
    if (error) { toast.error('Failed to add position'); return }
    setPositions([...positions, data])
    setNewPosition('')
    toast.success('Position added!')
  }

  async function deletePosition(id: string) {
    await supabase.from('positions').delete().eq('id', id)
    setPositions(positions.filter(p => p.id !== id))
    setCandidates(candidates.filter(c => c.position_id !== id))
    toast.success('Position removed!')
  }

  async function addCandidate() {
    if (!newCandidate.name.trim() || !newCandidate.position_id) {
      toast.error('Name and position are required')
      return
    }
    const { data, error } = await supabase
      .from('candidates')
      .insert([{ ...newCandidate, election_id: electionId }])
      .select()
      .single()
    if (error) { toast.error('Failed to add candidate'); return }
    setCandidates([...candidates, data])
    setNewCandidate({ name: '', manifesto: '', photo_url: '', position_id: newCandidate.position_id })
    toast.success('Candidate added!')
  }

  async function deleteCandidate(id: string) {
    await supabase.from('candidates').delete().eq('id', id)
    setCandidates(candidates.filter(c => c.id !== id))
    toast.success('Candidate removed!')
  }

  async function toggleActive() {
    const newStatus = !election.is_active
    const { error } = await supabase
      .from('elections')
      .update({ is_active: newStatus })
      .eq('id', electionId)
    if (error) { toast.error('Failed to update status'); return }
    setElection({ ...election, is_active: newStatus })
    toast.success(newStatus ? 'Election activated!' : 'Election deactivated!')
  }

  if (!mounted) return null

  const card = { background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }
  const input = { width: '100%', height: '44px', borderRadius: '10px', padding: '0 14px', fontSize: '14px', outline: 'none', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)', color: 'white' }
  const btn = { height: '44px', padding: '0 16px', borderRadius: '10px', background: '#4f46e5', color: 'white', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const }
  const btnSm = { padding: '5px 10px', borderRadius: '7px', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '11px', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer' }

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <button onClick={() => router.push('/admin')} style={{ ...btnSm, marginBottom: '8px' }}>← Back</button>
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 500, margin: 0 }}>
              {election?.title || 'Loading...'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
              {election?.school_name}
            </p>
          </div>
          <button
            onClick={toggleActive}
            style={{
              ...btn,
              background: election?.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
              color: election?.is_active ? '#ef4444' : '#10b981',
              border: `0.5px solid ${election?.is_active ? '#ef4444' : '#10b981'}`,
            }}>
            {election?.is_active ? '⏸ Deactivate' : '▶ Activate'}
          </button>
        </div>

        {/* Add Position */}
        <div style={{ ...card, marginBottom: '16px' }}>
          <h2 style={{ color: 'white', fontSize: '15px', fontWeight: 500, marginBottom: '14px' }}>
            Positions
          </h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input
              placeholder="e.g. President, Vice President..."
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPosition()}
              style={input}
            />
            <button onClick={addPosition} style={btn}>Add</button>
          </div>

          {/* Positions list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {positions.length === 0 && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No positions yet</p>
            )}
            {positions.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <span style={{ color: 'white', fontSize: '14px' }}>{p.title}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginLeft: '10px' }}>
                    {candidates.filter(c => c.position_id === p.id).length} candidates
                  </span>
                </div>
                <button onClick={() => deletePosition(p.id)} style={{ ...btnSm, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>Remove</button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Candidate */}
        <div style={{ ...card, marginBottom: '16px' }}>
          <h2 style={{ color: 'white', fontSize: '15px', fontWeight: 500, marginBottom: '14px' }}>
            Add Candidate
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select
              value={newCandidate.position_id}
              onChange={(e) => setNewCandidate({ ...newCandidate, position_id: e.target.value })}
              style={{ ...input, colorScheme: 'dark' }}>
              <option value="">Select Position</option>
              {positions.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <input
              placeholder="Candidate name"
              value={newCandidate.name}
              onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
              style={input}
            />
            <input
              placeholder="Photo URL (optional)"
              value={newCandidate.photo_url}
              onChange={(e) => setNewCandidate({ ...newCandidate, photo_url: e.target.value })}
              style={input}
            />
            <textarea
              placeholder="Manifesto / campaign promises..."
              value={newCandidate.manifesto}
              onChange={(e) => setNewCandidate({ ...newCandidate, manifesto: e.target.value })}
              rows={3}
              style={{ ...input, height: 'auto', padding: '12px 14px', resize: 'none' }}
            />
            <button onClick={addCandidate} style={{ ...btn, width: '100%' }}>
              Add Candidate
            </button>
          </div>
        </div>

        {/* Candidates list grouped by position */}
        {positions.map(p => {
          const posCandidates = candidates.filter(c => c.position_id === p.id)
          if (posCandidates.length === 0) return null
          return (
            <div key={p.id} style={{ ...card, marginBottom: '12px' }}>
              <h3 style={{ color: '#818cf8', fontSize: '13px', fontWeight: 500, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {p.title}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {posCandidates.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                    {c.photo_url && (
                      <img src={c.photo_url} alt={c.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>{c.name}</div>
                      {c.manifesto && (
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.manifesto}
                        </div>
                      )}
                    </div>
                    <button onClick={() => deleteCandidate(c.id)} style={{ ...btnSm, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', flexShrink: 0 }}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button
            onClick={() => router.push(`/admin/${electionId}/results`)}
            style={{ ...btn, flex: 1, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
            📊 View Results
          </button>
          <button
            onClick={() => router.push(`/vote`)}
            style={{ ...btn, flex: 1 }}>
            🗳️ Go to Voter Page
          </button>
        </div>

      </div>
    </div>
  )
}
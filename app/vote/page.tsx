'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function VotePage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!studentId.trim() || !email.trim()) {
      toast.error('Please enter your Student ID and Email')
      return
    }
    setLoading(true)

    const { data: elections } = await supabase
      .from('elections')
      .select('*')
      .eq('is_active', true)
      .limit(1)

    if (!elections || elections.length === 0) {
      toast.error('No active election found')
      setLoading(false)
      return
    }

    const election = elections[0]

    const res = await fetch('/api/voters/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        email,
        electionId: election.id,
      }),
    })

    const { voter } = await res.json()

    if (!res.ok || !voter) {
      toast.error('Student ID or email not found.')
      setLoading(false)
      return
    }

    sessionStorage.setItem('voter_id', voter.id)
    sessionStorage.setItem('election_id', election.id)
    sessionStorage.setItem('has_voted', voter.has_voted.toString())

    toast.success('Welcome! Redirecting to your portal...')
    router.push(`/portal/${election.id}`)
    setLoading(false)
  }

  const input = {
    width: '100%',
    height: '48px',
    borderRadius: '12px',
    padding: '0 16px',
    fontSize: '14px',
    outline: 'none',
    background: 'rgba(255,255,255,0.06)',
    border: '0.5px solid rgba(255,255,255,0.15)',
    color: 'white',
  }

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        <button
          onClick={() => router.push('/')}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}>
          ← Back
        </button>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px' }}>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗳️</div>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 500, margin: 0 }}>Student Login</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px' }}>
              Enter your details to access the election portal
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Student ID (e.g. STU001)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              style={input}
            />
            <input
              type="email"
              placeholder="School Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={input}
            />
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', height: '48px', borderRadius: '12px', background: '#4f46e5', color: 'white', fontSize: '15px', fontWeight: 500, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px' }}>
              {loading ? 'Checking...' : 'Enter Portal →'}
            </button>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', borderRadius: '10px', background: 'rgba(99,102,241,0.08)', border: '0.5px solid rgba(99,102,241,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0, textAlign: 'center' }}>
              Demo: STU001 · student1@accrahigh.edu.gh
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
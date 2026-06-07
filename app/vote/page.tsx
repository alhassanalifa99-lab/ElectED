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
    console.log('Login clicked', studentId, email)
    if (!studentId.trim() || !email.trim()) {
      toast.error('Please enter your Student ID and Email')
      return
    }
    setLoading(true)

   // Find active election
const { data: elections, error: elError } = await supabase
  .from('elections')
  .select('*')
  .eq('is_active', true)
  .limit(1)
console.log('Elections:', elections, 'Error:', elError)

    if (!elections || elections.length === 0) {
      toast.error('No active election found')
      setLoading(false)
      return
    }

    const election = elections[0]

    // Check voter eligibility
 const { data: voter, error } = await supabase
  .from('voters')
  .select('*')
  .eq('election_id', election.id)
  .eq('student_id', studentId.trim())
  .eq('email', email.trim())
  .single()
console.log('Voter:', voter, 'Error:', error)
console.log('Election ID used:', election.id)

    if (error || !voter) {
      toast.error('Student ID or email not found. Contact your admin.')
      setLoading(false)
      return
    }

    // Save voter session
    sessionStorage.setItem('voter_id', voter.id)
    sessionStorage.setItem('election_id', election.id)
    sessionStorage.setItem('has_voted', voter.has_voted.toString())

    if (voter.has_voted) {
      toast.success('You have already voted!')
      router.push(`/results/${election.id}`)
    } else {
      toast.success('Welcome! Cast your vote.')
      router.push(`/vote/${election.id}`)
    }
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

        {/* Back */}
        <button
          onClick={() => router.push('/')}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}>
          ← Back
        </button>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px' }}>

          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗳️</div>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 500, margin: 0 }}>Voter Login</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px' }}>
              Enter your student details to vote
            </p>
          </div>

          {/* Form */}
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
              {loading ? 'Checking...' : 'Access Ballot →'}
            </button>
          </div>

          {/* Demo hint */}
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
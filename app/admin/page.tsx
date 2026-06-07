'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getElectionStatus, formatDate } from '@/lib/helpers'
import { toast } from 'sonner'

export default function AdminPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [elections, setElections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = sessionStorage.getItem('admin_authed')
      if (saved === 'true') {
        setAuthed(true)
        fetchElections()
      }
    } catch (e) {}
  }, [])

 async function fetchElections() {
  setLoading(true)
  const { data, error } = await supabase
    .from('elections')
    .select('*')
    .order('created_at', { ascending: false })
  setElections(data || [])
  setLoading(false)
}

  function handleLogin() {
    if (password === 'admin123') {
      try { sessionStorage.setItem('admin_authed', 'true') } catch (e) {}
      setAuthed(true)
      fetchElections()
      toast.success('Welcome back, Admin!')
    } else {
      toast.error('Wrong password!')
    }
  }

  function handleLogout() {
    try { sessionStorage.removeItem('admin_authed') } catch (e) {}
    setAuthed(false)
    setElections([])
  }

  if (!mounted) return null

  if (!authed) {
    return (
      <div style={{ background: '#0f0c29', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '360px', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 500, margin: 0 }}>Admin Portal</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px' }}>Enter your password to continue</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', height: '48px', borderRadius: '12px', padding: '0 16px', fontSize: '14px', outline: 'none', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)', color: 'white' }}
            />
            <button
              onClick={handleLogin}
              style={{ width: '100%', height: '48px', borderRadius: '12px', background: '#4f46e5', color: 'white', fontSize: '15px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              Login
            </button>
            <button
              onClick={() => router.push('/')}
              style={{ width: '100%', height: '40px', borderRadius: '12px', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 500, margin: 0 }}>Dashboard</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>Manage your elections</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => router.push('/admin/create')}
              style={{ height: '40px', padding: '0 16px', borderRadius: '10px', background: '#4f46e5', color: 'white', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              + New Election
            </button>
            <button
              onClick={handleLogout}
              style={{ height: '40px', padding: '0 16px', borderRadius: '10px', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', border: '0.5px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Total', value: elections.length },
            { label: 'Active', value: elections.filter(e => getElectionStatus(e.is_active, e.start_date, e.end_date) === 'active').length },
            { label: 'Ended', value: elections.filter(e => getElectionStatus(e.is_active, e.start_date, e.end_date) === 'ended').length },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 500 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
              Loading elections...
            </div>
          )}

          {!loading && elections.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', border: '0.5px dashed rgba(255,255,255,0.1)', borderRadius: '16px', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
              No elections yet. Click "+ New Election" to create one!
            </div>
          )}

          {elections.map((e) => {
            const status = getElectionStatus(e.is_active, e.start_date, e.end_date)
            const sc = status === 'active'
              ? { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: '● Active' }
              : status === 'ended'
              ? { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: '● Ended' }
              : { bg: 'rgba(234,179,8,0.1)', color: '#eab308', label: '● Upcoming' }

            return (
              <div key={e.id} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h2 style={{ color: 'white', fontSize: '14px', fontWeight: 500, margin: 0 }}>{e.title}</h2>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: sc.bg, color: sc.color }}>
                    {sc.label}
                  </span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginBottom: '14px' }}>
                  {e.school_name} · {formatDate(e.start_date)} → {formatDate(e.end_date)}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Setup', path: `/admin/${e.id}/setup` },
                    { label: 'Results', path: `/admin/${e.id}/results` },
                    { label: 'Public', path: `/results/${e.id}` },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={() => router.push(btn.path)}
                      style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
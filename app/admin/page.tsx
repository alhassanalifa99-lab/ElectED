'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function AdminPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [schoolCode, setSchoolCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [schoolName, setSchoolName] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [elections, setElections] = useState<any[]>([])

  // Schools management (super admin only)
  const [schools, setSchools] = useState<any[]>([])
  const [showAddSchool, setShowAddSchool] = useState(false)
  const [newSchoolName, setNewSchoolName] = useState('')
  const [newSchoolSlug, setNewSchoolSlug] = useState('')
  const [newSchoolPassword, setNewSchoolPassword] = useState('')
  const [addingSchool, setAddingSchool] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const isAuthed = sessionStorage.getItem('admin_authed') === 'true'
      if (isAuthed) {
        setAuthed(true)
        setSchoolName(sessionStorage.getItem('school_name') || '')
        const isSuper = sessionStorage.getItem('is_super_admin') === 'true'
        setIsSuperAdmin(isSuper)
        fetchElections()
        if (isSuper) fetchSchools()
      }
    } catch (e) {}
  }, [])

  async function fetchElections() {
    const isSuper = sessionStorage.getItem('is_super_admin') === 'true'
    const schoolId = sessionStorage.getItem('school_id')

    let query = supabase.from('elections').select('*').order('created_at', { ascending: false })

    if (!isSuper) {
      query = query.eq('school_id', schoolId)
    }

    const { data } = await query
    setElections(data || [])
  }

  async function fetchSchools() {
    const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false })
    setSchools(data || [])
  }

 function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

  async function handleAddSchool() {
    if (!newSchoolName.trim() || !newSchoolSlug.trim() || !newSchoolPassword.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    const slug = slugify(newSchoolSlug)

    if (schools.some(s => s.slug === slug)) {
      toast.error(`School code "${slug}" is already taken`)
      return
    }

    setAddingSchool(true)

    const { error } = await supabase
      .from('schools')
      .insert([{
        name: newSchoolName.trim(),
        slug,
        admin_password: newSchoolPassword.trim(),
      }])

    if (error) {
      toast.error(error.message.includes('duplicate') ? `School code "${slug}" is already taken` : 'Failed to add school')
      setAddingSchool(false)
      return
    }

    toast.success(`School "${newSchoolName.trim()}" added! Code: ${slug}`)
    setNewSchoolName('')
    setNewSchoolSlug('')
    setNewSchoolPassword('')
    setShowAddSchool(false)
    await fetchSchools()
    setAddingSchool(false)
  }

  async function handleDeleteSchool(school: any) {
    const { count } = await supabase
      .from('elections')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', school.id)

    if (count && count > 0) {
      toast.error(`Cannot delete — this school has ${count} election${count === 1 ? '' : 's'}`)
      return
    }

    if (!window.confirm(`Delete "${school.name}"? This cannot be undone.`)) return

    const { error } = await supabase.from('schools').delete().eq('id', school.id)
    if (error) {
      toast.error('Failed to delete school')
      return
    }

    toast.success(`"${school.name}" deleted`)
    await fetchSchools()
  }

  function copyLoginInfo(school: any) {
    const text = `School Code: ${school.slug}\nPassword: ${school.admin_password}\nLogin at: https://elect-ed-pied.vercel.app/admin`
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Login details copied!')
    }).catch(() => {
      toast.info(text)
    })
  }

  async function handleLogin() {
    if (!schoolCode.trim() || !password.trim()) {
      toast.error('Enter your school code and password')
      return
    }
    setLoading(true)

    const { data: school, error } = await supabase
      .from('schools')
      .select('*')
      .eq('slug', schoolCode.trim().toLowerCase())
      .single()

    if (error || !school) {
      toast.error('Invalid school code or password')
      setLoading(false)
      return
    }

    if (school.admin_password !== password) {
      toast.error('Invalid school code or password')
      setLoading(false)
      return
    }

    const isSuper = school.slug === 'super'

    sessionStorage.setItem('admin_authed', 'true')
    sessionStorage.setItem('school_id', school.id)
    sessionStorage.setItem('school_name', school.name)
    sessionStorage.setItem('school_slug', school.slug)
    sessionStorage.setItem('is_super_admin', isSuper ? 'true' : 'false')

    setAuthed(true)
    setSchoolName(school.name)
    setIsSuperAdmin(isSuper)
    await fetchElections()
    if (isSuper) await fetchSchools()
    toast.success(`Welcome, ${school.name}!`)
    setLoading(false)
  }

  function handleLogout() {
    sessionStorage.clear()
    setAuthed(false)
    setElections([])
    setSchools([])
    setIsSuperAdmin(false)
  }

  if (!mounted) return null

  const input = { width: '100%', height: '48px', borderRadius: '12px', padding: '0 16px', fontSize: '14px', outline: 'none', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)', color: 'white' }
  const btn = { height: '48px', padding: '0 20px', borderRadius: '12px', background: '#4f46e5', color: 'white', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer' }
  const btnSm = { padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontSize: '12px', border: '0.5px solid rgba(255,255,255,0.12)', cursor: 'pointer' }
  const card = { background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }

  if (!authed) {
    return (
      <div style={{ background: '#0f0c29', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', marginBottom: '24px', padding: 0 }}>
            ← Back
          </button>

          <div style={{ ...card, padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔐</div>
              <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 500, margin: 0 }}>Admin Login</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px' }}>
                Enter your school code and password
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="School code (e.g. accra-high)"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                style={input}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={input}
              />
              <button onClick={handleLogin} disabled={loading} style={{ ...btn, width: '100%', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Checking...' : 'Login →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 500, margin: 0 }}>
              {isSuperAdmin ? '🌐 All Schools' : schoolName}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '4px' }}>
              {isSuperAdmin ? 'Super admin — viewing every school' : 'Admin Dashboard'}
            </p>
          </div>
          <button onClick={handleLogout} style={{ ...btn, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
            Logout
          </button>
        </div>

        {/* Schools management - super admin only */}
        {isSuperAdmin && (
          <div style={{ ...card, marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ color: 'white', fontSize: '15px', fontWeight: 500, margin: 0 }}>Schools</h2>
              <button onClick={() => setShowAddSchool(!showAddSchool)} style={btnSm}>
                {showAddSchool ? 'Cancel' : '+ Add School'}
              </button>
            </div>

            {showAddSchool && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
                <input
                  placeholder="School name (e.g. Tema International School)"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  style={input}
                />
                <input
                  placeholder="School code (e.g. tema-intl)"
                  value={newSchoolSlug}
                  onChange={(e) => setNewSchoolSlug(slugify(e.target.value))}
                  style={input}
                />
                <input
                  placeholder="Admin password"
                  value={newSchoolPassword}
                  onChange={(e) => setNewSchoolPassword(e.target.value)}
                  style={input}
                />
                <button onClick={handleAddSchool} disabled={addingSchool} style={{ ...btn, opacity: addingSchool ? 0.7 : 1 }}>
                  {addingSchool ? 'Adding...' : 'Add School'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {schools.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No schools yet</p>
              )}
              {schools.map(school => (
                <div key={school.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ color: 'white', fontSize: '14px' }}>{school.name}</span>
                    <span style={{ color: '#a5b4fc', fontSize: '12px', marginLeft: '10px', fontFamily: 'monospace' }}>{school.slug}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: '10px' }}>pw: {school.admin_password}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => copyLoginInfo(school)} style={btnSm}>Copy login info</button>
                    <button onClick={() => handleDeleteSchool(school)} style={{ ...btnSm, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => router.push('/admin/create')} style={{ ...btn, width: '100%', marginBottom: '20px' }}>
          + Create New Election
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {elections.length === 0 && (
            <div style={{ ...card, textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>No elections yet. Create one above!</p>
            </div>
          )}
          {elections.map(el => (
            <div
              key={el.id}
              onClick={() => router.push(`/admin/${el.id}/setup`)}
              style={{ ...card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: 'white', fontSize: '15px', fontWeight: 500, margin: 0 }}>{el.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '4px' }}>{el.school_name}</p>
              </div>
              <div style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '999px', background: el.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: el.is_active ? '#10b981' : 'rgba(255,255,255,0.4)' }}>
                {el.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
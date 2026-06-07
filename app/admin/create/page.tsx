'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CreateElectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    school_name: '',
    start_date: '',
    end_date: '',
  })

  async function handleCreate() {
    if (!form.title || !form.school_name || !form.start_date || !form.end_date) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('elections')
      .insert([{ ...form, is_active: false }])
      .select()
      .single()

    if (error) {
      toast.error('Failed to create election')
      setLoading(false)
      return
    }
    toast.success('Election created!')
    router.push(`/admin/${data.id}/setup`)
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '0.5px solid rgba(255,255,255,0.15)',
    color: 'white',
  }

  return (
    <main className="min-h-screen px-6 py-8" style={{ background: '#0f0c29' }}>
      <div className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

      <div className="relative z-10 max-w-lg mx-auto">
        <button onClick={() => router.push('/admin')}
          className="text-sm mb-6 flex items-center gap-2 transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          ← Back to Dashboard
        </button>

        <h1 className="text-2xl font-medium text-white mb-2">New Election</h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Fill in the details to create a new election
        </p>

        <div className="space-y-4">
          {[
            { label: 'Election Title *', key: 'title', placeholder: 'e.g. 2025 SRC Elections', type: 'text' },
            { label: 'School Name *', key: 'school_name', placeholder: 'e.g. Accra High School', type: 'text' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {f.label}
              </label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className="w-full h-12 rounded-xl px-4 text-sm outline-none"
                style={inputStyle}
              />
            </div>
          ))}

          <div>
            <label className="text-xs mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Description
            </label>
            <textarea
              placeholder="Brief description of this election..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Start Date *', key: 'start_date' },
              { label: 'End Date *', key: 'end_date' },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {f.label}
                </label>
                <input
                  type="datetime-local"
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full h-12 rounded-xl px-4 text-sm outline-none"
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full h-12 rounded-xl text-white font-medium mt-4 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#4f46e5' }}>
            {loading ? 'Creating...' : 'Create Election →'}
          </button>
        </div>
      </div>
    </main>
  )
}
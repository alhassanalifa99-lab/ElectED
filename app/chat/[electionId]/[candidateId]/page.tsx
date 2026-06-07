'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const electionId = params.electionId as string
  const candidateId = params.candidateId as string

  const [candidate, setCandidate] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (candidateId) fetchCandidate()
  }, [candidateId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchCandidate() {
    const { data } = await supabase.from('candidates').select('*').eq('id', candidateId).single()
    setCandidate(data)
    setFetching(false)
    if (data) {
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm ${data.name}. Ask me anything about my plans and campaign promises. I'll answer based on my manifesto.`
      }])
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: candidate.name,
          manifesto: candidate.manifesto,
          messages: newMessages,
        }),
      })
      const data = await response.json()
      setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I could not respond right now. Please try again.' }])
    }
    setLoading(false)
  }

  if (fetching) {
    return (
      <div style={{ background: '#0f0c29', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#0f0c29', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15,12,41,0.95)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
          ←
        </button>

        <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {candidate?.photo_url ? (
            <img src={candidate.photo_url} alt={candidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#818cf8', fontSize: '16px', fontWeight: 600 }}>{candidate?.name?.charAt(0)}</span>
          )}
        </div>

        <div>
          <h1 style={{ color: 'white', fontSize: '15px', fontWeight: 500, margin: 0 }}>{candidate?.name}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>AI powered by manifesto</p>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
          🤖 AI
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '100px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '10px', alignItems: 'flex-end' }}>

            {msg.role === 'assistant' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {candidate?.photo_url ? (
                  <img src={candidate.photo_url} alt={candidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: '#818cf8', fontSize: '13px', fontWeight: 600 }}>{candidate?.name?.charAt(0)}</span>
                )}
              </div>
            )}

            <div style={{
              maxWidth: '75%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? '#4f46e5' : 'rgba(255,255,255,0.06)',
              border: msg.role === 'user' ? 'none' : '0.5px solid rgba(255,255,255,0.08)',
              color: 'white',
              fontSize: '14px',
              lineHeight: 1.6,
            }}>
              {msg.content}
            </div>

          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#818cf8', fontSize: '13px', fontWeight: 600 }}>{candidate?.name?.charAt(0)}</span>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
              Typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 1 && (
        <div style={{ padding: '0 24px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            'What are your top priorities?',
            'How will you improve student welfare?',
            'What makes you different?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '0.5px solid rgba(99,102,241,0.3)', cursor: 'pointer' }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'rgba(15,12,41,0.95)', borderTop: '0.5px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', gap: '10px', maxWidth: '800px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder={`Ask ${candidate?.name} a question...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            style={{ flex: 1, height: '48px', borderRadius: '24px', padding: '0 20px', fontSize: '14px', outline: 'none', background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.15)', color: 'white' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#4f46e5', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', opacity: loading || !input.trim() ? 0.5 : 1, flexShrink: 0 }}>
            ↑
          </button>
        </div>
      </div>

    </div>
  )
}
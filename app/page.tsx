'use client'

import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#0f0c29' }}>

      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

      <div className="relative z-10 flex flex-col items-center gap-7 w-full max-w-sm">

        <div className="text-xs uppercase tracking-widest px-4 py-2 rounded-full"
          style={{ background: 'rgba(99,102,241,0.15)', border: '0.5px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
          Student Election Platform
        </div>

        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.12)', border: '0.5px solid rgba(99,102,241,0.3)' }}>
          <span className="text-4xl">🗳️</span>
        </div>

        <h1 className="text-6xl font-medium text-white tracking-tight">
          Elect<span style={{ color: '#818cf8' }}>ED</span>
        </h1>

        <p className="text-center text-sm leading-relaxed max-w-xs"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          The smart, transparent, and secure way to run student elections
        </p>

        <div className="flex gap-8 items-center">
          {[
            { num: '100%', label: 'Secure' },
            { num: 'Live', label: 'Results' },
            { num: 'AI', label: 'Powered' },
          ].map((s, i) => (
            <div key={i} className="flex gap-8 items-center">
              {i > 0 && <div className="w-px h-7" style={{ background: 'rgba(255,255,255,0.08)' }} />}
              <div className="text-center">
                <div className="text-base font-medium text-white">{s.num}</div>
                <div className="text-xs uppercase tracking-wider mt-1"
                  style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full pt-2">
          <button
            type="button"
            onClick={() => router.push('/vote')}
            className="w-full rounded-2xl text-white font-medium text-base transition-opacity hover:opacity-90"
            style={{ background: '#4f46e5', height: '52px' }}>
            🗳️ Cast Your Vote
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="w-full rounded-2xl font-medium text-base transition-all hover:bg-white/5"
            style={{ height: '52px', border: '0.5px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', background: 'transparent' }}>
            🔒 Admin Portal
          </button>
        </div>

        <div className="flex gap-3 text-xs pt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
          <span>Secure</span><span>•</span>
          <span>Transparent</span><span>•</span>
          <span>Digital</span>
        </div>

      </div>
    </main>
  )
}
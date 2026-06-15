import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashValue } from '@/lib/hash'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { indexNumber, pin, electionId } = await req.json()

    if (!indexNumber || !pin || !electionId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const indexHash = hashValue(indexNumber)
    const pinHash = hashValue(pin)

    const { data: voter, error } = await supabaseAdmin
      .from('voters')
      .select('*')
      .eq('election_id', electionId)
      .eq('index_number_hash', indexHash)
      .eq('pin_hash', pinHash)
      .single()

    if (error || !voter) {
      return NextResponse.json({ error: 'Invalid Index Number or PIN' }, { status: 404 })
    }

    return NextResponse.json({ voter })
  } catch (err) {
    console.error('Login route error:', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
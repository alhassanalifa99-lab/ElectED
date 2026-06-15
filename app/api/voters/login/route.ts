import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashStudentId } from '@/lib/hash'

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase admin credentials')
  }
  return createClient(url, key)
}

export async function POST(req: Request) {
  try {
    const { studentId, email, electionId } = await req.json()

    if (!studentId || !email || !electionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const trimmedId = studentId.trim()
    const trimmedEmail = email.trim()
    const normalizedEmail = trimmedEmail.toLowerCase()
    const studentIdHash = hashStudentId(studentId)

    const supabase = createAdminClient()

    // Try hashed lookup first (new pipeline)
    const { data: hashedVoter } = await supabase
      .from('voters')
      .select('*')
      .eq('election_id', electionId)
      .eq('student_id_hash', studentIdHash)
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (hashedVoter) {
      return NextResponse.json({ voter: hashedVoter })
    }

    // Fallback for legacy demo rows (plaintext student_id, no hash yet)
    const { data: legacyVoter } = await supabase
      .from('voters')
      .select('*')
      .eq('election_id', electionId)
      .eq('student_id', trimmedId)
      .eq('email', trimmedEmail)
      .maybeSingle()

    if (legacyVoter) {
      return NextResponse.json({ voter: legacyVoter })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

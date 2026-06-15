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
    const { electionId, voters } = await req.json()

    if (!electionId || !Array.isArray(voters)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const rows = voters.map((v: { studentId: string; email: string }) => ({
      election_id: electionId,
      student_id_hash: hashStudentId(v.studentId),
      email: v.email.trim().toLowerCase(),
      has_voted: false,
    }))

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('voters')
      .upsert(rows, {
        onConflict: 'student_id_hash,election_id',
        ignoreDuplicates: true,
      })
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      attempted: rows.length,
      inserted: data?.length ?? 0,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

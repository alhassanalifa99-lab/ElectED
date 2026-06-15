import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashValue, generatePin } from '@/lib/hash'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { electionId, indexNumbers } = await req.json()

    if (!electionId || !Array.isArray(indexNumbers) || indexNumbers.length === 0) {
      return NextResponse.json({ error: 'electionId and indexNumbers[] are required' }, { status: 400 })
    }

    // Clean + dedupe input
    const cleanIndexNumbers = Array.from(
      new Set(
        indexNumbers
          .map((n: string) => (n || '').trim().toUpperCase())
          .filter(Boolean)
      )
    )

    if (cleanIndexNumbers.length === 0) {
      return NextResponse.json({ error: 'No valid index numbers found' }, { status: 400 })
    }

    // Hash all incoming index numbers
    const hashToIndexNumber = new Map<string, string>()
    for (const idx of cleanIndexNumbers) {
      hashToIndexNumber.set(hashValue(idx), idx)
    }
    const allHashes = Array.from(hashToIndexNumber.keys())

    // Find which already exist for this election
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('voters')
      .select('index_number_hash')
      .eq('election_id', electionId)
      .in('index_number_hash', allHashes)

    if (existingError) {
      console.error('Existing lookup error:', existingError)
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    const existingHashes = new Set((existing || []).map((r: any) => r.index_number_hash))
    const newHashes = allHashes.filter(h => !existingHashes.has(h))

    const results: { indexNumber: string; pin: string }[] = []
    const rows = newHashes.map(hash => {
      const pin = generatePin()
      results.push({ indexNumber: hashToIndexNumber.get(hash)!, pin })
      return {
        election_id: electionId,
        index_number_hash: hash,
        pin_hash: hashValue(pin),
        has_voted: false,
      }
    })

    if (rows.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('voters')
        .upsert(rows, {
          onConflict: 'index_number_hash,election_id',
          ignoreDuplicates: true,
        })

      if (insertError) {
        console.error('Voter import error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      attempted: cleanIndexNumbers.length,
      inserted: rows.length,
      skipped: cleanIndexNumbers.length - rows.length,
      results,
    })
  } catch (err) {
    console.error('Import route error:', err)
    return NextResponse.json({ error: 'Failed to process import' }, { status: 500 })
  }
}
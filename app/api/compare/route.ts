import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { candidates } = await req.json()

    const candidateText = candidates
      .map((c: any, i: number) => `Candidate ${i + 1} - ${c.name}: ${c.manifesto || 'No manifesto provided'}`)
      .join('\n\n')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `Compare these candidates in 2-3 sentences. Be neutral, factual, and highlight the key differences in their approaches. Do not declare a winner.\n\n${candidateText}`,
          },
        ],
      }),
    })

    const data = await response.json()
    const summary = data.content?.[0]?.text || ''

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Compare API error:', error)
    return NextResponse.json({ summary: '' }, { status: 500 })
  }
}
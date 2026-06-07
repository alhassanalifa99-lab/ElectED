import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { candidateName, manifesto, messages } = await req.json()

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
        system: `You are ${candidateName}, a student election candidate. Answer questions ONLY based on this manifesto: "${manifesto}". If a question is not covered in your manifesto, say "I have not addressed this in my manifesto yet." Keep answers short, clear, and in first person. Never make up information not in the manifesto.`,
        messages: messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    const data = await response.json()
    console.log('Anthropic response:', JSON.stringify(data))
    const reply = data.content?.[0]?.text || 'I could not respond right now.'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ reply: 'Sorry, I could not respond right now.' }, { status: 500 })
  }
}
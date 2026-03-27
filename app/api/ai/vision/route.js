import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabaseServer'

export const maxDuration = 60

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { question, userAnswer, correctAnswer, imageBase64 } = body

  if (!imageBase64) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  const admin = createServiceClient()

  const { data: job, error: insertError } = await admin
    .from('ai_jobs')
    .insert({ type: 'vision', payload: { question, userAnswer, correctAnswer, imageBase64 } })
    .select('id')
    .single()

  if (insertError || !job) {
    console.error('ai_jobs insert error:', insertError)
    return NextResponse.json({ error: 'Failed to queue AI job' }, { status: 500 })
  }

  // Poll for result — worker on the Qwen machine will pick this up and write back.
  const deadline = Date.now() + 55_000
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 1000))

    const { data: row } = await admin
      .from('ai_jobs')
      .select('status, result')
      .eq('id', job.id)
      .single()

    if (row?.status === 'done') return NextResponse.json(row.result)
    if (row?.status === 'error') {
      return NextResponse.json({
        correct: false,
        methodCorrect: false,
        finalAnswerCorrect: false,
        completeness: 'incomplete',
        explanation: 'Kunde inte analysera bilden just nu.',
        reasoning: '',
      })
    }
  }

  await admin.from('ai_jobs').update({ status: 'error', result: { error: 'timeout' }, completed_at: new Date().toISOString() }).eq('id', job.id)
  return NextResponse.json({
    correct: false,
    methodCorrect: false,
    finalAnswerCorrect: false,
    completeness: 'incomplete',
    explanation: 'AI-modellen svarar inte. Kontrollera att worker-scriptet är igång.',
    reasoning: '',
  })
}

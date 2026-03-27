import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { callVision } from '@/lib/ai'
import { enqueue } from '@/lib/aiQueue'

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

  // Get user's custom vision model URL if set
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('qwen_api_url')
    .eq('id', user.id)
    .single()

  let result
  try {
    result = await enqueue(() => callVision({
      question,
      userAnswer,
      correctAnswer,
      imageBase64,
      customUrl: profile?.qwen_api_url || undefined,
    }))
  } catch (err) {
    if (err.status === 429) {
      return NextResponse.json({ error: err.message }, { status: 429 })
    }
    throw err
  }

  return NextResponse.json(result)
}

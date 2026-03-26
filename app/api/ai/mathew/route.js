import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'
import { callMathew } from '@/lib/ai'

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { question, userAnswer, correctAnswer, mode = 'check' } = body

  // Get user's custom AI URL if set
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('mathew_api_url')
    .eq('id', user.id)
    .single()

  const result = await callMathew({
    question,
    userAnswer,
    correctAnswer,
    customUrl: profile?.mathew_api_url || undefined,
    mode,
  })

  return NextResponse.json(result)
}

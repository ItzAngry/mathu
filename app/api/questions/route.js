import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const nodeId = searchParams.get('nodeId')
  const chapterId = searchParams.get('chapterId')
  const gradeLevel = searchParams.get('gradeLevel')

  // Get user's grade goal for filtering
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('grade_goal')
    .eq('id', user.id)
    .single()

  const mode = searchParams.get('mode') // 'mixed' = no grade filter
  const targetGrade = gradeLevel || profile?.grade_goal || 'C'

  let query = supabase
    .from('questions')
    .select('*')
    .order('order_index')

  if (nodeId) query = query.eq('node_id', nodeId)
  else if (chapterId) query = query.eq('chapter_id', chapterId)

  // Filter by grade level: exact match for user's grade, or all grades in mixed mode
  if (mode !== 'mixed') {
    query = query.or(`grade_level.eq.${targetGrade},grade_level.is.null`)
  }

  const { data: questions, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questions: questions ?? [] })
}

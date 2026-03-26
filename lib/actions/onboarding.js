'use server'

import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

export async function saveGradeGoal(prevState, formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const gradeGoal = formData.get('grade_goal')

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      grade_goal: gradeGoal,
      onboarding_complete: true,
    })

  if (error) {
    return { error: error.message }
  }

  redirect('/plugga')
}

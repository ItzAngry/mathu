import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import FragorClient from './FragorClient'

export const metadata = { title: 'Frågor' }

export default async function FragorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title, icon, color, order_index')
    .eq('is_published', true)
    .order('order_index')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('grade_goal')
    .eq('id', user.id)
    .single()

  return <FragorClient chapters={chapters ?? []} gradeGoal={profile?.grade_goal ?? 'C'} />
}

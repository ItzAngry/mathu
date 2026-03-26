import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ProvClient from './ProvClient'

export const metadata = { title: 'Prov' }

export default async function ProvPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get regular test nodes (not national exams)
  const { data: testNodes } = await supabase
    .from('nodes')
    .select('*, chapters(title, icon, color)')
    .eq('type', 'test')
    .eq('is_published', true)
    .neq('is_national_exam', true)
    .order('order_index')

  // Get national exam nodes (sorted by year descending)
  const { data: nationalNodes } = await supabase
    .from('nodes')
    .select('*, chapters(title, icon, color)')
    .eq('type', 'test')
    .eq('is_published', true)
    .eq('is_national_exam', true)
    .order('exam_year', { ascending: false })

  // Get user progress for all test nodes
  const allNodes = [...(testNodes ?? []), ...(nationalNodes ?? [])]
  const nodeIds = allNodes.map((n) => n.id)
  const { data: progressRows } = nodeIds.length > 0
    ? await supabase.from('user_progress').select('*').in('node_id', nodeIds).eq('user_id', user.id)
    : { data: [] }

  const progressMap = {}
  for (const row of progressRows ?? []) {
    progressMap[row.node_id] = row
  }

  return (
    <ProvClient
      testNodes={testNodes ?? []}
      nationalNodes={nationalNodes ?? []}
      progressMap={progressMap}
    />
  )
}

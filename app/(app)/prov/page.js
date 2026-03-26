import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ProvClient from './ProvClient'

export const metadata = { title: 'Prov' }

export default async function ProvPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get test nodes
  const { data: testNodes } = await supabase
    .from('nodes')
    .select('*, chapters(title, icon, color)')
    .eq('type', 'test')
    .eq('is_published', true)
    .order('order_index')

  // Get user progress for test nodes
  const nodeIds = testNodes?.map((n) => n.id) ?? []
  const { data: progressRows } = nodeIds.length > 0
    ? await supabase.from('user_progress').select('*').in('node_id', nodeIds).eq('user_id', user.id)
    : { data: [] }

  const progressMap = {}
  for (const row of progressRows ?? []) {
    progressMap[row.node_id] = row
  }

  return <ProvClient testNodes={testNodes ?? []} progressMap={progressMap} />
}

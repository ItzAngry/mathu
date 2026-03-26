import { createClient } from '@/lib/supabaseServer'
import NationalExamsClient from './NationalExamsClient'

export const metadata = { title: 'Nationella prov – Admin' }

export default async function AdminNationalPage() {
  const supabase = await createClient()

  const [{ data: examNodes }, { data: questions }, { data: chapters }] = await Promise.all([
    supabase
      .from('nodes')
      .select('*')
      .eq('is_national_exam', true)
      .order('exam_year', { ascending: false })
      .order('title'),
    supabase
      .from('questions')
      .select('*')
      .order('order_index'),
    supabase
      .from('chapters')
      .select('id, title')
      .order('order_index'),
  ])

  // Group questions by node_id
  const questionsByNode = {}
  for (const q of questions ?? []) {
    if (!q.node_id) continue
    if (!questionsByNode[q.node_id]) questionsByNode[q.node_id] = []
    questionsByNode[q.node_id].push(q)
  }

  return (
    <NationalExamsClient
      examNodes={examNodes ?? []}
      questionsByNode={questionsByNode}
      chapters={chapters ?? []}
    />
  )
}

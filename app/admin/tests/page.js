import { createClient } from '@/lib/supabaseServer'
import AdminTestsClient from './AdminTestsClient'

export const metadata = { title: 'Noder – Admin' }

export default async function AdminTestsPage() {
  const supabase = await createClient()

  const [{ data: chapters }, { data: nodes }] = await Promise.all([
    supabase.from('chapters').select('*').order('order_index'),
    supabase
      .from('nodes')
      .select('*')
      .neq('is_national_exam', true)
      .order('chapter_id')
      .order('order_index'),
  ])

  return <AdminTestsClient chapters={chapters ?? []} nodes={nodes ?? []} />
}

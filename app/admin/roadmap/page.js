import { createClient } from '@/lib/supabaseServer'
import AdminRoadmapClient from './AdminRoadmapClient'

export const metadata = { title: 'Admin – Kursträd' }

export default async function AdminRoadmapPage() {
  const supabase = await createClient()

  const [{ data: chapters }, { data: nodes }, { data: questions }] = await Promise.all([
    supabase.from('chapters').select('*').order('order_index'),
    supabase.from('nodes').select('*').order('order_index'),
    supabase.from('questions').select('*').order('order_index'),
  ])

  return (
    <AdminRoadmapClient
      chapters={chapters ?? []}
      nodes={nodes ?? []}
      questions={questions ?? []}
    />
  )
}

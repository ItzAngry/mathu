import { createClient } from '@/lib/supabaseServer'
import AdminQuestionsClient from './AdminQuestionsClient'

export default async function AdminQuestionsPage() {
  const supabase = await createClient()

  const [{ data: chapters }, { data: nodes }, { data: questions }] = await Promise.all([
    supabase.from('chapters').select('id, title, order_index').order('order_index'),
    supabase.from('nodes').select('id, title, type, chapter_id, order_index').order('order_index'),
    supabase.from('questions').select('*').order('order_index'),
  ])

  return (
    <AdminQuestionsClient
      chapters={chapters ?? []}
      nodes={nodes ?? []}
      questions={questions ?? []}
    />
  )
}

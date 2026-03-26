import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import PluggaNodeQuestionsClient from '@/components/questions/PluggaNodeQuestionsClient'

export async function generateMetadata({ params }) {
  const { nodeId } = await params
  const supabase = await createClient()
  const { data: node } = await supabase
    .from('nodes')
    .select('title')
    .eq('id', nodeId)
    .eq('is_published', true)
    .maybeSingle()

  if (!node?.title) return { title: 'Frågor' }
  return { title: `${node.title} · Frågor` }
}

export default async function PluggaNodeQuestionsPage({ params }) {
  const { nodeId } = await params
  const supabase = await createClient()

  const { data: node } = await supabase
    .from('nodes')
    .select('id, title, type')
    .eq('id', nodeId)
    .eq('is_published', true)
    .maybeSingle()

  if (!node || (node.type !== 'practice' && node.type !== 'test')) {
    notFound()
  }

  return <PluggaNodeQuestionsClient node={node} />
}

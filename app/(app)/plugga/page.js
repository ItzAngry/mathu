import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ProgressBar from '@/components/layout/ProgressBar'
import PluggaJumpControls from '@/components/roadmap/PluggaJumpControls'
import PluggaRoadmapList from '@/components/roadmap/PluggaRoadmapList'

export const metadata = { title: 'Plugga' }

export default async function PluggaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch chapters + nodes
  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('is_published', true)
    .order('order_index')

  const { data: nodes } = await supabase
    .from('nodes')
    .select('*')
    .eq('is_published', true)
    .order('order_index')

  // Fetch user progress
  const { data: progressRows } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)

  // Build progressMap: node_id → progress row
  const progressMap = {}
  for (const row of progressRows ?? []) {
    progressMap[row.node_id] = row
  }

  // Group nodes by chapter
  const nodesByChapter = {}
  for (const node of nodes ?? []) {
    if (!nodesByChapter[node.chapter_id]) nodesByChapter[node.chapter_id] = []
    nodesByChapter[node.chapter_id].push(node)
  }

  const totalNodes = nodes?.length ?? 0
  const completedNodes = Object.values(progressMap).filter((p) => p.completed).length

  return (
    <div className="flex flex-col min-h-screen">
      {/* Progress bar — sticky at top */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-sm border-b border-border">
        <ProgressBar completed={completedNodes} total={totalNodes} label="Din framgång i Matte1b" />
        <PluggaJumpControls />
      </div>

      {/* Roadmap — flex-col-reverse so chapter 1 renders at bottom */}
      <div className="flex flex-col-reverse py-10 max-w-2xl mx-auto w-full px-2">
        <PluggaRoadmapList chapters={chapters ?? []} nodesByChapter={nodesByChapter} progressMap={progressMap} />
      </div>

    </div>
  )
}

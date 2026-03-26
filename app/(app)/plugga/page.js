import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ProgressBar from '@/components/layout/ProgressBar'
import RoadmapChapter from '@/components/roadmap/RoadmapChapter'
import MathewChatbot from '@/components/chat/MathewChatbot'

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

  // Check if previous chapter is complete
  function isPrevChapterComplete(chapterIdx) {
    if (chapterIdx === 0) return true
    const prevChapter = chapters[chapterIdx - 1]
    const prevNodes = nodesByChapter[prevChapter?.id] ?? []
    return prevNodes.every((n) => progressMap[n.id]?.completed)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Progress bar */}
      <ProgressBar completed={completedNodes} total={totalNodes} label="Din framgång i Matte1b" />

      {/* Roadmap */}
      <div className="flex-1 overflow-y-auto py-8 max-w-2xl mx-auto w-full">
        {chapters?.map((chapter, idx) => (
          <RoadmapChapter
            key={chapter.id}
            chapter={chapter}
            nodes={nodesByChapter[chapter.id] ?? []}
            progressMap={progressMap}
            chapterIndex={idx}
            previousChapterComplete={isPrevChapterComplete(idx)}
          />
        ))}

        {(!chapters || chapters.length === 0) && (
          <div className="text-center py-20 text-text-muted">
            <div className="text-5xl mb-4">📚</div>
            <p>Kursen håller på att byggas upp. Kom tillbaka snart!</p>
          </div>
        )}
      </div>

      {/* Mathew chatbot */}
      <MathewChatbot />
    </div>
  )
}

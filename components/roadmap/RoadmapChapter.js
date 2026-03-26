'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import RoadmapNode from './RoadmapNode'
import RoadmapConnector from './RoadmapConnector'
import NodeModal from './NodeModal'
import ChapterSkipModal from './ChapterSkipModal'
import {
  getSkippedChapterIds,
  addSkippedChapter,
  pushJumpRecord,
  clearAllChapterSkipState,
  CHAPTER_SKIP_EVENT,
} from '@/lib/pluggaChapterUnlock'
import { completePriorNodesForChapterSkip, resetRoadmapProgressFromChapter } from '@/lib/actions/progress'
import { PLUGGA_LESSON_ANCHOR_ID } from '@/lib/pluggaProgressUtils'

// Zigzag positions — must match the pl/pr offsets in the render below
const POSITIONS = ['center', 'right', 'center', 'left', 'center']

const chapterJumpChipClass =
  'inline-flex items-center justify-center rounded-lg border border-amber-200/95 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 shadow-sm hover:bg-amber-100 transition-colors focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-2'

export default function RoadmapChapter({
  chapter,
  nodes,
  progressMap,
  chapterIndex,
  previousChapterComplete,
  canOfferRestartFromThisChapter = false,
  lessonAnchorChapterId = null,
  lessonAnchorNodeId = null,
}) {
  const router = useRouter()
  const [activeNode, setActiveNode] = useState(null)
  const [skipModalOpen, setSkipModalOpen] = useState(false)
  const [skipLoading, setSkipLoading] = useState(false)
  const [restartLoading, setRestartLoading] = useState(false)
  // Empty until after mount — must match SSR; localStorage is synced in useEffect.
  const [skippedIds, setSkippedIds] = useState(() => new Set())

  useEffect(() => {
    function syncSkipped() {
      setSkippedIds(new Set(getSkippedChapterIds()))
    }
    syncSkipped()
    window.addEventListener(CHAPTER_SKIP_EVENT, syncSkipped)
    return () => window.removeEventListener(CHAPTER_SKIP_EVENT, syncSkipped)
  }, [])

  const naturallyUnlocked = chapterIndex === 0 || previousChapterComplete
  const skippedUnlocked = skippedIds.has(chapter.id)
  const isUnlocked = naturallyUnlocked || skippedUnlocked

  function isNodeActive(nodeIndex) {
    if (!isUnlocked) return false
    if (nodeIndex === 0) return true
    for (let i = 0; i < nodeIndex; i++) {
      if (!progressMap[nodes[i].id]?.completed) return false
    }
    return true
  }

  const completedCount = nodes.filter((n) => progressMap[n.id]?.completed).length

  const showRestartChip = canOfferRestartFromThisChapter
  const showSkipChip = chapterIndex >= 1 && !naturallyUnlocked && !skippedUnlocked

  async function handleRestartFromThisChapter() {
    if (
      !confirm(
        `Avklarmarkeringar i "${chapter.title}" och alla senare kapitel nollställs. Tidigare kapitel påverkas inte. Sparade kapitelhopp tas bort. Fortsätt?`
      )
    ) {
      return
    }
    setRestartLoading(true)
    const result = await resetRoadmapProgressFromChapter(chapter.id)
    setRestartLoading(false)
    if (result.error) {
      alert('Fel: ' + result.error)
      return
    }
    clearAllChapterSkipState()
    router.refresh()
  }

  const chapterNeedsSrAnchor =
    chapter.id === lessonAnchorChapterId && lessonAnchorNodeId == null

  return (
    <div className="mb-2 scroll-mt-24 relative" id={`plugga-chapter-${chapter.id}`}>
      {chapterNeedsSrAnchor && (
        <span
          id={PLUGGA_LESSON_ANCHOR_ID}
          className="absolute left-1/2 top-8 -translate-x-1/2 w-px h-px overflow-hidden pointer-events-none scroll-mt-28"
          aria-hidden="true"
        />
      )}
      {/*
        flex-col-reverse: DOM order [node0, conn0, node1, conn1, ..., nodeN-1]
        renders visually as  [nodeN-1, connN-2, ..., conn0, node0]
        → node0 at visual BOTTOM (start of chapter), nodeN-1 at visual TOP
      */}
      <div className="flex flex-col-reverse px-4">
        {nodes.map((node, idx) => {
          const pos = POSITIONS[idx % POSITIONS.length]
          const nextPos = POSITIONS[(idx + 1) % POSITIONS.length]
          const active = isNodeActive(idx)
          const prog = progressMap[node.id]
          const isLessonAnchor =
            lessonAnchorNodeId != null &&
            chapter.id === lessonAnchorChapterId &&
            node.id === lessonAnchorNodeId

          return (
            <Fragment key={node.id}>
              {/* Yttre div bär id (scroll) — motion forwardar inte alltid id till DOM. */}
              <div
                id={isLessonAnchor ? PLUGGA_LESSON_ANCHOR_ID : undefined}
                className={[
                  'flex w-full scroll-mt-28',
                  pos === 'left'  ? 'justify-start pl-8' :
                  pos === 'right' ? 'justify-end pr-8'   : 'justify-center',
                ].join(' ')}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: chapterIndex * 0.1 + idx * 0.08, type: 'spring', stiffness: 200 }}
                  className="flex justify-center"
                >
                  <RoadmapNode
                    node={node}
                    progress={prog}
                    isActive={active}
                    onClick={() => setActiveNode(node)}
                  />
                </motion.div>
              </div>

              {/*
                Connector placed AFTER the node in DOM.
                With flex-col-reverse, it appears ABOVE node[idx] visually,
                connecting up toward node[idx+1].
                  topPos    = position of the node ABOVE (idx+1)
                  bottomPos = position of this node (idx)
              */}
              {idx < nodes.length - 1 && (
                <RoadmapConnector
                  completed={prog?.completed}
                  topPos={nextPos}
                  bottomPos={pos}
                />
              )}
            </Fragment>
          )
        })}
      </div>

      {/* Chapter header — sits below the nodes in the DOM so it appears at the
          bottom of each chapter section when the outer list is flex-col-reverse */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: chapterIndex * 0.1 }}
        className="flex items-center gap-3 mt-4 mb-2 px-6"
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm shrink-0"
          style={{ backgroundColor: chapter.color + '22', color: chapter.color }}
          aria-hidden="true"
        >
          {chapter.icon}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
              Kapitel {chapterIndex + 1}
            </span>
            {!isUnlocked && (
              <span className="text-xs bg-surface-2 text-text-muted px-2 py-0.5 rounded-full">Låst</span>
            )}
            {skippedUnlocked && !naturallyUnlocked && (
              <span className="text-xs bg-surface-2 text-text-muted px-2 py-0.5 rounded-full">
                Öppnat utan föregående kapitel
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-text">{chapter.title}</h2>
          <p className="text-xs text-text-muted">{completedCount}/{nodes.length} avklarat</p>
          {(showRestartChip || showSkipChip) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {showRestartChip && (
                <button
                  type="button"
                  onClick={() => void handleRestartFromThisChapter()}
                  className={chapterJumpChipClass}
                  disabled={restartLoading || skipLoading}
                >
                  {restartLoading ? 'Nollställer…' : 'Börja om från detta kapitel'}
                </button>
              )}
              {showSkipChip && (
                <button
                  type="button"
                  onClick={() => setSkipModalOpen(true)}
                  className={chapterJumpChipClass}
                  disabled={restartLoading || skipLoading}
                >
                  Hoppa till detta kapitel
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <div className="mx-6 border-t border-border/50 mt-2" aria-hidden="true" />

      {/* Node modal */}
      <AnimatePresence>
        {activeNode && (
          <NodeModal
            node={activeNode}
            progress={progressMap[activeNode.id]}
            onClose={() => setActiveNode(null)}
          />
        )}
        {skipModalOpen && (
          <ChapterSkipModal
            chapterTitle={chapter.title}
            loading={skipLoading}
            onClose={() => !skipLoading && setSkipModalOpen(false)}
            onConfirm={async () => {
              setSkipLoading(true)
              try {
                const result = await completePriorNodesForChapterSkip(chapter.id)
                if (result.error) {
                  alert('Fel: ' + result.error)
                  return
                }
                pushJumpRecord({ chapterId: chapter.id, autoNodeIds: result.autoNodeIds ?? [] })
                addSkippedChapter(chapter.id)
                setSkipModalOpen(false)
                router.refresh()
              } finally {
                setSkipLoading(false)
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

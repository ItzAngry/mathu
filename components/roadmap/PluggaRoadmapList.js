'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import RoadmapChapter from '@/components/roadmap/RoadmapChapter'
import { getSkippedChapterIds, CHAPTER_SKIP_EVENT } from '@/lib/pluggaChapterUnlock'
import {
  PLUGGA_LESSON_ANCHOR_ID,
  getLessonScrollTarget,
  getProgressCurrentChapterIndex,
  isChapterUnlocked,
} from '@/lib/pluggaProgressUtils'

function scrollToLessonAnchor(behavior = 'smooth') {
  const el = document.getElementById(PLUGGA_LESSON_ANCHOR_ID)
  el?.scrollIntoView({ block: 'center', behavior })
}

export default function PluggaRoadmapList({ chapters, nodesByChapter, progressMap }) {
  const pathname = usePathname()
  // Empty until after mount — must match SSR; localStorage is synced in useEffect.
  const [skippedIds, setSkippedIds] = useState(() => new Set())
  const [anchorInView, setAnchorInView] = useState(true)

  useEffect(() => {
    function sync() {
      setSkippedIds(new Set(getSkippedChapterIds()))
    }
    sync()
    window.addEventListener(CHAPTER_SKIP_EVENT, sync)
    return () => window.removeEventListener(CHAPTER_SKIP_EVENT, sync)
  }, [])

  const list = chapters ?? []

  const lessonTarget = useMemo(
    () => getLessonScrollTarget(list, nodesByChapter, progressMap, skippedIds),
    [list, nodesByChapter, progressMap, skippedIds]
  )

  const progressCurrentChapterIndex = useMemo(
    () => getProgressCurrentChapterIndex(list, nodesByChapter, progressMap, skippedIds),
    [list, nodesByChapter, progressMap, skippedIds]
  )

  const { chapterId: lessonAnchorChapterId, nodeId: lessonAnchorNodeId } = lessonTarget

  const lessonAnchorRef = useRef(lessonTarget)
  lessonAnchorRef.current = lessonTarget

  const scrollGenRef = useRef(0)
  const prevPathForScrollRef = useRef(null)

  /**
   * Scroll till lektion när man navigerar till /plugga (sidomeny m.m.).
   * Körs om vid pathname-byte; använder ref för ankare så vi inte råkar skippa p.g.a. Strict Mode
   * eller Next.js som sätter scrollTop=0 efter första effekten.
   */
  useLayoutEffect(() => {
    if (pathname !== '/plugga') {
      prevPathForScrollRef.current = pathname
      return undefined
    }

    const cameFromElsewhere = prevPathForScrollRef.current !== '/plugga'
    prevPathForScrollRef.current = pathname

    if (!cameFromElsewhere) return undefined

    const myGen = ++scrollGenRef.current
    const timeouts = []
    let rafChain = 0
    let frames = 0
    const maxFrames = 90

    const tryOnce = () => {
      if (scrollGenRef.current !== myGen) return false
      const { chapterId } = lessonAnchorRef.current
      const anchor = document.getElementById(PLUGGA_LESSON_ANCHOR_ID)
      if (anchor) {
        anchor.scrollIntoView({ block: 'center', behavior: 'auto' })
        return true
      }
      if (chapterId) {
        const ch = document.getElementById(`plugga-chapter-${chapterId}`)
        if (ch) {
          ch.scrollIntoView({ block: 'center', behavior: 'auto' })
          return true
        }
      }
      return false
    }

    const rafLoop = () => {
      if (scrollGenRef.current !== myGen) return
      if (tryOnce()) return
      frames += 1
      if (frames < maxFrames) {
        rafChain = requestAnimationFrame(rafLoop)
      }
    }

    tryOnce()
    rafChain = requestAnimationFrame(() => requestAnimationFrame(rafLoop))

    for (const ms of [0, 16, 50, 100, 200, 400, 700]) {
      timeouts.push(
        window.setTimeout(() => {
          if (scrollGenRef.current === myGen) tryOnce()
        }, ms)
      )
    }

    return () => {
      scrollGenRef.current += 1
      cancelAnimationFrame(rafChain)
      timeouts.forEach((t) => clearTimeout(t))
      // React Strict Mode: andra layout-pass måste få cameFromElsewhere === true igen.
      if (pathname === '/plugga') {
        prevPathForScrollRef.current = null
      }
    }
  }, [pathname])

  useEffect(() => {
    if (pathname !== '/plugga') return

    let cancelled = false
    let obs = null
    const t = window.setTimeout(() => {
      if (cancelled) return
      const el = document.getElementById(PLUGGA_LESSON_ANCHOR_ID)
      if (!el) {
        setAnchorInView(true)
        return
      }
      obs = new IntersectionObserver(
        ([entry]) => {
          setAnchorInView(entry.isIntersecting)
        },
        { root: null, rootMargin: '-20% 0px -24% 0px', threshold: [0, 0.05, 0.15] }
      )
      obs.observe(el)
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(t)
      obs?.disconnect()
    }
  }, [pathname, lessonAnchorChapterId, lessonAnchorNodeId, list.length, progressMap, skippedIds])

  const showBackToLesson = pathname === '/plugga' && !anchorInView && lessonAnchorChapterId != null

  const handleBackToLesson = useCallback(() => {
    scrollToLessonAnchor('smooth')
  }, [])

  return (
    <>
      {list.map((chapter, idx) => {
        const prevChapter = idx === 0 ? null : list[idx - 1]
        const prevNodes = nodesByChapter[prevChapter?.id] ?? []
        const previousChapterComplete = idx === 0 || prevNodes.every((n) => progressMap[n.id]?.completed)

        const chapterUnlocked = isChapterUnlocked(list, nodesByChapter, progressMap, skippedIds, idx, chapter.id)
        const canOfferRestartFromThisChapter =
          chapterUnlocked && progressCurrentChapterIndex >= 0 && idx <= progressCurrentChapterIndex

        return (
          <RoadmapChapter
            key={chapter.id}
            chapter={chapter}
            nodes={nodesByChapter[chapter.id] ?? []}
            progressMap={progressMap}
            chapterIndex={idx}
            previousChapterComplete={previousChapterComplete}
            canOfferRestartFromThisChapter={canOfferRestartFromThisChapter}
            lessonAnchorChapterId={lessonAnchorChapterId}
            lessonAnchorNodeId={lessonAnchorNodeId}
          />
        )
      })}
      {list.length === 0 && (
        <div className="text-center py-20 text-text-muted">
          <div className="text-5xl mb-4">📚</div>
          <p>Kursen håller på att byggas upp. Kom tillbaka snart!</p>
        </div>
      )}

      {showBackToLesson && (
        <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 px-4 w-full max-w-md flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={handleBackToLesson}
            className="pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full border border-primary/30 bg-surface px-4 py-2.5 text-sm font-semibold text-primary shadow-lg shadow-black/10 backdrop-blur-sm hover:bg-primary-light transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            Scrolla till lektion
          </button>
        </div>
      )}
    </>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import {
  getJumpStack,
  removeSkippedChapterId,
  removeSkippedChapterIds,
  setJumpStack,
  JUMP_STACK_EVENT,
} from '@/lib/pluggaChapterUnlock'
import { revertAutoCompletedNodes } from '@/lib/actions/progress'

export default function PluggaJumpControls() {
  const router = useRouter()
  // Start at 0 to match SSR; read localStorage after commit (avoids hydration mismatch).
  const [depth, setDepth] = useState(0)
  const [busy, setBusy] = useState(false)
  /** Depth at which the user hid the banner; show again when depth changes. */
  const [bannerHiddenAtDepth, setBannerHiddenAtDepth] = useState(null)

  useEffect(() => {
    function sync() {
      setDepth(getJumpStack().length)
    }
    queueMicrotask(sync)
    window.addEventListener(JUMP_STACK_EVENT, sync)
    return () => window.removeEventListener(JUMP_STACK_EVENT, sync)
  }, [])

  const showBanner = depth > 0 && bannerHiddenAtDepth !== depth

  async function handleRevertLast() {
    const stack = getJumpStack()
    if (stack.length === 0 || busy) return
    const last = stack[stack.length - 1]
    if (
      !confirm(
        'Ångra senaste kapitelhoppet? Alla noder som automatiskt markerades som klara i tidigare kapitel blir inte avklarade igen, och det här kapitlet låses om det inte redan är upplåst på riktigt.'
      )
    ) {
      return
    }

    setBusy(true)
    const r = await revertAutoCompletedNodes(last.autoNodeIds)
    setBusy(false)
    if (r.error) {
      alert(r.error)
      return
    }
    setJumpStack(stack.slice(0, -1))
    removeSkippedChapterId(last.chapterId)
    router.refresh()
  }

  async function handleRevertAll() {
    const stack = getJumpStack()
    if (stack.length === 0 || busy) return
    if (
      !confirm(
        'Ångra alla kapitelhopp? Alla noder som automatiskt markerats som klara via hopp återställs, och låsta kapitel du hoppat till blir låsta igen om du inte klarat dem på riktigt.'
      )
    ) {
      return
    }

    const allNodeIds = [...new Set(stack.flatMap((s) => s.autoNodeIds))]
    const chapterIds = [...new Set(stack.map((s) => s.chapterId))]

    setBusy(true)
    const r = await revertAutoCompletedNodes(allNodeIds)
    setBusy(false)
    if (r.error) {
      alert(r.error)
      return
    }
    setJumpStack([])
    removeSkippedChapterIds(chapterIds)
    router.refresh()
  }

  if (!showBanner) return null

  return (
    <div className="px-3 sm:px-4 py-2.5 border-t border-amber-200/80 bg-amber-50/95 text-sm">
      <div className="max-w-3xl mx-auto w-full flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-text text-xs sm:text-sm leading-snug flex-1 min-w-[min(100%,12rem)]">
          Hoppat framåt, tidigare noder räknas som avklarade. Du kan ångra vid behov.
        </p>  
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0"
            loading={busy}
            disabled={busy}
            onClick={() => void handleRevertLast()}
          >
            Ångra senaste hoppet
          </Button>
          {depth > 1 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              loading={busy}
              disabled={busy}
              onClick={() => void handleRevertAll()}
            >
              Ångra alla hopp
            </Button>
          )}
          <button
            type="button"
            aria-label="Dölj meddelande"
            onClick={() => setBannerHiddenAtDepth(depth)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-amber-900/70 hover:bg-amber-200/80 transition-colors focus-visible:outline-2 focus-visible:outline-amber-600 focus-visible:outline-offset-2"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'

export default function ChapterSkipModal({ chapterTitle, onClose, onConfirm, loading = false }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function onKey(e) {
      if (e.key === 'Escape' && !loading) onClose()
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, loading])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-skip-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />

      <motion.div
        ref={panelRef}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-border"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="p-6 pb-4 border-b border-border">
          <h2 id="chapter-skip-title" className="text-lg font-bold text-text pr-10">
            Hoppa till kapitel
          </h2>
          <p className="text-sm text-text-muted mt-1">{chapterTitle}</p>
        </div>

        <div className="p-6">
          <p className="text-sm text-text leading-relaxed">
            Det rekommenderas att du följer kapitlen i ordning så att du bygger kunskap steg för
            steg. Om du hoppar över ett kapitel kan det bli svårare att hänga med i senare delar.
          </p>
          <p className="text-sm text-text mt-3 leading-relaxed">
            Om du fortsätter markeras alla uppgifter och prov i <strong>tidigare kapitel</strong> som avklarade, så att
            du kan arbeta i det här kapitlet. Du kan senare <strong>ångra hoppet</strong> (då blir de automatiskt
            ifyllda stegen inte avklarade igen om du inte redan gjort dem på riktigt).
          </p>
        </div>

        <div className="p-6 pt-2 flex flex-col sm:flex-row gap-2 sm:justify-end border-t border-border bg-surface-2/50">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            className="sm:min-w-[7rem]"
            disabled={loading}
          >
            Tillbaka
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => void onConfirm()}
            className="sm:min-w-[7rem]"
            loading={loading}
            disabled={loading}
          >
            Öppna kapitel
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

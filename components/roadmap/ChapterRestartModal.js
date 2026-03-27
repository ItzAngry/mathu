'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'

export default function ChapterRestartModal({ chapterTitle, onClose, onConfirm, loading = false, error = null }) {
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
      aria-labelledby="chapter-restart-title"
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
        <div className="p-6 pb-4 border-b border-border flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-warning" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 id="chapter-restart-title" className="text-lg font-bold text-text">
              Börja om från detta kapitel?
            </h2>
            <p className="text-sm text-text-muted mt-0.5">{chapterTitle}</p>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-text leading-relaxed">
            Avklarmarkeringar i <strong>"{chapterTitle}"</strong> och alla <strong>senare kapitel</strong> nollställs.
            Tidigare kapitel påverkas inte. Sparade kapitelhopp tas bort.
          </p>
          <p className="text-sm text-text-muted mt-3 leading-relaxed">
            Det går inte att ångra den här åtgärden.
          </p>

          {error && (
            <div role="alert" className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}
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
            Avbryt
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => void onConfirm()}
            className="sm:min-w-[7rem]"
            loading={loading}
            disabled={loading}
          >
            Börja om
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

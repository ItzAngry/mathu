'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import QuestionSession from '@/components/questions/QuestionSession'
import TTSButton from '@/components/ui/TTSButton'
import { updateNodeProgress } from '@/lib/actions/progress'

function parseMarkdown(md) {
  if (!md) return ''
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-surface-2 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^\| (.+) \|$/gm, (_, row) => {
      const cells = row.split(' | ').map((c) => `<td class="border border-border px-3 py-2">${c}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
    .replace(/(<tr>.*<\/tr>\n)+/gs, (tbl) => `<table class="w-full border-collapse my-3 text-sm">${tbl}</table>`)
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/(<li.*<\/li>\n)+/gs, (list) => `<ul class="my-2">${list}</ul>`)
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/^(?!<[hultpc])(.+)$/gm, '<p class="mb-2">$1</p>')
}

export default function NodeModal({ node, progress, onClose }) {
  const overlayRef = useRef(null)
  const [showQuestions, setShowQuestions] = useState(false)
  const [completing, setCompleting] = useState(false)
  const router = useRouter()

  async function handleIntroComplete() {
    setCompleting(true)
    await updateNodeProgress({ nodeId: node.id, completed: true, score: 100 })
    router.refresh()
    onClose()
  }

  // Focus trap + Escape key
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function onKey(e) {
      if (e.key === 'Escape') onClose()
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
  }, [onClose])

  const isIntro = node.type === 'intro'
  const isPractice = node.type === 'practice' || node.type === 'test'

  if (showQuestions && isPractice) {
    return <QuestionSession node={node} onClose={onClose} />
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="node-modal-title"
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        ref={overlayRef}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-6 pb-4 border-b border-border">
          <div className="text-3xl" aria-hidden="true">
            {node.type === 'intro' ? '📖' : node.type === 'practice' ? '✏️' : '🏆'}
          </div>
          <div className="flex-1">
            <h2 id="node-modal-title" className="text-xl font-bold text-text">
              {node.title}
            </h2>
            <p className="text-sm text-text-muted capitalize">
              {node.type === 'intro' ? 'Läsavsnitt' : node.type === 'practice' ? 'Övningar' : 'Delprov'}
              {progress?.completed && ' · ✓ Klart'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {node.audio_url && <TTSButton text={node.content_md} audioUrl={node.audio_url} />}
            <button
              onClick={onClose}
              aria-label="Stäng"
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isIntro && node.content_md ? (
            <div
              className="prose-mathu"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(node.content_md) }}
            />
          ) : isPractice ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4" aria-hidden="true">
                {node.type === 'test' ? '📝' : '💪'}
              </div>
              <p className="text-text-muted text-sm mb-6">
                {node.type === 'test'
                  ? 'Dags att testa dina kunskaper! Svara på frågorna och se hur du ligger till.'
                  : 'Träna på uppgifter för att befästa din kunskap.'}
              </p>
              {progress?.completed && (
                <div className="inline-flex items-center gap-2 bg-success-light text-success rounded-xl px-4 py-2 text-sm font-medium mb-4">
                  <span>✓</span>
                  <span>Poäng: {Math.round(progress.score ?? 0)}%</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-text-muted text-sm">Inget innehåll tillgängligt ännu.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border">
          {isPractice && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setShowQuestions(true)}
            >
              {progress?.completed ? 'Öva igen' : node.type === 'test' ? 'Starta delprov' : 'Börja övningar'}
            </Button>
          )}
          {isIntro && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleIntroComplete}
              disabled={completing}
            >
              {completing ? 'Sparar...' : progress?.completed ? 'Stäng' : 'Klar med läsningen ✓'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

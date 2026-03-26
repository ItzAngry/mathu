'use client'

import { useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import TTSButton from '@/components/ui/TTSButton'
import { AppContext } from '@/components/providers/AppProviders'
import { markdownToSpeechPlainText } from '@/lib/markdownPlainText'
import { renderIntroMarkdownToHtml } from '@/lib/renderIntroMarkdown'
import { updateNodeProgress } from '@/lib/actions/progress'
import 'katex/dist/katex.min.css'

export default function NodeModal({ node, progress, onClose }) {
  const overlayRef = useRef(null)
  const [showQuestions, setShowQuestions] = useState(false)
  const [completing, setCompleting] = useState(false)
  const router = useRouter()
  const app = useContext(AppContext)
  const ttsEnabled = app?.settings?.tts ?? false

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
  const introSpeechText = isIntro ? markdownToSpeechPlainText(node.content_md) : ''
  const hasIntroAudio = Boolean(node.audio_url)
  const showIntroListen = isIntro && (hasIntroAudio || (ttsEnabled && introSpeechText.length > 0))

  return (
    <div
      className={['fixed inset-0 z-50 flex items-center justify-center', isIntro ? 'p-2 sm:p-4 md:p-6' : 'p-4'].join(
        ' '
      )}
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
        className={[
          'relative bg-white rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col',
          isIntro ? 'max-w-7xl max-h-[96vh]' : 'max-w-xl max-h-[90vh]',
        ].join(' ')}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        <div
          className={[
            'flex items-start gap-3 border-b border-border',
            isIntro ? 'p-6 sm:p-8 pb-4 sm:pb-5' : 'p-6 pb-4',
          ].join(' ')}
        >
          <div className={isIntro ? 'text-4xl' : 'text-3xl'} aria-hidden="true">
            {node.type === 'intro' ? '📖' : node.type === 'practice' ? '✏️' : '🏆'}
          </div>
          <div className="flex-1">
            <h2
              id="node-modal-title"
              className={['font-bold text-text leading-tight', isIntro ? 'text-3xl sm:text-4xl' : 'text-2xl'].join(' ')}
            >
              {node.title}
            </h2>
            <p className={['text-text-muted capitalize', isIntro ? 'text-base mt-1' : 'text-sm'].join(' ')}>
              {node.type === 'intro' ? 'Läsavsnitt' : node.type === 'practice' ? 'Övningar' : 'Delprov'}
              {progress?.completed && ' · ✓ Klart'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {node.audio_url && !isIntro && (
              <TTSButton
                text={markdownToSpeechPlainText(node.content_md)}
                audioUrl={node.audio_url}
              />
            )}
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
        <div
          className={[
            'flex-1 overflow-y-auto min-h-0',
            isIntro ? 'px-5 sm:px-12 lg:px-16 py-7 sm:py-10' : 'px-6 py-6',
          ].join(' ')}
        >
          {isIntro && node.content_md ? (
            <>
              {showIntroListen && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 sm:p-6 rounded-2xl bg-primary-light border border-primary/25 mb-6 sm:mb-8">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-text">Lyssna på läsavsnittet</p>
                    <p className="text-sm text-text-muted mt-1 leading-relaxed">
                      {hasIntroAudio
                        ? 'Uppläsning från inspelad ljudfil.'
                        : 'Text läses upp med webbläsarens röst (Inställningar).'}
                    </p>
                  </div>
                  <TTSButton
                    text={introSpeechText}
                    audioUrl={node.audio_url}
                    label="Lyssna"
                  />
                </div>
              )}
              <div
                className="prose-mathu prose-mathu--reading"
                dangerouslySetInnerHTML={{ __html: renderIntroMarkdownToHtml(node.content_md) }}
              />
            </>
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
        <div className={['border-t border-border', isIntro ? 'p-6 sm:p-8 pt-4 sm:pt-5' : 'p-6 pt-4'].join(' ')}>
          {isPractice && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                router.push(`/plugga/node/${node.id}/questions`)
                onClose()
              }}
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

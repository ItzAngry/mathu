'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { updateNodeProgress } from '@/lib/actions/progress'
import AnswerChecker from './AnswerChecker'
import TTSButton from '@/components/ui/TTSButton'
import Button from '@/components/ui/Button'

export default function QuestionSession({
  node,
  onClose,
  /** 'modal' = overlay on plugga. 'page' = dedicated route, full view without dimmed backdrop. */
  variant = 'modal',
}) {
  const router = useRouter()
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    fetch(`/api/questions?nodeId=${node.id}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [node.id])

  function handleAnswer(correct) {
    const newResults = [...results, { questionId: questions[currentIdx]?.id, correct }]
    setResults(newResults)

    if (currentIdx + 1 >= questions.length) {
      const score = (newResults.filter((r) => r.correct).length / newResults.length) * 100
      updateNodeProgress({ nodeId: node.id, completed: true, score }).then(() => router.refresh())
      setFinished(true)
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }

  const score = results.length > 0
    ? Math.round((results.filter((r) => r.correct).length / results.length) * 100)
    : 0

  const activeQuestion =
    !finished && questions.length > 0 ? questions[currentIdx] : null

  const isPage = variant === 'page'

  if (loading) {
    return (
      <div
        className={
          isPage
            ? 'fixed inset-0 z-[100] flex items-center justify-center bg-surface'
            : 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
        }
      >
        <div className="bg-white rounded-2xl p-8 flex items-center gap-3 shadow-xl border border-border">
          <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-medium text-text">Laddar frågor...</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={
        isPage
          ? 'fixed inset-0 z-[100] flex flex-col bg-white'
          : 'fixed inset-0 z-50 flex flex-col bg-black/45 backdrop-blur-sm'
      }
    >
      <motion.div
        className={
          isPage
            ? 'flex flex-col flex-1 min-h-0 w-full max-w-[1600px] mx-auto overflow-hidden border-0 shadow-none'
            : 'flex flex-col flex-1 min-h-0 m-0 sm:m-3 md:m-4 bg-white sm:rounded-3xl shadow-2xl border border-border overflow-hidden max-w-[1600px] w-full mx-auto'
        }
        initial={{ opacity: 0, y: isPage ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isPage ? 0 : 12 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        role={isPage ? undefined : 'dialog'}
        aria-modal={isPage ? undefined : 'true'}
        aria-label={node.title}
      >
        <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0 bg-white">
          <div className="min-w-0">
            <h2 className="font-bold text-text text-base sm:text-lg truncate">{node.title}</h2>
            {!finished && questions.length > 0 && (
              <p className="text-xs text-text-muted">Fråga {currentIdx + 1} av {questions.length}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng"
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </header>

        {!finished && questions.length > 0 && (
          <div className="flex gap-1.5 px-4 sm:px-6 py-2.5 border-b border-border bg-surface-2/40 shrink-0" aria-hidden="true">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < results.length
                    ? results[i].correct
                      ? 'bg-success'
                      : 'bg-danger'
                    : i === currentIdx
                      ? 'bg-primary'
                      : 'bg-border'
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white">
          <AnimatePresence mode="wait">
            {finished ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center flex-1 overflow-y-auto"
              >
                <div className="text-6xl" role="img" aria-label={score >= 70 ? 'Bra jobbat' : 'Försök igen'}>
                  {score >= 90 ? '🏆' : score >= 70 ? '⭐' : score >= 50 ? '💪' : '📚'}
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{score}%</p>
                  <p className="text-text-muted text-sm mt-1">
                    {results.filter((r) => r.correct).length} av {results.length} rätt
                  </p>
                </div>
                <p className="text-text-muted text-sm max-w-md">
                  {score >= 80
                    ? 'Fantastiskt! Du behärskar detta avsnitt.'
                    : score >= 60
                      ? 'Bra jobbat! Fortsätt öva.'
                      : 'Öva mer på detta avsnitt och försök igen.'}
                </p>
                <Button variant="primary" size="lg" onClick={onClose}>
                  Tillbaka till kursen
                </Button>
              </motion.div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted flex-1">
                <p>Inga frågor tillgängliga ännu.</p>
                <Button variant="secondary" size="md" onClick={onClose} className="mt-4">
                  Stäng
                </Button>
              </div>
            ) : (
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col flex-1 min-h-0 overflow-hidden"
              >
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <AnswerChecker
                    key={activeQuestion.id}
                    layout="split"
                    question={activeQuestion}
                    onCorrect={() => handleAnswer(true)}
                    onWrong={() => handleAnswer(false)}
                    onSkip={() => handleAnswer(false)}
                    splitTopExtras={
                      activeQuestion.audio_url ? (
                        <TTSButton text={activeQuestion.text} audioUrl={activeQuestion.audio_url} />
                      ) : null
                    }
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

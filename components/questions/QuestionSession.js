'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { updateNodeProgress } from '@/lib/actions/progress'
import AnswerChecker from './AnswerChecker'
import TTSButton from '@/components/ui/TTSButton'
import Button from '@/components/ui/Button'

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

function sessionKey(nodeId) {
  return `mathu_session_${nodeId}`
}

function saveSession(nodeId, results) {
  try {
    localStorage.setItem(sessionKey(nodeId), JSON.stringify({ results, savedAt: Date.now() }))
  } catch {}
}

function clearSession(nodeId) {
  try {
    localStorage.removeItem(sessionKey(nodeId))
  } catch {}
}

function loadSession(nodeId) {
  try {
    const raw = localStorage.getItem(sessionKey(nodeId))
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (!saved || Date.now() - saved.savedAt > SESSION_TTL) return null
    if (!Array.isArray(saved.results) || saved.results.length === 0) return null
    return saved
  } catch {
    return null
  }
}

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
  // null = no saved session; object = { results, savedAt } waiting for user choice
  const [resumeData, setResumeData] = useState(null)

  useEffect(() => {
    fetch(`/api/questions?nodeId=${node.id}`)
      .then((r) => r.json())
      .then((data) => {
        const qs = data.questions ?? []
        setQuestions(qs)
        setLoading(false)
        // Check for a saved session once questions are loaded
        if (qs.length > 0) {
          const saved = loadSession(node.id)
          // Only show resume if the session is mid-way (not past the last question)
          if (saved && saved.results.length < qs.length) {
            setResumeData(saved)
          }
        }
      })
      .catch(() => setLoading(false))
  }, [node.id])

  function handleResume() {
    setResults(resumeData.results)
    setCurrentIdx(resumeData.results.length)
    setResumeData(null)
  }

  function handleRestart() {
    clearSession(node.id)
    setResumeData(null)
  }

  function handleAnswer(correct) {
    const q = questions[currentIdx]
    const newResults = [...results, { questionId: q?.id, correct, points: q?.points ?? 1 }]
    setResults(newResults)

    if (currentIdx + 1 >= questions.length) {
      // Done — clear saved session
      clearSession(node.id)
      const earnedPoints = newResults.filter((r) => r.correct).reduce((s, r) => s + r.points, 0)
      const totalPoints = newResults.reduce((s, r) => s + r.points, 0)
      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
      updateNodeProgress({ nodeId: node.id, completed: true, score }).then(() => router.refresh())
      setFinished(true)
    } else {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      // Persist progress after every answer
      saveSession(node.id, newResults)
    }
  }

  const earnedPoints = results.filter((r) => r.correct).reduce((s, r) => s + r.points, 0)
  const fullTotalPoints = questions.reduce((s, q) => s + (q.points ?? 1), 0)
  const score = fullTotalPoints > 0 ? Math.round((earnedPoints / fullTotalPoints) * 100) : 0

  const activeQuestion = !finished && questions.length > 0 ? questions[currentIdx] : null

  const isPage = variant === 'page'

  function mountOverlay(ui) {
    if (typeof document === 'undefined') return ui
    return createPortal(ui, document.body)
  }

  if (loading) {
    return mountOverlay(
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

  return mountOverlay(
    <div
      className={
        isPage
          ? 'fixed inset-0 z-[100] flex w-full min-w-0 flex-col bg-white'
          : 'fixed inset-0 z-50 flex w-full min-w-0 flex-col bg-black/45 backdrop-blur-sm'
      }
    >
      <motion.div
        className={
          isPage
            ? 'flex flex-col flex-1 min-h-0 w-full max-w-[1600px] mx-auto overflow-hidden border-0 shadow-none'
            : 'flex flex-col flex-1 min-h-0 w-full min-w-0 m-0 max-w-none bg-white overflow-hidden rounded-none border-0 shadow-none'
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
            {!finished && !resumeData && questions.length > 0 && (
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

        {!finished && !resumeData && questions.length > 0 && (
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

            {/* ── Resume prompt ─────────────────────────────────── */}
            {resumeData ? (
              <motion.div
                key="resume"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex flex-col items-center justify-center gap-6 py-16 px-6 text-center flex-1"
              >
                <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-primary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-bold text-text">Fortsätt där du slutade</p>
                  <p className="text-text-muted text-sm mt-1.5 max-w-xs">
                    Du har svarat på {resumeData.results.length} av {questions.length} frågor. Vill du fortsätta eller börja om?
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <Button variant="primary" size="lg" fullWidth onClick={handleResume}>
                    Fortsätt
                  </Button>
                  <Button variant="secondary" size="lg" fullWidth onClick={handleRestart}>
                    Börja om
                  </Button>
                </div>
              </motion.div>

            ) : finished ? (
              /* ── Results screen ───────────────────────────────── */
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center flex-1 overflow-y-auto"
              >
                <div
                  className={[
                    'w-20 h-20 rounded-full flex items-center justify-center',
                    score >= 80 ? 'bg-success/15' : score >= 50 ? 'bg-primary-light' : 'bg-surface-2',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {score >= 80 ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-success">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  ) : score >= 50 ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-primary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-text-muted">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-3xl font-bold text-text tabular-nums">
                    {earnedPoints} <span className="text-text-muted font-normal text-xl">/ {fullTotalPoints} poäng</span>
                  </p>
                  <p className="text-text-muted text-sm mt-1.5">
                    {results.filter((r) => r.correct).length} av {results.length} rätt · {score}%
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
                  Tillbaka
                </Button>
              </motion.div>

            ) : questions.length === 0 ? (
              /* ── No questions ─────────────────────────────────── */
              <div className="flex flex-col items-center justify-center py-12 text-text-muted flex-1">
                <p>Inga frågor tillgängliga ännu.</p>
                <Button variant="secondary" size="md" onClick={onClose} className="mt-4">
                  Stäng
                </Button>
              </div>

            ) : (
              /* ── Active question ──────────────────────────────── */
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

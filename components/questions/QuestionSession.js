'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { updateNodeProgress } from '@/lib/actions/progress'
import AnswerChecker from './AnswerChecker'
import GeoGebraEmbed from './GeoGebraEmbed'
import TTSButton from '@/components/ui/TTSButton'
import Button from '@/components/ui/Button'

export default function QuestionSession({ node, onClose }) {
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
      updateNodeProgress({ nodeId: node.id, completed: true, score })
      setFinished(true)
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }

  const score = results.length > 0
    ? Math.round((results.filter((r) => r.correct).length / results.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-3xl p-8 flex items-center gap-3">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        role="dialog"
        aria-modal="true"
        aria-label={node.title}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-text">{node.title}</h2>
            {!finished && (
              <p className="text-xs text-text-muted">
                Fråga {currentIdx + 1} av {questions.length}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Stäng"
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Progress dots */}
        {!finished && questions.length > 0 && (
          <div className="flex gap-1.5 px-6 py-3" aria-hidden="true">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < results.length
                    ? results[i].correct ? 'bg-success' : 'bg-danger'
                    : i === currentIdx ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            {finished ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 py-8 text-center"
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
                <p className="text-text-muted text-sm">
                  {score >= 80 ? 'Fantastiskt! Du behärskar detta avsnitt.' : score >= 60 ? 'Bra jobbat! Fortsätt öva.' : 'Öva mer på detta avsnitt och försök igen.'}
                </p>
                <Button variant="primary" size="lg" onClick={onClose}>
                  Tillbaka till kursen
                </Button>
              </motion.div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <p>Inga frågor tillgängliga ännu.</p>
                <Button variant="secondary" size="md" onClick={onClose} className="mt-4">
                  Stäng
                </Button>
              </div>
            ) : (
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                {/* GeoGebra embed if needed */}
                {questions[currentIdx]?.has_geogebra && questions[currentIdx]?.geogebra_id && (
                  <GeoGebraEmbed materialId={questions[currentIdx].geogebra_id} />
                )}

                {/* TTS for question */}
                {questions[currentIdx]?.audio_url && (
                  <div className="mb-3">
                    <TTSButton text={questions[currentIdx].text} audioUrl={questions[currentIdx].audio_url} />
                  </div>
                )}

                <AnswerChecker
                  question={questions[currentIdx]}
                  onCorrect={() => handleAnswer(true)}
                  onWrong={() => handleAnswer(false)}
                  onSkip={() => handleAnswer(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

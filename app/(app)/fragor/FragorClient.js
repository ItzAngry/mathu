'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AnswerChecker from '@/components/questions/AnswerChecker'
import Button from '@/components/ui/Button'

export default function FragorClient({ chapters, gradeGoal }) {
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)

  async function startPractice(chapterId) {
    setLoading(true)
    setSelectedChapter(chapterId)
    setResults([])
    setCurrentIdx(0)
    setSessionDone(false)

    const res = await fetch(`/api/questions?chapterId=${chapterId}&gradeLevel=${gradeGoal}`)
    const data = await res.json()
    setQuestions(data.questions ?? [])
    setLoading(false)
  }

  function handleAnswer(correct) {
    const newResults = [...results, { questionId: questions[currentIdx]?.id, correct }]
    setResults(newResults)
    if (currentIdx + 1 >= questions.length) {
      setSessionDone(true)
    } else {
      setCurrentIdx((i) => i + 1)
    }
  }

  const score = results.length > 0
    ? Math.round((results.filter((r) => r.correct).length / results.length) * 100)
    : 0

  if (selectedChapter && !loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="bg-white border-b border-border px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => setSelectedChapter(null)}
            className="text-text-muted hover:text-text transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded"
            aria-label="Tillbaka till kapitelval"
          >
            ← Tillbaka
          </button>
          {!sessionDone && (
            <span className="text-sm text-text-muted">
              Fråga {currentIdx + 1} av {questions.length}
            </span>
          )}
        </div>

        <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8">
          <AnimatePresence mode="wait">
            {sessionDone ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 text-center py-12"
              >
                <div className="text-6xl">{score >= 80 ? '🏆' : score >= 60 ? '⭐' : '💪'}</div>
                <div>
                  <p className="text-3xl font-bold text-text">{score}%</p>
                  <p className="text-text-muted mt-1">
                    {results.filter((r) => r.correct).length} av {results.length} rätt
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="primary" size="lg" onClick={() => startPractice(selectedChapter)}>
                    Öva igen
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => setSelectedChapter(null)}>
                    Byt kapitel
                  </Button>
                </div>
              </motion.div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <div className="text-5xl mb-4">📚</div>
                <p>Inga frågor tillgängliga för detta kapitel.</p>
              </div>
            ) : (
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                {/* Progress */}
                <div className="flex gap-1 mb-6" aria-hidden="true">
                  {questions.map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i < results.length ? (results[i].correct ? 'bg-success' : 'bg-danger') : i === currentIdx ? 'bg-primary' : 'bg-border'}`} />
                  ))}
                </div>
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

      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-border px-6 py-5">
        <h1 className="text-2xl font-bold text-text">Frågor</h1>
        <p className="text-text-muted text-sm mt-0.5">Välj ett kapitel att öva på</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {chapters.map((chapter, i) => (
              <motion.button
                key={chapter.id}
                onClick={() => startPractice(chapter.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={`Öva på ${chapter.title}`}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: chapter.color + '22' }}
                  aria-hidden="true"
                >
                  {chapter.icon}
                </div>
                <div>
                  <p className="font-semibold text-text">{chapter.title}</p>
                  <p className="text-xs text-text-muted mt-0.5">Kapitel {chapter.order_index}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

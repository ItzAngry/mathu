'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AnswerChecker from '@/components/questions/AnswerChecker'
import Button from '@/components/ui/Button'
import ChapterIcon from '@/components/ui/ChapterIcon'

// Result score SVGs
function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-warning" aria-hidden="true">
      <polyline points="8 21 12 17 16 21" />
      <line x1="12" y1="17" x2="12" y2="12" />
      <path d="M7 4H4a2 2 0 0 0-2 2v3a4 4 0 0 0 4 4h1" />
      <path d="M17 4h3a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4h-1" />
      <rect x="7" y="2" width="10" height="10" rx="2" />
    </svg>
  )
}

function ThumbsUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-success" aria-hidden="true">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-text-muted" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-14 h-14 text-text-muted/50" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

const GRADE_OPTIONS = [
  { value: 'E', label: 'E' },
  { value: 'C', label: 'C' },
  { value: 'A', label: 'A' },
  { value: 'mixed', label: 'Blandad' },
]

export default function FragorClient({ chapters, gradeGoal }) {
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [gradeFilter, setGradeFilter] = useState(gradeGoal)
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

    const url = gradeFilter === 'mixed'
      ? `/api/questions?chapterId=${chapterId}&mode=mixed`
      : `/api/questions?chapterId=${chapterId}&gradeLevel=${gradeFilter}`

    const res = await fetch(url)
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
            className="flex items-center gap-1.5 text-text-muted hover:text-text transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded"
            aria-label="Tillbaka till kapitelval"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Tillbaka
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
                {score >= 80 ? <TrophyIcon /> : score >= 60 ? <ThumbsUpIcon /> : <TargetIcon />}
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
              <div className="text-center py-12 text-text-muted flex flex-col items-center gap-4">
                <EmptyIcon />
                <p>Inga frågor tillgängliga för detta kapitel och betygsnivå.</p>
              </div>
            ) : (
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
              >
                {/* Progress bar */}
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

      {/* Grade selector */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-text-muted shrink-0">Nivå:</span>
        <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Välj betygsnivå">
          {GRADE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={gradeFilter === opt.value}
              onClick={() => setGradeFilter(opt.value)}
              className={[
                'px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-primary',
                gradeFilter === opt.value
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-text-muted hover:border-primary/40 hover:text-text',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: chapter.color + '22', color: chapter.color }}
                  aria-hidden="true"
                >
                  <ChapterIcon chapter={chapter} style={{ width: '55%', height: '55%' }} />
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

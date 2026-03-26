'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CanvasInput from './CanvasInput'
import Button from '@/components/ui/Button'

const STAGES = {
  idle: 'idle',
  checking_ai: 'checking_ai',
  correct: 'correct',
  wrong: 'wrong',
}

export default function AnswerChecker({ question, onCorrect, onWrong, onSkip }) {
  const [stage, setStage] = useState(STAGES.idle)
  const [textAnswer, setTextAnswer] = useState('')
  const [showCanvas, setShowCanvas] = useState(false)
  const [canvasHasContent, setCanvasHasContent] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [visionDetail, setVisionDetail] = useState(null) // extra vision fields
  const [attempts, setAttempts] = useState(0)
  const canvasRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!textAnswer.trim() && !canvasHasContent) return
    setAttempts((a) => a + 1)
    setStage(STAGES.checking_ai)

    try {
      let result

      if (canvasHasContent && canvasRef.current) {
        // ── Canvas was used → send to VISION model ────────────────────
        // (different IP, different model — can analyse pictures)
        const imageBase64 = canvasRef.current.getImageBase64()
        result = await fetch('/api/ai/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question.text,
            userAnswer: textAnswer,
            correctAnswer: question.correct_answer,
            imageBase64,
          }),
        }).then((r) => r.json())
      } else {
        // ── Text only → send to MATHEW model ──────────────────────────
        // (different IP, text-only model)
        result = await fetch('/api/ai/mathew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question.text,
            userAnswer: textAnswer,
            correctAnswer: question.correct_answer,
          }),
        }).then((r) => r.json())
      }

      // Mathew uses reasoning_content { CorrectAnswer: True/False }
      // Vision uses JSON { is_correct, method_correct, final_answer_correct, completeness, feedback }
      setExplanation(result.explanation || '')

      // Store extra vision detail if available
      if (result.completeness !== undefined) {
        setVisionDetail({
          methodCorrect: result.methodCorrect,
          finalAnswerCorrect: result.finalAnswerCorrect,
          completeness: result.completeness,
        })
      } else {
        setVisionDetail(null)
      }

      if (result.correct) {
        setStage(STAGES.correct)
      } else {
        setStage(STAGES.wrong)
      }
    } catch (err) {
      console.error('AI check error:', err)
      setExplanation('Kunde inte nå AI-modellen. Kontrollera att den är igång.')
      setStage(STAGES.wrong)
    }
  }

  function handleTryAgain() {
    setStage(STAGES.idle)
    setTextAnswer('')
    setExplanation('')
    setVisionDetail(null)
    canvasRef.current?.clear()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Question text */}
      <div className="bg-primary-light rounded-2xl p-4">
        <p className="text-text font-medium text-base leading-relaxed">{question.text}</p>
      </div>

      {/* Result states */}
      <AnimatePresence mode="wait">
        {stage === STAGES.correct && (
          <motion.div
            key="correct"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-6 bg-success-light rounded-2xl"
            role="status"
          >
            <div className="text-5xl">🎉</div>
            <p className="text-success font-bold text-lg">Rätt svar!</p>
            {explanation && (
              <p className="text-sm text-text-muted px-4 text-center leading-relaxed">
                {explanation}
              </p>
            )}
            {visionDetail && (
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  Metod: ✓
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  Slutsvar: ✓
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {visionDetail.completeness === 'complete' ? 'Komplett' : visionDetail.completeness === 'partially_complete' ? 'Delvis komplett' : 'Ofullständig'}
                </span>
              </div>
            )}
            <Button variant="primary" size="md" onClick={onCorrect}>
              Nästa fråga →
            </Button>
          </motion.div>
        )}

        {stage === STAGES.wrong && (
          <motion.div
            key="wrong"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3 py-4 px-4 bg-red-50 rounded-2xl border border-red-200"
            role="alert"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">😔</span>
              <p className="text-danger font-semibold">Fel svar</p>
            </div>
            {explanation && (
              <p className="text-sm text-text-muted leading-relaxed">{explanation}</p>
            )}
            {visionDetail && (
              <div className="flex flex-wrap gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${visionDetail.methodCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Metod: {visionDetail.methodCorrect ? '✓' : '✗'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${visionDetail.finalAnswerCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Slutsvar: {visionDetail.finalAnswerCorrect ? '✓' : '✗'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {visionDetail.completeness === 'complete' ? 'Komplett' : visionDetail.completeness === 'partially_complete' ? 'Delvis' : 'Ofullständig'}
                </span>
              </div>
            )}
            <p className="text-sm text-text-muted">
              Rätt svar: <span className="font-semibold text-text">{question.correct_answer}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleTryAgain}>
                Försök igen
              </Button>
              <Button variant="ghost" size="sm" onClick={onWrong}>
                Nästa fråga
              </Button>
            </div>
          </motion.div>
        )}

        {stage === STAGES.checking_ai && (
          <motion.div
            key="checking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 py-4 px-4 bg-primary-light rounded-2xl"
            role="status"
            aria-live="polite"
          >
            <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-primary font-medium text-sm">
              {canvasHasContent
                ? 'Analyserar din lösning med Vision-AI...'
                : 'Mathew kontrollerar ditt svar...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer input (idle stage) */}
      {stage === STAGES.idle && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label htmlFor="text-answer" className="block text-sm font-medium text-text mb-1.5">
              Ditt svar
            </label>
            <input
              id="text-answer"
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Skriv ditt svar här..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              autoComplete="off"
              aria-label="Ditt svar"
            />
          </div>

          {/* Canvas toggle */}
          <button
            type="button"
            onClick={() => setShowCanvas((v) => !v)}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium transition-colors w-fit"
            aria-expanded={showCanvas}
          >
            <span aria-hidden="true">{showCanvas ? '▼' : '▶'}</span>
            {showCanvas ? 'Dölj rityta' : '✏️ Rita din lösning'}
          </button>

          <AnimatePresence>
            {showCanvas && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <CanvasInput
                  ref={canvasRef}
                  onHasContent={setCanvasHasContent}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!textAnswer.trim() && !canvasHasContent}
              className="flex-1"
            >
              Skicka svar
            </Button>
            {onSkip && (
              <Button type="button" variant="ghost" size="md" onClick={onSkip}>
                Hoppa över
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

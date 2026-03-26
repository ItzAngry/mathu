'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CanvasInput from './CanvasInput'
import GeoGebraEmbed from './GeoGebraEmbed'
import QuestionCalculator from './QuestionCalculator'
import Button from '@/components/ui/Button'

const STAGES = {
  idle: 'idle',
  checking_ai: 'checking_ai',
  correct: 'correct',
  wrong: 'wrong',
}

export default function AnswerChecker({
  question,
  onCorrect,
  onWrong,
  onSkip,
  /** 'stack' = canvas under text (legacy). 'split' = fråga vänster, rityta höger. */
  layout = 'stack',
  /** Rendered above the question box in the left column when layout is split (e.g. GeoGebra, TTS). */
  splitTopExtras = null,
}) {
  const [stage, setStage] = useState(STAGES.idle)
  const [textAnswer, setTextAnswer] = useState('')
  const [showCanvas, setShowCanvas] = useState(false)
  const [canvasPanelOpen, setCanvasPanelOpen] = useState(() => Boolean(question.requires_canvas))
  const [canvasHasContent, setCanvasHasContent] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [visionDetail, setVisionDetail] = useState(null) // extra vision fields
  const [attempts, setAttempts] = useState(0)
  /** Högerpanel (split): 'canvas' | 'geogebra' */
  const [rightTab, setRightTab] = useState('canvas')
  /** Stack-läge (t.ex. Frågor): samma flikar */
  const [stackTab, setStackTab] = useState('canvas')
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

  const isSplit = layout === 'split'
  const showRightPanel = isSplit && stage === STAGES.idle
  const showCalculator = Boolean(question.allows_calculator)
  /** Tom inbäddad GeoGebra-grafritare när frågan är markerad i admin (flik bredvid ritytan). */
  const showGeoGebra = Boolean(question.has_geogebra)

  /** Med GeoGebra: 50/50 när fliken Rityta + stängd canvas; 1/3–2/3 när GeoGebra-fliken eller öppen canvas. Utan GeoGebra: 1/3–2/3 bara när ritytan är öppen. */
  const splitWideTools =
    showRightPanel &&
    (showGeoGebra
      ? rightTab === 'geogebra' || (rightTab === 'canvas' && canvasPanelOpen)
      : canvasPanelOpen)

  const questionBlock = (
    <div className="bg-primary-light rounded-2xl p-4 shrink-0">
      <p className="text-text font-medium text-base leading-relaxed">{question.text}</p>
    </div>
  )

  const statusAlerts = (
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
            <p className="text-sm text-text-muted px-4 text-center leading-relaxed">{explanation}</p>
          )}
          {visionDetail && (
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Metod: ✓</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Slutsvar: ✓</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {visionDetail.completeness === 'complete'
                  ? 'Komplett'
                  : visionDetail.completeness === 'partially_complete'
                    ? 'Delvis komplett'
                    : 'Ofullständig'}
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
          {explanation && <p className="text-sm text-text-muted leading-relaxed">{explanation}</p>}
          {visionDetail && (
            <div className="flex flex-wrap gap-2 mt-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${visionDetail.methodCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              >
                Metod: {visionDetail.methodCorrect ? '✓' : '✗'}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${visionDetail.finalAnswerCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              >
                Slutsvar: {visionDetail.finalAnswerCorrect ? '✓' : '✗'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {visionDetail.completeness === 'complete'
                  ? 'Komplett'
                  : visionDetail.completeness === 'partially_complete'
                    ? 'Delvis'
                    : 'Ofullständig'}
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
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-primary font-medium text-sm">
            {canvasHasContent
              ? 'Analyserar din lösning med Vision-AI...'
              : 'Mathew kontrollerar ditt svar...'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const submitRow = (
    <div className="flex flex-col sm:flex-row gap-2">
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
  )

  const textField = (
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
        className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        autoComplete="off"
        aria-label="Ditt svar"
      />
    </div>
  )

  if (isSplit) {
    return (
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full">
        <div
          className={[
            'flex flex-col gap-4 min-w-0 min-h-0 overflow-y-auto p-4 sm:p-5 lg:p-6 transition-[flex-basis] duration-200 ease-out',
            showRightPanel
              ? [
                  'flex-1 basis-0 min-h-[min(50dvh,420px)] lg:min-h-0 lg:flex-none border-border lg:border-r',
                  splitWideTools
                    ? 'lg:w-1/3 lg:max-w-[33.333%] lg:basis-1/3'
                    : 'lg:w-1/2 lg:max-w-[50%] lg:basis-1/2',
                ].join(' ')
              : 'flex-1 max-w-2xl mx-auto w-full',
          ].join(' ')}
        >
          {splitTopExtras ? <div className="space-y-3 shrink-0">{splitTopExtras}</div> : null}
          {questionBlock}
          {statusAlerts}
          {stage === STAGES.idle && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {textField}
              {showCalculator ? (
                <QuestionCalculator key={question.id} />
              ) : null}
              {submitRow}
            </form>
          )}
        </div>

        {showRightPanel && (
          <aside
            className={[
              'flex flex-col w-full flex-1 basis-0 min-h-[min(52dvh,480px)] lg:min-h-[min(52dvh,520px)] lg:flex-none shrink-0 bg-surface-2/60 border-t lg:border-t-0 lg:border-l border-border transition-[flex-basis] duration-200 ease-out',
              splitWideTools ? 'lg:w-2/3 lg:max-w-[66.667%] lg:basis-2/3' : 'lg:w-1/2 lg:max-w-[50%] lg:basis-1/2',
            ].join(' ')}
          >
            {showGeoGebra ? (
              <div className="flex flex-col flex-1 min-h-0">
                <div
                  role="tablist"
                  aria-label="Verktyg bredvid uppgiften"
                  className="flex shrink-0 border-b border-border bg-white/80 px-2 pt-2 gap-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={rightTab === 'canvas'}
                    id="tab-canvas"
                    aria-controls="panel-canvas"
                    onClick={() => setRightTab('canvas')}
                    className={[
                      'px-4 py-2.5 text-sm font-semibold rounded-t-xl border border-b-0 transition-colors',
                      rightTab === 'canvas'
                        ? 'bg-white text-text border-border -mb-px z-10'
                        : 'bg-transparent text-text-muted border-transparent hover:text-text',
                    ].join(' ')}
                  >
                    Rityta
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={rightTab === 'geogebra'}
                    id="tab-geogebra"
                    aria-controls="panel-geogebra"
                    onClick={() => setRightTab('geogebra')}
                    className={[
                      'px-4 py-2.5 text-sm font-semibold rounded-t-xl border border-b-0 transition-colors',
                      rightTab === 'geogebra'
                        ? 'bg-white text-text border-border -mb-px z-10'
                        : 'bg-transparent text-text-muted border-transparent hover:text-text',
                    ].join(' ')}
                  >
                    GeoGebra
                  </button>
                </div>

                <div className="question-workspace-resize flex flex-col bg-white border-x border-b border-border rounded-b-2xl rounded-tr-2xl min-w-0">
                  <div className="flex-1 min-h-0 min-w-0 flex flex-col">
                  {rightTab === 'canvas' ? (
                    <div
                      id="panel-canvas"
                      role="tabpanel"
                      aria-labelledby="tab-canvas"
                      className="flex flex-col flex-1 min-h-0 h-full"
                    >
                      {!canvasPanelOpen ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center min-h-[min(40dvh,320px)]">
                          <p className="text-sm text-text-muted max-w-xs">
                            Skissa eller skriv uträkning för hand här. Byt till fliken GeoGebra för grafritare.
                          </p>
                          <Button type="button" variant="secondary" size="md" onClick={() => setCanvasPanelOpen(true)}>
                            Öppna rityta
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col flex-1 min-h-0 h-full p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                            <h3 className="text-sm font-semibold text-text">Din rityta</h3>
                            <button
                              type="button"
                              onClick={() => {
                                setCanvasPanelOpen(false)
                                setCanvasHasContent(false)
                                canvasRef.current?.clear()
                              }}
                              className="text-xs font-medium text-primary hover:text-primary-dark"
                            >
                              Stäng rityta
                            </button>
                          </div>
                          <p className="text-[11px] text-text-muted mb-2 shrink-0">
                            Dra i nedre högra hörnet på ramen runt ritytan och GeoGebra för att ändra höjd.
                          </p>
                          <div className="flex-1 min-h-[280px] overflow-auto">
                            <CanvasInput ref={canvasRef} width={800} height={480} onHasContent={setCanvasHasContent} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      id="panel-geogebra"
                      role="tabpanel"
                      aria-labelledby="tab-geogebra"
                      className="flex flex-col flex-1 min-h-0 h-full min-w-0 p-2 sm:p-3"
                    >
                      <GeoGebraEmbed key={`${question.id}-geogebra`} className="flex-1 min-h-0" />
                    </div>
                  )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="question-workspace-resize flex flex-col min-w-0">
                {!canvasPanelOpen ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center min-h-[min(40dvh,280px)]">
                    <p className="text-sm text-text-muted max-w-xs">
                      Vill du skissa eller visa uträkning för hand? Öppna ritytan till höger (på mobil under frågan).
                    </p>
                    <Button type="button" variant="secondary" size="md" onClick={() => setCanvasPanelOpen(true)}>
                      Öppna rityta
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0 h-full p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                      <h3 className="text-sm font-semibold text-text">Din rityta</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setCanvasPanelOpen(false)
                          setCanvasHasContent(false)
                          canvasRef.current?.clear()
                        }}
                        className="text-xs font-medium text-primary hover:text-primary-dark"
                      >
                        Stäng rityta
                      </button>
                    </div>
                    <p className="text-[11px] text-text-muted mb-2 shrink-0">
                      Dra i nedre högra hörnet för att ändra höjd.
                    </p>
                    <div className="flex-1 min-h-[280px] overflow-auto">
                      <CanvasInput ref={canvasRef} width={800} height={480} onHasContent={setCanvasHasContent} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {questionBlock}
      {statusAlerts}
      {stage === STAGES.idle && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {textField}
          {showCalculator ? <QuestionCalculator key={question.id} /> : null}
          {showGeoGebra ? (
            <div className="rounded-2xl border border-border bg-surface-2/40 overflow-hidden">
              <div
                role="tablist"
                aria-label="Rityta och GeoGebra"
                className="flex border-b border-border bg-white/90 px-2 pt-2 gap-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={stackTab === 'canvas'}
                  onClick={() => setStackTab('canvas')}
                  className={[
                    'px-4 py-2 text-sm font-semibold rounded-t-lg border border-b-0 transition-colors',
                    stackTab === 'canvas'
                      ? 'bg-white text-text border-border -mb-px z-10'
                      : 'text-text-muted border-transparent hover:text-text',
                  ].join(' ')}
                >
                  Rityta
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={stackTab === 'geogebra'}
                  onClick={() => setStackTab('geogebra')}
                  className={[
                    'px-4 py-2 text-sm font-semibold rounded-t-lg border border-b-0 transition-colors',
                    stackTab === 'geogebra'
                      ? 'bg-white text-text border-border -mb-px z-10'
                      : 'text-text-muted border-transparent hover:text-text',
                  ].join(' ')}
                >
                  GeoGebra
                </button>
              </div>
              <div className="question-workspace-resize flex flex-col bg-white rounded-b-xl min-w-0">
                {stackTab === 'canvas' ? (
                  <div className="flex flex-col gap-2 p-3 sm:p-4 min-h-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setShowCanvas((v) => !v)}
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium transition-colors w-fit"
                      aria-expanded={showCanvas}
                    >
                      <span aria-hidden="true">{showCanvas ? '▼' : '▶'}</span>
                      {showCanvas ? 'Dölj rityta' : '✏️ Visa rityta'}
                    </button>
                    <p className="text-[11px] text-text-muted">Dra i nedre högra hörnet för att ändra höjd.</p>
                    <AnimatePresence>
                      {showCanvas && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden flex-1 min-h-[280px]"
                        >
                          <CanvasInput ref={canvasRef} width={760} height={440} onHasContent={setCanvasHasContent} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0 h-full p-2 sm:p-3">
                    <GeoGebraEmbed key={`${question.id}-geogebra-stack`} className="flex-1 min-h-0" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
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
                    <CanvasInput ref={canvasRef} onHasContent={setCanvasHasContent} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
          {submitRow}
        </form>
      )}
    </div>
  )
}

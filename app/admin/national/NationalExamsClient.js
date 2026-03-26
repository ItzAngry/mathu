'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import { upsertNode, deleteNode, upsertQuestion, deleteQuestion } from '@/lib/actions/admin'

// ─── Icons ───────────────────────────────────────────────────────────────────

function PlusIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADE_COLORS = {
  E: 'bg-green-100 text-green-700',
  C: 'bg-blue-100 text-blue-700',
  A: 'bg-amber-100 text-amber-700',
}

const EMPTY_EXAM = {
  id: null,
  title: '',
  title_en: '',
  exam_year: new Date().getFullYear(),
  is_published: true,
  chapter_id: '',
  type: 'test',
  size: 'large',
  order_index: 0,
  is_national_exam: true,
}

const EMPTY_QUESTION = {
  id: null,
  text: '',
  correct_answer: '',
  answer_aliases: '',
  grade_level: 'C',
  has_geogebra: false,
  requires_canvas: false,
  allows_calculator: false,
  order_index: 0,
}

// ─── Exam Modal ───────────────────────────────────────────────────────────────

function ExamModal({ exam, chapters, onClose }) {
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.target)
    // Force national exam flags
    formData.set('is_national_exam', 'on')
    formData.set('type', 'test')
    const result = await upsertNode(formData)
    if (!result.error) {
      window.location.reload()
    } else {
      alert('Fel: ' + result.error)
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-text">{exam.id ? 'Redigera prov' : 'Nytt nationellt prov'}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1 rounded-lg" aria-label="Stäng">
            <CloseIcon />
          </button>
        </div>

        <form key={exam.id ?? 'new-exam'} onSubmit={handleSave} className="p-6 space-y-4">
          {exam.id && <input type="hidden" name="id" value={exam.id} />}
          <input type="hidden" name="type" value="test" />
          <input type="hidden" name="is_national_exam" value="on" />
          <input type="hidden" name="size" value="large" />

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Titel <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="title"
              defaultValue={exam.title}
              required
              placeholder="t.ex. Ma1b – Del A"
              className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                År <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="exam_year"
                defaultValue={exam.exam_year ?? new Date().getFullYear()}
                required
                min={2000}
                max={2100}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Kapitel</label>
              <select
                name="chapter_id"
                defaultValue={exam.chapter_id ?? ''}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Inget</option>
                {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Ordning</label>
              <input
                type="number"
                name="order_index"
                defaultValue={exam.order_index ?? 0}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" name="is_published" defaultChecked={exam.is_published} className="accent-primary w-4 h-4" />
                Publicerat
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" size="md" loading={saving} fullWidth>
              {saving ? 'Sparar...' : exam.id ? 'Uppdatera prov' : 'Skapa prov'}
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={onClose}>Avbryt</Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Question Modal ───────────────────────────────────────────────────────────

function QuestionModal({ question, nodeId, onClose }) {
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.target)
    const result = await upsertQuestion(formData)
    if (!result.error) {
      window.location.reload()
    } else {
      alert('Fel: ' + result.error)
      setSaving(false)
    }
  }

  const q = question ?? { ...EMPTY_QUESTION }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="font-bold text-text">{q.id ? 'Redigera fråga' : 'Ny fråga'}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1 rounded-lg" aria-label="Stäng">
            <CloseIcon />
          </button>
        </div>

        <form key={q.id ?? 'new-q'} onSubmit={handleSave} className="p-6 space-y-4">
          {q.id && <input type="hidden" name="id" value={q.id} />}
          <input type="hidden" name="node_id" value={nodeId} />

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Frågetext <span className="text-danger">*</span>
            </label>
            <textarea
              name="text"
              defaultValue={q.text}
              required
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Skriv uppgiften här..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Rätt svar <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="correct_answer"
                defaultValue={q.correct_answer}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Betygsnivå</label>
              <select
                name="grade_level"
                defaultValue={q.grade_level}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {['E', 'C', 'A'].map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Alternativa svar <span className="text-text-muted font-normal">(kommaseparerat)</span>
            </label>
            <input
              type="text"
              name="answer_aliases"
              defaultValue={(q.answer_aliases ?? []).join ? (q.answer_aliases ?? []).join(', ') : q.answer_aliases ?? ''}
              placeholder="t.ex. 8, 2³, 2^3"
              className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Ordning</label>
            <input
              type="number"
              name="order_index"
              defaultValue={q.order_index ?? 0}
              className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-border hover:bg-surface transition-colors">
            <input
              type="checkbox"
              name="digital_tools"
              defaultChecked={Boolean(q.has_geogebra || q.requires_canvas || q.allows_calculator)}
              className="accent-primary w-4 h-4 shrink-0"
            />
            <div>
              <span className="text-sm font-medium text-text">Digitala verktyg</span>
              <span className="block text-xs text-text-muted">Aktiverar miniräknare, GeoGebra och rityta</span>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" size="md" loading={saving} fullWidth>
              {saving ? 'Sparar...' : 'Spara fråga'}
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={onClose}>Avbryt</Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Exam Card ────────────────────────────────────────────────────────────────

function ExamCard({ exam, questions, chapters, onEditExam }) {
  const [open, setOpen] = useState(false)
  const [addingQuestion, setAddingQuestion] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [localQuestions, setLocalQuestions] = useState(questions)

  const questionCount = localQuestions.length

  async function handleDeleteQuestion(id) {
    if (!confirm('Ta bort denna fråga?')) return
    const result = await deleteQuestion(id)
    if (!result.error) {
      setLocalQuestions((prev) => prev.filter((q) => q.id !== id))
    } else {
      alert('Fel: ' + result.error)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Exam header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-text">{exam.title}</h3>
            {exam.exam_year && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-light text-primary">
                {exam.exam_year}
              </span>
            )}
            {!exam.is_published && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-text-muted">Utkast</span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {questionCount} {questionCount === 1 ? 'fråga' : 'frågor'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onEditExam(exam)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-primary hover:bg-primary-light transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            aria-label={`Redigera: ${exam.title}`}
          >
            <EditIcon />
            Redigera
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-text-muted hover:bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            aria-expanded={open}
            aria-label={open ? 'Dölj frågor' : 'Visa frågor'}
          >
            <ChevronIcon open={open} />
            {open ? 'Dölj' : 'Frågor'}
          </button>
        </div>
      </div>

      {/* Questions panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {localQuestions.length === 0 ? (
                <p className="px-5 py-6 text-sm text-text-muted text-center">
                  Inga frågor ännu. Lägg till den första frågan nedan.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">#</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">Fråga</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">Svar</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wide">Betyg</th>
                      <th className="px-4 py-2.5 w-24" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {localQuestions
                      .slice()
                      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                      .map((q, i) => (
                        <tr key={q.id} className="hover:bg-surface transition-colors group">
                          <td className="px-5 py-3 text-text-muted tabular-nums text-xs">{i + 1}</td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="truncate text-text" title={q.text}>{q.text}</p>
                          </td>
                          <td className="px-4 py-3 text-text-muted text-xs max-w-[120px]">
                            <p className="truncate">{q.correct_answer}</p>
                          </td>
                          <td className="px-4 py-3">
                            {q.grade_level ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${GRADE_COLORS[q.grade_level] ?? 'bg-surface-2 text-text-muted'}`}>
                                {q.grade_level}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingQuestion(q)}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary-light transition-colors"
                                aria-label={`Redigera fråga: ${q.text}`}
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                                aria-label={`Ta bort fråga: ${q.text}`}
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              <div className="px-5 py-3 border-t border-border">
                <button
                  onClick={() => setAddingQuestion(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-primary hover:bg-primary-light transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Lägg till fråga
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question modals */}
      <AnimatePresence>
        {addingQuestion && (
          <QuestionModal
            question={null}
            nodeId={exam.id}
            onClose={() => setAddingQuestion(false)}
          />
        )}
        {editingQuestion && (
          <QuestionModal
            question={editingQuestion}
            nodeId={exam.id}
            onClose={() => setEditingQuestion(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NationalExamsClient({ examNodes, questionsByNode, chapters }) {
  const [editingExam, setEditingExam] = useState(null)

  // Group by year
  const byYear = useMemo(() => {
    const map = {}
    for (const exam of examNodes) {
      const yr = exam.exam_year ?? 'Okänt år'
      if (!map[yr]) map[yr] = []
      map[yr].push(exam)
    }
    return map
  }, [examNodes])

  const years = useMemo(
    () => Object.keys(byYear).sort((a, b) => Number(b) - Number(a)),
    [byYear]
  )

  async function handleDeleteExam(id) {
    if (!confirm('Ta bort detta prov och alla dess frågor?')) return
    // First delete all questions for this exam
    const qs = questionsByNode[id] ?? []
    for (const q of qs) {
      await deleteQuestion(q.id)
    }
    const result = await deleteNode(id)
    if (!result.error) {
      window.location.reload()
    } else {
      alert('Fel: ' + result.error)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Nationella prov</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {examNodes.length} {examNodes.length === 1 ? 'prov' : 'prov'} – frisläppta nationella prov för Ma1b
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setEditingExam({ ...EMPTY_EXAM })}>
          <span className="flex items-center gap-1.5">
            <PlusIcon />
            Nytt prov
          </span>
        </Button>
      </div>

      {/* Content */}
      {examNodes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-text-muted mb-1">Inga nationella prov ännu</p>
          <p className="text-xs text-text-muted">Klicka på "Nytt prov" för att skapa det första nationella provet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {years.map((yr) => (
            <section key={yr}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">{yr}</h2>
              <div className="flex flex-col gap-3">
                {byYear[yr].map((exam) => (
                  <div key={exam.id} className="relative group">
                    <ExamCard
                      exam={exam}
                      questions={questionsByNode[exam.id] ?? []}
                      chapters={chapters}
                      onEditExam={setEditingExam}
                    />
                    {/* Delete exam button - always accessible */}
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="absolute top-4 right-[140px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-danger"
                      aria-label={`Ta bort: ${exam.title}`}
                    >
                      <TrashIcon />
                      Ta bort
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Exam create/edit modal */}
      <AnimatePresence>
        {editingExam && (
          <ExamModal
            exam={editingExam}
            chapters={chapters}
            onClose={() => setEditingExam(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

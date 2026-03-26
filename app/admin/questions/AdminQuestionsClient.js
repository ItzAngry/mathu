'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import { upsertQuestion, deleteQuestion } from '@/lib/actions/admin'

const EMPTY_QUESTION = {
  id: null,
  node_id: '',
  chapter_id: '',
  text: '',
  correct_answer: '',
  answer_aliases: '',
  grade_level: 'C',
  has_geogebra: false,
  requires_canvas: false,
  allows_calculator: false,
  order_index: 0,
}

// Helper: question has any digital tool enabled
function hasDigitalTools(q) {
  return Boolean(q.has_geogebra || q.requires_canvas || q.allows_calculator)
}

export default function AdminQuestionsClient({ chapters, nodes, questions: initialQuestions }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [editing, setEditing] = useState(null) // null | question object
  const [saving, setSaving] = useState(false)
  const [filterChapter, setFilterChapter] = useState('')

  const filtered = filterChapter
    ? questions.filter((q) => q.chapter_id === filterChapter)
    : questions

  const chapterMap = Object.fromEntries(chapters.map((c) => [c.id, c]))
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.target)
    const result = await upsertQuestion(formData)
    if (!result.error) {
      window.location.reload()
    } else {
      alert('Fel: ' + result.error)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Ta bort denna fråga?')) return
    await deleteQuestion(id)
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text">Frågor ({questions.length})</h2>
        <Button variant="primary" size="md" onClick={() => setEditing({ ...EMPTY_QUESTION })}>
          + Lägg till fråga
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterChapter}
          onChange={(e) => setFilterChapter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-border bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filtrera efter kapitel"
        >
          <option value="">Alla kapitel</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Frågor">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-text-muted">Fråga</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted">Rätt svar</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted">Betyg</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted">Kapitel/Nod</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    Inga frågor
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate" title={q.text}>{q.text}</p>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{q.correct_answer}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
                        {q.grade_level ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">
                      {chapterMap[q.chapter_id]?.title ?? '—'}
                      {q.node_id && <span className="block">{nodeMap[q.node_id]?.title}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditing({ ...q, answer_aliases: (q.answer_aliases ?? []).join(', ') })}
                          className="text-primary text-xs hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded"
                        >
                          Redigera
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="text-danger text-xs hover:underline focus-visible:outline-2 focus-visible:outline-danger rounded"
                        >
                          Ta bort
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-text">
                    {editing.id ? 'Redigera fråga' : 'Ny fråga'}
                  </h3>
                  <button onClick={() => setEditing(null)} className="text-text-muted hover:text-text" aria-label="Stäng">✕</button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  {editing.id && <input type="hidden" name="id" value={editing.id} />}

                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Frågetext *</label>
                    <textarea
                      name="text"
                      defaultValue={editing.text}
                      required
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">Rätt svar *</label>
                      <input type="text" name="correct_answer" defaultValue={editing.correct_answer} required
                        className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">Betygsnivå</label>
                      <select name="grade_level" defaultValue={editing.grade_level}
                        className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        {['E', 'D', 'C', 'B', 'A'].map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Alternativa svar (kommaseparerat)</label>
                    <input type="text" name="answer_aliases" defaultValue={editing.answer_aliases}
                      placeholder="t.ex. 8, 2³, 2^3"
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">Kapitel</label>
                      <select name="chapter_id" defaultValue={editing.chapter_id}
                        className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Välj kapitel</option>
                        {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">Nod</label>
                      <select name="node_id" defaultValue={editing.node_id}
                        className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Välj nod</option>
                        {nodes.filter((n) => !editing.chapter_id || n.chapter_id === editing.chapter_id).map((n) => (
                          <option key={n.id} value={n.id}>{n.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" name="digital_tools" defaultChecked={hasDigitalTools(editing)}
                        className="accent-primary w-4 h-4" />
                      <span>
                        Digitala verktyg{' '}
                        <span className="text-text-muted font-normal">(miniräknare, GeoGebra, rityta)</span>
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" variant="primary" size="md" loading={saving} fullWidth>
                      Spara
                    </Button>
                    <Button type="button" variant="secondary" size="md" onClick={() => setEditing(null)}>
                      Avbryt
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

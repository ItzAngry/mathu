'use client'

import { useState, useMemo } from 'react'
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

const GRADE_COLORS = {
  E: 'bg-green-100 text-green-700',
  D: 'bg-teal-100 text-teal-700',
  C: 'bg-blue-100 text-blue-700',
  B: 'bg-purple-100 text-purple-700',
  A: 'bg-amber-100 text-amber-700',
}

function hasDigitalTools(q) {
  return Boolean(q.has_geogebra || q.requires_canvas || q.allows_calculator)
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
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

function ToolsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3" aria-hidden="true">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  )
}

export default function AdminQuestionsClient({ chapters, nodes, questions: initialQuestions }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterChapter, setFilterChapter] = useState('')
  const [filterNode, setFilterNode] = useState('')
  const [search, setSearch] = useState('')

  const chapterMap = useMemo(() => Object.fromEntries(chapters.map((c) => [c.id, c])), [chapters])
  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes])

  const filteredNodes = useMemo(
    () => (filterChapter ? nodes.filter((n) => n.chapter_id === filterChapter) : nodes),
    [nodes, filterChapter]
  )

  const filtered = useMemo(() => {
    let q = questions
    if (filterChapter) q = q.filter((x) => x.chapter_id === filterChapter)
    if (filterNode) q = q.filter((x) => x.node_id === filterNode)
    if (search) {
      const s = search.toLowerCase()
      q = q.filter((x) => x.text?.toLowerCase().includes(s) || x.correct_answer?.toLowerCase().includes(s))
    }
    return q
  }, [questions, filterChapter, filterNode, search])

  // Nodes for the edit form filtered by selected chapter
  const formNodes = useMemo(
    () => (!editing?.chapter_id ? nodes : nodes.filter((n) => n.chapter_id === editing.chapter_id)),
    [nodes, editing?.chapter_id]
  )

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
    const result = await deleteQuestion(id)
    if (!result.error) {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
    } else {
      alert('Fel: ' + result.error)
    }
  }

  function openEdit(q) {
    setEditing({ ...q, answer_aliases: (q.answer_aliases ?? []).join(', ') })
  }

  function openNew() {
    setEditing({
      ...EMPTY_QUESTION,
      chapter_id: filterChapter || '',
      node_id: filterNode || '',
    })
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Frågor</h1>
          <p className="text-sm text-text-muted mt-0.5">{filtered.length} av {questions.length} frågor</p>
        </div>
        <Button variant="primary" size="md" onClick={openNew}>
          <span className="flex items-center gap-1.5">
            <PlusIcon />
            Ny fråga
          </span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök frågor..."
          className="px-4 py-2 rounded-xl border border-border bg-white text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary w-56"
          aria-label="Sök frågor"
        />
        <select
          value={filterChapter}
          onChange={(e) => { setFilterChapter(e.target.value); setFilterNode('') }}
          className="px-4 py-2 rounded-xl border border-border bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filtrera efter kapitel"
        >
          <option value="">Alla kapitel</option>
          {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        {filterChapter && (
          <select
            value={filterNode}
            onChange={(e) => setFilterNode(e.target.value)}
            className="px-4 py-2 rounded-xl border border-border bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Filtrera efter nod"
          >
            <option value="">Alla noder</option>
            {filteredNodes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Frågor">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-5 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Fråga</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Svar</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Betyg</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Kapitel / Nod</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-text-muted">
                    Inga frågor hittades
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-surface transition-colors group">
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="truncate text-text font-medium" title={q.text}>{q.text}</p>
                      {hasDigitalTools(q) && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-text-muted mt-0.5">
                          <ToolsIcon />
                          Digitala verktyg
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-text-muted max-w-[140px]">
                      <p className="truncate" title={q.correct_answer}>{q.correct_answer}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {q.grade_level ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${GRADE_COLORS[q.grade_level] ?? 'bg-surface-2 text-text-muted'}`}>
                          {q.grade_level}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-text-muted">
                      <span>{chapterMap[q.chapter_id]?.title ?? '—'}</span>
                      {q.node_id && nodeMap[q.node_id] && (
                        <span className="block text-text-muted/70 mt-0.5">{nodeMap[q.node_id].title}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(q)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary-light transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                          aria-label={`Redigera: ${q.text}`}
                        >
                          <EditIcon />
                          Redigera
                        </button>
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-danger/10 transition-colors focus-visible:outline-2 focus-visible:outline-danger"
                          aria-label={`Ta bort: ${q.text}`}
                        >
                          <TrashIcon />
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

      {/* Edit / New Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null) }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                <h3 className="font-bold text-text">{editing.id ? 'Redigera fråga' : 'Ny fråga'}</h3>
                <button
                  onClick={() => setEditing(null)}
                  className="text-text-muted hover:text-text transition-colors p-1 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label="Stäng"
                >
                  <CloseIcon />
                </button>
              </div>

              <form key={editing.id ?? 'new'} onSubmit={handleSave} className="p-6 space-y-4">
                {editing.id && <input type="hidden" name="id" value={editing.id} />}

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Frågetext <span className="text-danger">*</span></label>
                  <textarea
                    name="text"
                    defaultValue={editing.text}
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    placeholder="Skriv frågan här..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Rätt svar <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      name="correct_answer"
                      defaultValue={editing.correct_answer}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Betygsnivå</label>
                    <select
                      name="grade_level"
                      defaultValue={editing.grade_level}
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {['E', 'C', 'A'].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Alternativa svar <span className="text-text-muted font-normal">(kommaseparerat)</span></label>
                  <input
                    type="text"
                    name="answer_aliases"
                    defaultValue={editing.answer_aliases}
                    placeholder="t.ex. 8, 2³, 2^3"
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Kapitel</label>
                    <select
                      name="chapter_id"
                      defaultValue={editing.chapter_id}
                      onChange={(e) => setEditing((prev) => ({ ...prev, chapter_id: e.target.value, node_id: '' }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Välj kapitel</option>
                      {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Nod</label>
                    <select
                      name="node_id"
                      defaultValue={editing.node_id}
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Välj nod</option>
                      {formNodes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl border border-border hover:bg-surface transition-colors">
                  <input
                    type="checkbox"
                    name="digital_tools"
                    defaultChecked={hasDigitalTools(editing)}
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
                  <Button type="button" variant="secondary" size="md" onClick={() => setEditing(null)}>
                    Avbryt
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

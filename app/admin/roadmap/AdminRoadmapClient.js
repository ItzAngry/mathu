'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import { upsertNode, deleteNode, upsertQuestion, deleteQuestion } from '@/lib/actions/admin'

// ── Type config ────────────────────────────────────────────────────────────
const TYPE = {
  intro:    { label: 'Läsavsnitt', icon: '📖', color: '#3B82F6', bg: '#EFF6FF', badge: 'bg-blue-100 text-blue-700' },
  practice: { label: 'Övningar',   icon: '✏️',  color: '#8B5CF6', bg: '#F5F3FF', badge: 'bg-purple-100 text-purple-700' },
  test:     { label: 'Delprov',    icon: '🏆',  color: '#F59E0B', bg: '#FFFBEB', badge: 'bg-amber-100 text-amber-700' },
}

// ── Insert-between button ──────────────────────────────────────────────────
function InsertButton({ onClick }) {
  return (
    <div className="relative flex items-center justify-center py-2 group">
      <div className="absolute left-6 right-6 h-px bg-border group-hover:bg-primary/40 transition-colors" />
      <button
        onClick={onClick}
        className="relative z-10 flex items-center gap-1.5 px-3 py-1 bg-white border border-dashed border-border rounded-full text-xs font-medium text-text-muted group-hover:border-primary group-hover:text-primary group-hover:bg-primary-light transition-all shadow-sm"
        aria-label="Lägg till nod här"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3" aria-hidden="true">
          <path d="M8 2a1 1 0 011 1v4h4a1 1 0 110 2H9v4a1 1 0 11-2 0V9H3a1 1 0 110-2h4V3a1 1 0 011-1z" />
        </svg>
        Lägg till nod här
      </button>
    </div>
  )
}

// ── Node card ──────────────────────────────────────────────────────────────
function NodeCard({ node, questionCount, isSelected, onEdit, onQuestions, onDelete }) {
  const cfg = TYPE[node.type] ?? TYPE.practice
  return (
    <div
      className={[
        'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
        isSelected
          ? 'border-primary bg-primary-light shadow-md shadow-primary/10'
          : 'border-transparent bg-surface hover:border-border hover:bg-white',
      ].join(' ')}
    >
      {/* Type icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: cfg.bg }}
        aria-hidden="true"
      >
        {cfg.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-text truncate">{node.title}</p>
          {!node.is_published && (
            <span className="text-xs bg-surface-2 text-text-muted px-1.5 py-0.5 rounded-full shrink-0">
              Utkast
            </span>
          )}
        </div>
        <span className={`mt-0.5 inline-block text-xs font-medium px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Question count chip */}
        <button
          onClick={onQuestions}
          title="Hantera frågor"
          className={[
            'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
            isSelected
              ? 'bg-white text-primary shadow-sm'
              : 'bg-white border border-border text-text-muted hover:border-primary hover:text-primary',
          ].join(' ')}
        >
          ❓ {questionCount}
        </button>

        {/* Edit */}
        <button
          onClick={onEdit}
          title="Redigera nod"
          className="p-1.5 rounded-lg text-text-muted hover:bg-white hover:text-primary transition-all"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          title="Ta bort nod"
          className="p-1.5 rounded-lg text-text-muted hover:bg-danger/10 hover:text-danger transition-all"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Node property form ─────────────────────────────────────────────────────
function NodeForm({ node, onSave, onCancel }) {
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const result = await upsertNode(new FormData(e.target))
    setSaving(false)
    if (result.error) { alert('Fel: ' + result.error); return }
    onSave()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {node.id && <input type="hidden" name="id" value={node.id} />}
      <input type="hidden" name="chapter_id" value={node.chapter_id} />
      <input type="hidden" name="order_index" value={node.order_index ?? 0} />

      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
          Titel *
        </label>
        <input
          type="text" name="title" defaultValue={node.title} required
          placeholder="T.ex. Introduktion till algebra"
          className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Typ *</label>
          <select
            name="type" defaultValue={node.type ?? 'practice'}
            className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="intro">📖 Läsavsnitt</option>
            <option value="practice">✏️ Övningar</option>
            <option value="test">🏆 Delprov</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">Storlek</label>
          <select
            name="size" defaultValue={node.size ?? 'medium'}
            className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="small">Liten</option>
            <option value="medium">Medium</option>
            <option value="large">Stor</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1.5">
          Innehåll (Markdown)
        </label>
        <textarea
          name="content_md" defaultValue={node.content_md} rows={6}
          placeholder="## Rubrik&#10;&#10;Brödtext här..."
          className="w-full px-3 py-2.5 rounded-xl border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
        <input
          type="checkbox" name="is_published"
          defaultChecked={node.is_published ?? true}
          className="w-4 h-4 accent-primary rounded"
        />
        <span className="font-medium text-text">Publicerad</span>
        <span className="text-text-muted text-xs">(syns för elever)</span>
      </label>

      <div className="flex gap-2 pt-1 border-t border-border">
        <Button type="submit" variant="primary" size="sm" loading={saving} fullWidth>
          {node.id ? 'Spara ändringar' : 'Skapa nod'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Avbryt
        </Button>
      </div>
    </form>
  )
}

// ── Question mini-form ─────────────────────────────────────────────────────
function QuestionForm({ question, node, onSave, onCancel }) {
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const result = await upsertQuestion(new FormData(e.target))
    setSaving(false)
    if (result.error) { alert('Fel: ' + result.error); return }
    onSave()
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="space-y-3 bg-surface rounded-xl p-4 border-2 border-primary/30"
    >
      {question?.id && <input type="hidden" name="id" value={question.id} />}
      <input type="hidden" name="node_id" value={node.id} />
      <input type="hidden" name="chapter_id" value={node.chapter_id} />

      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Frågetext *</label>
        <textarea
          name="text" defaultValue={question?.text} required rows={2}
          placeholder="T.ex. Beräkna 2³"
          className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Rätt svar *</label>
          <input
            type="text" name="correct_answer" defaultValue={question?.correct_answer} required
            placeholder="8"
            className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Betygsnivå</label>
          <select
            name="grade_level" defaultValue={question?.grade_level ?? 'C'}
            className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {['E','D','C','B','A'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
          Alt. svar <span className="font-normal normal-case">(kommasep.)</span>
        </label>
        <input
          type="text" name="answer_aliases"
          defaultValue={(question?.answer_aliases ?? []).join(', ')}
          placeholder="t.ex. 2³, 2^3"
          className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-4 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" name="requires_canvas" defaultChecked={question?.requires_canvas} className="accent-primary" />
          Canvas
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" name="has_geogebra" defaultChecked={question?.has_geogebra} className="accent-primary" />
          GeoGebra
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" loading={saving} fullWidth>
          {question?.id ? 'Uppdatera fråga' : 'Lägg till fråga'}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>Avbryt</Button>
      </div>
    </motion.form>
  )
}

// ── Question row ───────────────────────────────────────────────────────────
function QuestionRow({ q, onEdit, onDelete }) {
  const gradeBadge = {
    A: 'bg-green-100 text-green-700',
    B: 'bg-teal-100 text-teal-700',
    C: 'bg-blue-100 text-blue-700',
    D: 'bg-orange-100 text-orange-700',
    E: 'bg-gray-100 text-gray-600',
  }[q.grade_level] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-white hover:border-primary/30 transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text line-clamp-2">{q.text}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs text-text-muted">→ {q.correct_answer}</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${gradeBadge}`}>
            Betyg {q.grade_level}
          </span>
          {q.requires_canvas && <span className="text-xs text-text-muted">🖊 Canvas</span>}
          {q.has_geogebra && <span className="text-xs text-text-muted">📐 GeoGebra</span>}
        </div>
      </div>
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-light transition-all"
          title="Redigera"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
          title="Ta bort"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminRoadmapClient({ chapters, nodes: initNodes, questions: initQuestions }) {
  const [nodes, setNodes] = useState(initNodes)
  const [questions, setQuestions] = useState(initQuestions)

  // panel = null | { type: 'node'|'newNode', node, tab: 'props'|'questions', addingQ: bool, editingQ: null|obj }
  const [panel, setPanel] = useState(null)

  // ── Derived data ──────────────────────────────────────────────────────
  const nodesByChapter = {}
  for (const n of nodes) {
    if (!nodesByChapter[n.chapter_id]) nodesByChapter[n.chapter_id] = []
    nodesByChapter[n.chapter_id].push(n)
  }
  for (const arr of Object.values(nodesByChapter)) {
    arr.sort((a, b) => a.order_index - b.order_index)
  }

  const questionsByNode = {}
  for (const q of questions) {
    if (!questionsByNode[q.node_id]) questionsByNode[q.node_id] = []
    questionsByNode[q.node_id].push(q)
  }

  // ── Panel openers ─────────────────────────────────────────────────────
  function openNodeProps(node) {
    setPanel({ type: 'node', node, tab: 'props', addingQ: false, editingQ: null })
  }
  function openNodeQuestions(node) {
    setPanel({ type: 'node', node, tab: 'questions', addingQ: false, editingQ: null })
  }
  function openNewNode(chapter_id, afterIdx, beforeIdx) {
    const order_index = beforeIdx != null
      ? (afterIdx + beforeIdx) / 2
      : afterIdx + 1
    setPanel({
      type: 'newNode',
      node: { id: null, chapter_id, type: 'practice', title: '', size: 'medium', is_published: true, order_index, content_md: '' },
      tab: 'props', addingQ: false, editingQ: null,
    })
  }
  function closePanel() { setPanel(null) }

  // ── Actions ───────────────────────────────────────────────────────────
  async function handleDeleteNode(id) {
    if (!confirm('Ta bort noden? Frågor kopplade till den förlorar sin nod-koppling.')) return
    await deleteNode(id)
    setNodes(prev => prev.filter(n => n.id !== id))
    if (panel?.node?.id === id) setPanel(null)
  }

  async function handleDeleteQuestion(id) {
    if (!confirm('Ta bort frågan?')) return
    await deleteQuestion(id)
    setQuestions(prev => prev.filter(q => q.id !== id))
    // Also remove from the local questionsByNode view
  }

  function handleSaved() {
    window.location.reload()
  }

  const pNode = panel?.node

  return (
    <div className="relative">
      {/* ── Left: tree ──────────────────────────────────────────────────── */}
      <div
        className="transition-[padding] duration-300"
        style={{ paddingRight: panel ? 448 : 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text">Kursträd</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {chapters.length} kapitel · {nodes.length} noder · {questions.length} frågor
            </p>
          </div>
        </div>

        {/* Chapter list */}
        <div className="space-y-4">
          {chapters.map((chapter) => {
            const cNodes = nodesByChapter[chapter.id] ?? []
            const cQuestions = cNodes.reduce((sum, n) => sum + (questionsByNode[n.id]?.length ?? 0), 0)
            return (
              <div key={chapter.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                {/* Chapter header bar */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderLeft: `4px solid ${chapter.color ?? '#6C63FF'}` }}
                >
                  <span className="text-2xl" aria-hidden="true">{chapter.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text">{chapter.title}</p>
                    <p className="text-xs text-text-muted">
                      {cNodes.length} noder · {cQuestions} frågor
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ backgroundColor: (chapter.color ?? '#6C63FF') + '18', color: chapter.color ?? '#6C63FF' }}
                  >
                    Kapitel {chapters.indexOf(chapter) + 1}
                  </span>
                </div>

                {/* Node list */}
                <div className="px-3 pb-3 pt-2 space-y-0.5">
                  {cNodes.length === 0 && (
                    <p className="text-sm text-text-muted text-center py-5 italic">
                      Inga noder — lägg till en nedan
                    </p>
                  )}

                  {cNodes.map((node, idx) => (
                    <div key={node.id}>
                      <NodeCard
                        node={node}
                        questionCount={(questionsByNode[node.id] ?? []).length}
                        isSelected={panel?.node?.id === node.id}
                        onEdit={() => openNodeProps(node)}
                        onQuestions={() => openNodeQuestions(node)}
                        onDelete={() => handleDeleteNode(node.id)}
                      />
                      <InsertButton
                        onClick={() => openNewNode(
                          chapter.id,
                          node.order_index,
                          cNodes[idx + 1]?.order_index
                        )}
                      />
                    </div>
                  ))}

                  {/* First node insertion when chapter is empty */}
                  {cNodes.length === 0 && (
                    <InsertButton onClick={() => openNewNode(chapter.id, 0, undefined)} />
                  )}
                </div>
              </div>
            )
          })}

          {chapters.length === 0 && (
            <div className="text-center py-16 text-text-muted">
              <div className="text-4xl mb-3">📚</div>
              <p>Inga kapitel ännu.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: sliding editor panel ─────────────────────────────────── */}
      <div
        className={[
          'fixed top-0 right-0 h-full w-[432px] bg-white border-l border-border shadow-2xl z-50 flex flex-col',
          'transition-transform duration-300 ease-out',
          panel ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-label="Editor"
      >
        <AnimatePresence mode="wait">
          {panel && pNode && (
            <motion.div
              key={panel.type === 'newNode' ? 'new' : pNode.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {/* Panel header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0 bg-white">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: TYPE[pNode.type]?.bg ?? '#F3F4F6' }}
                  aria-hidden="true"
                >
                  {TYPE[pNode.type]?.icon ?? '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-text text-sm truncate">
                    {panel.type === 'newNode' ? 'Ny nod' : (pNode.title || 'Redigera nod')}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {chapters.find(c => c.id === pNode.chapter_id)?.title ?? ''}
                    {panel.type === 'newNode' && (
                      <span className="ml-1 text-primary font-medium">· Placeras på position {pNode.order_index.toFixed(1)}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={closePanel}
                  aria-label="Stäng panel"
                  className="p-1.5 rounded-xl text-text-muted hover:bg-surface-2 hover:text-text transition-all"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Tabs — only for existing nodes */}
              {panel.type === 'node' && (
                <div className="flex border-b border-border shrink-0 bg-white">
                  {[
                    { id: 'props', label: 'Egenskaper' },
                    { id: 'questions', label: `Frågor (${(questionsByNode[pNode.id] ?? []).length})` },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setPanel(p => ({ ...p, tab: id, addingQ: false, editingQ: null }))}
                      className={[
                        'flex-1 py-3 text-sm font-medium border-b-2 transition-colors',
                        panel.tab === id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-text-muted hover:text-text',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto p-5">

                {/* ── Properties tab (or new node form) ── */}
                {(panel.type === 'newNode' || panel.tab === 'props') && (
                  <NodeForm node={pNode} onSave={handleSaved} onCancel={closePanel} />
                )}

                {/* ── Questions tab ── */}
                {panel.type === 'node' && panel.tab === 'questions' && (
                  <div className="space-y-3">

                    {/* Add / Edit question form */}
                    <AnimatePresence>
                      {(panel.addingQ || panel.editingQ) && (
                        <QuestionForm
                          key={panel.editingQ?.id ?? 'new'}
                          question={panel.editingQ ?? null}
                          node={pNode}
                          onSave={handleSaved}
                          onCancel={() => setPanel(p => ({ ...p, addingQ: false, editingQ: null }))}
                        />
                      )}
                    </AnimatePresence>

                    {/* "Add question" button */}
                    {!panel.addingQ && !panel.editingQ && (
                      <button
                        onClick={() => setPanel(p => ({ ...p, addingQ: true }))}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-primary/40 text-primary text-sm font-medium hover:border-primary hover:bg-primary-light transition-all"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Lägg till fråga
                      </button>
                    )}

                    {/* Question list */}
                    <div className="space-y-2">
                      {(questionsByNode[pNode.id] ?? []).length === 0 && !panel.addingQ ? (
                        <div className="text-center py-8 text-text-muted">
                          <div className="text-3xl mb-2">❓</div>
                          <p className="text-sm">Inga frågor ännu.</p>
                          <p className="text-xs mt-1">Klicka ovan för att lägga till.</p>
                        </div>
                      ) : (
                        (questionsByNode[pNode.id] ?? []).map(q => (
                          <QuestionRow
                            key={q.id}
                            q={q}
                            onEdit={() => setPanel(p => ({ ...p, editingQ: q, addingQ: false }))}
                            onDelete={() => handleDeleteQuestion(q.id)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

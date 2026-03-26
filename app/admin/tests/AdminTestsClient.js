'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import ContentMdTextarea from '@/components/admin/ContentMdTextarea'
import { upsertNode, deleteNode } from '@/lib/actions/admin'

const TYPE_LABELS = { intro: 'Läsavsnitt', practice: 'Övningar', test: 'Delprov' }
const TYPE_COLORS = {
  intro: 'bg-blue-100 text-blue-700',
  practice: 'bg-purple-100 text-purple-700',
  test: 'bg-amber-100 text-amber-700',
}
const SIZE_LABELS = { small: 'Liten', medium: 'Medium', large: 'Stor' }

const EMPTY_NODE = {
  id: null,
  chapter_id: '',
  type: 'practice',
  title: '',
  title_en: '',
  content_md: '',
  audio_url: '',
  order_index: 0,
  size: 'medium',
  is_published: true,
  is_national_exam: false,
  exam_year: null,
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
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

export default function AdminTestsClient({ chapters, nodes: initialNodes }) {
  const [nodes, setNodes] = useState(initialNodes)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterChapter, setFilterChapter] = useState('')
  const [filterType, setFilterType] = useState('')

  const chapterMap = useMemo(() => Object.fromEntries(chapters.map((c) => [c.id, c])), [chapters])

  const filtered = useMemo(() => {
    let n = nodes
    if (filterChapter) n = n.filter((x) => x.chapter_id === filterChapter)
    if (filterType) n = n.filter((x) => x.type === filterType)
    return n
  }, [nodes, filterChapter, filterType])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.target)
    const result = await upsertNode(formData)
    if (!result.error) {
      window.location.reload()
    } else {
      alert('Fel: ' + result.error)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Ta bort denna nod? Alla kopplade frågor förlorar sin nod-koppling.')) return
    const result = await deleteNode(id)
    if (!result.error) {
      setNodes((prev) => prev.filter((n) => n.id !== id))
    } else {
      alert('Fel: ' + result.error)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Noder</h1>
          <p className="text-sm text-text-muted mt-0.5">{filtered.length} av {nodes.length} noder</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setEditing({ ...EMPTY_NODE })}>
          <span className="flex items-center gap-1.5">
            <PlusIcon />
            Ny nod
          </span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filterChapter}
          onChange={(e) => setFilterChapter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-border bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filtrera efter kapitel"
        >
          <option value="">Alla kapitel</option>
          {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 rounded-xl border border-border bg-white text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filtrera efter typ"
        >
          <option value="">Alla typer</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Noder">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-5 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Titel</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Typ</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Kapitel</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Ordning</th>
                <th className="text-left px-4 py-3 font-semibold text-text-muted text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-text-muted">Inga noder hittades</td>
                </tr>
              ) : filtered.map((node) => (
                <tr key={node.id} className="hover:bg-surface transition-colors group">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-text">{node.title}</p>
                    {node.title_en && <p className="text-xs text-text-muted mt-0.5">{node.title_en}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[node.type] ?? 'bg-surface-2 text-text-muted'}`}>
                      {TYPE_LABELS[node.type] ?? node.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-text-muted">{chapterMap[node.chapter_id]?.title ?? '—'}</td>
                  <td className="px-4 py-3.5 text-sm text-text-muted tabular-nums">{node.order_index}</td>
                  <td className="px-4 py-3.5">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${node.is_published ? 'text-success' : 'text-text-muted'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${node.is_published ? 'bg-success' : 'bg-border'}`} />
                      {node.is_published ? 'Pub.' : 'Utkast'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditing({ ...node })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary-light transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                        aria-label={`Redigera: ${node.title}`}
                      >
                        <EditIcon />
                        Redigera
                      </button>
                      <button
                        onClick={() => handleDelete(node.id)}
                        className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors focus-visible:outline-2 focus-visible:outline-danger"
                        aria-label={`Ta bort: ${node.title}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) setEditing(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                <h3 className="font-bold text-text">{editing.id ? 'Redigera nod' : 'Ny nod'}</h3>
                <button
                  onClick={() => setEditing(null)}
                  className="text-text-muted hover:text-text transition-colors p-1 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label="Stäng"
                >
                  <CloseIcon />
                </button>
              </div>

              <form key={editing.id ?? 'new-node'} onSubmit={handleSave} className="p-6 space-y-4">
                {editing.id && <input type="hidden" name="id" value={editing.id} />}

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Titel <span className="text-danger">*</span></label>
                  <input type="text" name="title" defaultValue={editing.title} required
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Titel (engelska)</label>
                  <input type="text" name="title_en" defaultValue={editing.title_en ?? ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Kapitel <span className="text-danger">*</span></label>
                    <select name="chapter_id" defaultValue={editing.chapter_id} required
                      className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Välj</option>
                      {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Typ <span className="text-danger">*</span></label>
                    <select name="type" defaultValue={editing.type} required
                      className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="intro">Läsavsnitt</option>
                      <option value="practice">Övningar</option>
                      <option value="test">Delprov</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Storlek</label>
                    <select name="size" defaultValue={editing.size}
                      className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="small">Liten</option>
                      <option value="medium">Medium</option>
                      <option value="large">Stor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Ordning</label>
                    <input type="number" name="order_index" defaultValue={editing.order_index}
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" name="is_published" defaultChecked={editing.is_published} className="accent-primary w-4 h-4" />
                      Publicerad
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Innehåll (Markdown)</label>
                  <ContentMdTextarea
                    name="content_md"
                    defaultValue={editing.content_md ?? ''}
                    rows={8}
                    className="px-4 py-2.5"
                    placeholder="Markdown-innehåll för läsavsnitt..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Ljudfil (URL)</label>
                  <input type="text" name="audio_url" defaultValue={editing.audio_url ?? ''}
                    placeholder="https://… eller audio/lesson.mp3"
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" variant="primary" size="md" loading={saving} fullWidth>
                    {saving ? 'Sparar...' : 'Spara nod'}
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

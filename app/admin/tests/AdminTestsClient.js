'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'
import { upsertNode, deleteNode } from '@/lib/actions/admin'

const TYPE_LABELS = { intro: 'Läsavsnitt', practice: 'Övningar', test: 'Delprov' }
const SIZE_LABELS = { small: 'Liten', medium: 'Medium', large: 'Stor' }

const EMPTY_NODE = {
  id: null, chapter_id: '', type: 'practice', title: '', title_en: '',
  content_md: '', order_index: 0, size: 'medium', is_published: true,
}

export default function AdminTestsClient({ chapters, nodes: initialNodes }) {
  const [nodes, setNodes] = useState(initialNodes)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterChapter, setFilterChapter] = useState('')

  const chapterMap = Object.fromEntries(chapters.map((c) => [c.id, c]))
  const filtered = filterChapter ? nodes.filter((n) => n.chapter_id === filterChapter) : nodes

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
    await deleteNode(id)
    setNodes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text">Noder ({nodes.length})</h2>
        <Button variant="primary" size="md" onClick={() => setEditing({ ...EMPTY_NODE })}>
          + Lägg till nod
        </Button>
      </div>

      <div className="mb-4">
        <select
          value={filterChapter}
          onChange={(e) => setFilterChapter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Alla kapitel</option>
          {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">Titel</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">Typ</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">Storlek</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">Kapitel</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">#</th>
              <th className="text-left px-4 py-3 font-semibold text-text-muted">Pub.</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((node) => (
              <tr key={node.id} className="border-b border-border last:border-0 hover:bg-surface transition-colors">
                <td className="px-4 py-3 font-medium text-text">{node.title}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${node.type === 'test' ? 'bg-yellow-100 text-yellow-700' : node.type === 'intro' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {TYPE_LABELS[node.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">{SIZE_LABELS[node.size]}</td>
                <td className="px-4 py-3 text-text-muted text-xs">{chapterMap[node.chapter_id]?.title ?? '—'}</td>
                <td className="px-4 py-3 text-text-muted">{node.order_index}</td>
                <td className="px-4 py-3">
                  <span className={`w-2 h-2 rounded-full inline-block ${node.is_published ? 'bg-success' : 'bg-border'}`} aria-label={node.is_published ? 'Publicerad' : 'Ej publicerad'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditing({ ...node })} className="text-primary text-xs hover:underline">Redigera</button>
                    <button onClick={() => handleDelete(node.id)} className="text-danger text-xs hover:underline">Ta bort</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  <h3 className="text-lg font-bold">{editing.id ? 'Redigera nod' : 'Ny nod'}</h3>
                  <button onClick={() => setEditing(null)} className="text-text-muted hover:text-text">✕</button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  {editing.id && <input type="hidden" name="id" value={editing.id} />}

                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Titel *</label>
                    <input type="text" name="title" defaultValue={editing.title} required
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-1">Titel (engelska)</label>
                    <input type="text" name="title_en" defaultValue={editing.title_en}
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">Kapitel *</label>
                      <select name="chapter_id" defaultValue={editing.chapter_id} required
                        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Välj</option>
                        {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">Typ *</label>
                      <select name="type" defaultValue={editing.type} required
                        className="w-full px-3 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="intro">Läsavsnitt</option>
                        <option value="practice">Övningar</option>
                        <option value="test">Delprov</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">Storlek</label>
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
                      <label className="block text-sm font-medium text-text mb-1">Ordning</label>
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
                    <label className="block text-sm font-medium text-text mb-1">Innehåll (Markdown, för läsavsnitt)</label>
                    <textarea name="content_md" defaultValue={editing.content_md} rows={6}
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono" />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" variant="primary" size="md" loading={saving} fullWidth>Spara</Button>
                    <Button type="button" variant="secondary" size="md" onClick={() => setEditing(null)}>Avbryt</Button>
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

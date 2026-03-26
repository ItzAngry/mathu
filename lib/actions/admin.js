'use server'

import { createServiceClient } from '@/lib/supabaseServer'

export async function upsertQuestion(formData) {
  const supabase = createServiceClient()

  const id = formData.get('id') || undefined
  const aliasRaw = formData.get('answer_aliases') ?? ''
  const aliases = aliasRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const payload = {
    text: formData.get('text'),
    correct_answer: formData.get('correct_answer'),
    answer_aliases: aliases,
    grade_level: formData.get('grade_level') || null,
    chapter_id: formData.get('chapter_id') || null,
    node_id: formData.get('node_id') || null,
    requires_canvas: formData.get('requires_canvas') === 'on',
    allows_calculator: formData.get('allows_calculator') === 'on',
    has_geogebra: formData.get('has_geogebra') === 'on',
  }

  if (id) {
    const { error } = await supabase.from('questions').update(payload).eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('questions').insert(payload)
    if (error) return { error: error.message }
  }

  return { success: true }
}

export async function deleteQuestion(id) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function upsertNode(formData) {
  const supabase = createServiceClient()
  const id = formData.get('id') || undefined
  const chapterId = formData.get('chapter_id')

  const audioRaw = formData.get('audio_url')
  const audio_url =
    audioRaw == null || String(audioRaw).trim() === '' ? null : String(audioRaw).trim()

  const payloadBase = {
    chapter_id: chapterId,
    type: formData.get('type'),
    title: formData.get('title'),
    title_en: formData.get('title_en') || null,
    content_md: formData.get('content_md') || null,
    audio_url,
    size: formData.get('size') ?? 'medium',
    is_published: formData.get('is_published') === 'on',
  }

  if (id) {
    const rawOrder = formData.get('order_index')
    const n = Number.parseInt(String(rawOrder ?? ''), 10)
    const order_index = Number.isFinite(n) ? n : 0
    const { error } = await supabase
      .from('nodes')
      .update({ ...payloadBase, order_index })
      .eq('id', id)
    if (error) return { error: error.message }
    return { success: true }
  }

  // New node: roadmap UI may send fractional order_index (e.g. 1.5) to mean
  // "between" neighbors; DB column is integer. Resolve by renumbering chapter.
  const hint = Number(formData.get('order_index') ?? '0')
  const { data: siblings, error: sErr } = await supabase
    .from('nodes')
    .select('id, order_index')
    .eq('chapter_id', chapterId)

  if (sErr) return { error: sErr.message }

  const sorted = [...(siblings ?? [])].sort(
    (a, b) => Number(a.order_index) - Number(b.order_index)
  )
  let pos = sorted.findIndex((r) => Number(r.order_index) > hint)
  if (pos === -1) pos = sorted.length

  for (let i = 0; i < pos; i++) {
    const want = i
    if (Number(sorted[i].order_index) !== want) {
      const { error } = await supabase
        .from('nodes')
        .update({ order_index: want })
        .eq('id', sorted[i].id)
      if (error) return { error: error.message }
    }
  }
  for (let i = pos; i < sorted.length; i++) {
    const want = i + 1
    if (Number(sorted[i].order_index) !== want) {
      const { error } = await supabase
        .from('nodes')
        .update({ order_index: want })
        .eq('id', sorted[i].id)
      if (error) return { error: error.message }
    }
  }

  const { error } = await supabase
    .from('nodes')
    .insert({ ...payloadBase, order_index: pos })
  if (error) return { error: error.message }

  return { success: true }
}

export async function deleteNode(id) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('nodes').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

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

  // "Digitala verktyg" single toggle — enables/disables all three tool flags at once
  const digitalTools = formData.get('digital_tools') === 'on'

  const pointsRaw = Number.parseInt(String(formData.get('points') ?? '1'), 10)
  const points = Number.isFinite(pointsRaw) && pointsRaw >= 1 ? pointsRaw : 1

  const payload = {
    text: formData.get('text'),
    correct_answer: formData.get('correct_answer'),
    answer_aliases: aliases,
    grade_level: formData.get('grade_level') || null,
    chapter_id: formData.get('chapter_id') || null,
    node_id: formData.get('node_id') || null,
    requires_canvas: digitalTools,
    allows_calculator: digitalTools,
    has_geogebra: digitalTools,
    points,
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
  const chapterIdRaw = formData.get('chapter_id')
  const chapterId =
    chapterIdRaw == null || String(chapterIdRaw).trim() === ''
      ? null
      : String(chapterIdRaw).trim()

  const audioRaw = formData.get('audio_url')
  const audio_url =
    audioRaw == null || String(audioRaw).trim() === '' ? null : String(audioRaw).trim()

  const examYearRaw = formData.get('exam_year')
  const examYear = examYearRaw ? Number.parseInt(String(examYearRaw), 10) || null : null

  const payloadBase = {
    chapter_id: chapterId,
    type: formData.get('type'),
    title: formData.get('title'),
    title_en: formData.get('title_en') || null,
    content_md: formData.get('content_md') || null,
    audio_url,
    size: formData.get('size') ?? 'medium',
    is_published: formData.get('is_published') === 'on',
    is_national_exam: formData.get('is_national_exam') === 'on',
    exam_year: formData.get('is_national_exam') === 'on' ? examYear : null,
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
  let siblingsQuery = supabase.from('nodes').select('id, order_index')
  siblingsQuery =
    chapterId === null
      ? siblingsQuery.is('chapter_id', null)
      : siblingsQuery.eq('chapter_id', chapterId)
  const { data: siblings, error: sErr } = await siblingsQuery

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

export async function upsertChapter(formData) {
  const supabase = createServiceClient()
  const id = formData.get('id') || undefined
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { error: 'Titel krävs' }

  const o = Number.parseInt(String(formData.get('order_index') ?? '0'), 10)
  const order_index = Number.isFinite(o) ? o : 0

  const payload = {
    title,
    title_en: String(formData.get('title_en') ?? '').trim() || null,
    description: String(formData.get('description') ?? '').trim() || null,
    description_en: String(formData.get('description_en') ?? '').trim() || null,
    order_index,
    color: String(formData.get('color') ?? '#6C63FF').trim() || '#6C63FF',
    icon: String(formData.get('icon') ?? '📚').trim() || '📚',
    is_published: formData.get('is_published') === 'on',
  }

  if (id) {
    const { error } = await supabase.from('chapters').update(payload).eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('chapters').insert(payload)
    if (error) return { error: error.message }
  }

  return { success: true }
}

export async function deleteChapter(id) {
  const supabase = createServiceClient()

  const { count: nCount, error: nErr } = await supabase
    .from('nodes')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', id)
  if (nErr) return { error: nErr.message }
  if ((nCount ?? 0) > 0) {
    return { error: 'Kapitlet har noder. Ta bort eller flytta dem först.' }
  }

  const { count: qCount, error: qErr } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', id)
  if (qErr) return { error: qErr.message }
  if ((qCount ?? 0) > 0) {
    return { error: 'Kapitlet har frågor kopplade till kapitlet. Ta bort eller flytta dem först.' }
  }

  const { error } = await supabase.from('chapters').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

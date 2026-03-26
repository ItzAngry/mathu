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
    has_geogebra: formData.get('has_geogebra') === 'on',
    geogebra_id: formData.get('geogebra_id') || null,
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

  const payload = {
    chapter_id: formData.get('chapter_id'),
    type: formData.get('type'),
    title: formData.get('title'),
    title_en: formData.get('title_en') || null,
    content_md: formData.get('content_md') || null,
    order_index: parseFloat(formData.get('order_index') ?? '0'),
    size: formData.get('size') ?? 'medium',
    is_published: formData.get('is_published') === 'on',
  }

  if (id) {
    const { error } = await supabase.from('nodes').update(payload).eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('nodes').insert(payload)
    if (error) return { error: error.message }
  }

  return { success: true }
}

export async function deleteNode(id) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('nodes').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

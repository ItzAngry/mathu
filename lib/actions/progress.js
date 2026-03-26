'use server'

import { createClient } from '@/lib/supabaseServer'

/** Mark all nodes in chapters strictly before `targetChapterId` as completed; returns ids we actually flipped (for revert). */
export async function completePriorNodesForChapterSkip(targetChapterId) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: chapters, error: cErr } = await supabase
    .from('chapters')
    .select('id, order_index')
    .eq('is_published', true)
    .order('order_index')

  if (cErr) return { error: cErr.message }

  const sorted = chapters ?? []
  const targetIdx = sorted.findIndex((c) => c.id === targetChapterId)
  if (targetIdx === -1) return { error: 'Kapitel hittades inte' }

  // All chapters listed *before* this one in the course (same order as /plugga) — e.g. jump to
  // "kapitel 2" marks every published node in kapitel 1 as completed (green on the roadmap).
  const priorChapterIds = sorted.slice(0, targetIdx).map((c) => c.id)

  if (priorChapterIds.length === 0) {
    return { success: true, autoNodeIds: [] }
  }

  const { data: nodes, error: nErr } = await supabase
    .from('nodes')
    .select('id')
    .in('chapter_id', priorChapterIds)
    .eq('is_published', true)

  if (nErr) return { error: nErr.message }

  const priorNodeIds = (nodes ?? []).map((n) => n.id)
  const autoNodeIds = []
  const now = new Date().toISOString()

  for (const nodeId of priorNodeIds) {
    const { data: row } = await supabase
      .from('user_progress')
      .select('completed')
      .eq('user_id', user.id)
      .eq('node_id', nodeId)
      .maybeSingle()

    if (row?.completed) continue

    const { error: uErr } = await supabase.from('user_progress').upsert(
      {
        user_id: user.id,
        node_id: nodeId,
        completed: true,
        score: 100,
        attempts: 1,
        last_attempted_at: now,
        completed_at: now,
      },
      { onConflict: 'user_id,node_id', ignoreDuplicates: false }
    )

    if (uErr) return { error: uErr.message }
    autoNodeIds.push(nodeId)
  }

  return { success: true, autoNodeIds }
}

/**
 * Nollställ all avklarad-framsteg på plugga-kartan (publicerade noder).
 * Används när eleven vill börja om från ett kapitel: inga gröna noder kvar, inga hopp kvar (rensas i klienten).
 */
export async function resetAllRoadmapProgress() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: chapters, error: cErr } = await supabase
    .from('chapters')
    .select('id')
    .eq('is_published', true)

  if (cErr) return { error: cErr.message }
  const chapterIds = (chapters ?? []).map((c) => c.id)
  if (chapterIds.length === 0) return { success: true }

  const { data: nodes, error: nErr } = await supabase
    .from('nodes')
    .select('id')
    .eq('is_published', true)
    .in('chapter_id', chapterIds)

  if (nErr) return { error: nErr.message }
  const nodeIds = [...new Set((nodes ?? []).map((n) => n.id))]
  if (nodeIds.length === 0) return { success: true }

  const { error } = await supabase
    .from('user_progress')
    .update({
      completed: false,
      score: null,
      completed_at: null,
      attempts: 0,
    })
    .in('node_id', nodeIds)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

/**
 * Nollställ avklarad-framsteg från och med `targetChapterId` (samma publicerade ordning som /plugga).
 * Tidigare kapitel lämnas orörda så eleven kan börja om från valt kapitel utan att tappa kapitel 1.
 */
export async function resetRoadmapProgressFromChapter(targetChapterId) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: chapters, error: cErr } = await supabase
    .from('chapters')
    .select('id')
    .eq('is_published', true)
    .order('order_index')

  if (cErr) return { error: cErr.message }
  const sorted = chapters ?? []
  const targetIdx = sorted.findIndex((c) => c.id === targetChapterId)
  if (targetIdx === -1) return { error: 'Kapitel hittades inte' }

  const fromChapterIds = sorted.slice(targetIdx).map((c) => c.id)
  if (fromChapterIds.length === 0) return { success: true }

  const { data: nodes, error: nErr } = await supabase
    .from('nodes')
    .select('id')
    .eq('is_published', true)
    .in('chapter_id', fromChapterIds)

  if (nErr) return { error: nErr.message }
  const nodeIds = [...new Set((nodes ?? []).map((n) => n.id))]
  if (nodeIds.length === 0) return { success: true }

  const { error } = await supabase
    .from('user_progress')
    .update({
      completed: false,
      score: null,
      completed_at: null,
      attempts: 0,
    })
    .in('node_id', nodeIds)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

/** Undo auto-complete from a chapter skip (only affects listed node ids). */
export async function revertAutoCompletedNodes(nodeIds) {
  if (!nodeIds?.length) return { success: true }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_progress')
    .update({
      completed: false,
      score: null,
      completed_at: null,
    })
    .in('node_id', nodeIds)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateNodeProgress({ nodeId, completed, score }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      node_id: nodeId,
      completed,
      score,
      attempts: 1,
      last_attempted_at: new Date().toISOString(),
      ...(completed ? { completed_at: new Date().toISOString() } : {}),
    }, { onConflict: 'user_id,node_id', ignoreDuplicates: false })

  if (error) return { error: error.message }
  return { success: true }
}

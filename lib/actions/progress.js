'use server'

import { createClient } from '@/lib/supabaseServer'

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

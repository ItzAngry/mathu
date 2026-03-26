'use server'

import { createClient } from '@/lib/supabaseServer'

export async function saveSettings(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      language: formData.get('language') ?? 'sv',
      font_preference: formData.get('font_preference') ?? 'default',
      tts_enabled: formData.get('tts_enabled') === 'true',
      grade_goal: formData.get('grade_goal') ?? 'C',
      mathew_api_url: formData.get('mathew_api_url') || null,
      qwen_api_url: formData.get('qwen_api_url') || null,
      updated_at: new Date().toISOString(),
    })

  if (error) return { error: error.message }
  return { success: true }
}

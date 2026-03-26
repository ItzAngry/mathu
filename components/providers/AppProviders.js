'use client'

import { createContext, useState, useCallback, useEffect } from 'react'
import { getTranslations } from '@/lib/i18n'

export const AppContext = createContext(null)

export default function AppProviders({ children, initialProfile }) {
  const [settings, setSettings] = useState({
    language: initialProfile?.language ?? 'sv',
    font: initialProfile?.font_preference ?? 'default',
    tts: initialProfile?.tts_enabled ?? false,
    gradeGoal: initialProfile?.grade_goal ?? 'C',
    mathewUrl: initialProfile?.mathew_api_url ?? '',
    qwenUrl: initialProfile?.qwen_api_url ?? '',
  })

  const t = getTranslations(settings.language)

  // Apply font preference to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-font', settings.font)
  }, [settings.font])

  // Apply language to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('lang', settings.language)
  }, [settings.language])

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  return (
    <AppContext.Provider value={{ settings, updateSettings, t, profile: initialProfile }}>
      {children}
    </AppContext.Provider>
  )
}

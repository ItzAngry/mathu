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
    darkMode: initialProfile?.dark_mode ?? false,
  })

  // Sidebar collapsed state — persisted in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  const t = getTranslations(settings.language)

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) {
      try { setSidebarCollapsed(JSON.parse(stored)) } catch {}
    }
  }, [])

  // Dyslexitypsnitt: sätt endast när aktivt (matchar CSS html[data-font="dyslexic"])
  useEffect(() => {
    const el = document.documentElement
    if (settings.font === 'dyslexic') {
      el.setAttribute('data-font', 'dyslexic')
    } else {
      el.removeAttribute('data-font')
    }
  }, [settings.font])

  // Apply language to <html>
  useEffect(() => {
    document.documentElement.setAttribute('lang', settings.language)
  }, [settings.language])

  // Apply dark mode to <html>
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      settings.darkMode ? 'dark' : 'light'
    )
  }, [settings.darkMode])

  const updateSettings = useCallback((updates) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        t,
        profile: initialProfile,
        sidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

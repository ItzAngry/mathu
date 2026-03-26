'use client'

import { useContext } from 'react'
import { AppContext } from '@/components/providers/AppProviders'

export function useSettings() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useSettings must be used inside AppProviders')
  return {
    settings: ctx.settings,
    updateSettings: ctx.updateSettings,
    sidebarCollapsed: ctx.sidebarCollapsed,
    toggleSidebar: ctx.toggleSidebar,
    profile: ctx.profile,
  }
}

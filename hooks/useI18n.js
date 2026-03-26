'use client'

import { useContext } from 'react'
import { AppContext } from '@/components/providers/AppProviders'

export function useI18n() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useI18n must be used inside AppProviders')
  return ctx.t
}

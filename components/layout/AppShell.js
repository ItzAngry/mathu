'use client'

import { useSettings } from '@/hooks/useSettings'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function AppShell({ children, profile }) {
  const { sidebarCollapsed } = useSettings()
  const isDesktop = useIsDesktop()

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <main
        id="main-content"
        className="flex-1 min-h-screen bg-surface transition-[margin] duration-300 pb-16 lg:pb-0"
        style={{ marginLeft: isDesktop ? (sidebarCollapsed ? '80px' : '208px') : 0 }}
        tabIndex={-1}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-24 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
        >
          Hoppa till huvudinnehåll
        </a>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

'use client'

import { useSettings } from '@/hooks/useSettings'
import Sidebar from './Sidebar'

export default function AppShell({ children, profile }) {
  const { sidebarCollapsed } = useSettings()

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <main
        id="main-content"
        className="flex-1 min-h-screen bg-surface transition-[margin] duration-300"
        style={{ marginLeft: sidebarCollapsed ? '80px' : '208px' }}
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
    </div>
  )
}

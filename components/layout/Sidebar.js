'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useActionState } from 'react'
import { logout } from '@/lib/actions/auth'
import { useI18n } from '@/hooks/useI18n'
import { useSettings } from '@/hooks/useSettings'

// ── Custom SVG icons (no external icon libraries) ──────────────────────────
const BookIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const QuestionIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TestIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const MatheusIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const GearIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 shrink-0" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 shrink-0" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 shrink-0" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)
// ───────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'plugga', href: '/plugga', Icon: BookIcon },
  { key: 'fragor', href: '/fragor', Icon: QuestionIcon },
  { key: 'prov', href: '/prov', Icon: TestIcon },
  { key: 'matheus', href: '/matheus', Icon: MatheusIcon },
]

function LogoutButton({ collapsed }) {
  const [, action, pending] = useActionState(logout, null)
  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        title="Logga ut"
        aria-label="Logga ut"
        className={[
          'w-full flex items-center gap-3 p-3 rounded-2xl text-text-muted',
          'hover:bg-danger/10 hover:text-danger transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-danger',
          collapsed ? 'justify-center' : '',
        ].join(' ')}
      >
        <LogoutIcon />
        {!collapsed && (
          <span className="text-sm font-medium overflow-hidden whitespace-nowrap">
            Logga ut
          </span>
        )}
      </button>
    </form>
  )
}

export default function Sidebar({ profile }) {
  const pathname = usePathname()
  const t = useI18n()
  const { sidebarCollapsed, toggleSidebar } = useSettings()

  const labels = {
    plugga: t.nav.plugga,
    fragor: t.nav.fragor,
    prov: t.nav.prov,
    matheus: t.nav.matheus,
  }

  return (
    <nav
      style={{ width: sidebarCollapsed ? '80px' : '208px' }}
      className="fixed left-0 top-0 h-full flex flex-col py-4 bg-white border-r border-border z-40 transition-[width] duration-300 overflow-hidden"
      role="navigation"
      aria-label="Huvudnavigation"
    >
      {/* ── Logo row ───────────────────────────────────────────── */}
      <div
        className={[
          'flex items-center mb-6 px-3',
          sidebarCollapsed ? 'justify-center' : 'justify-between',
        ].join(' ')}
      >
        <Link
          href="/plugga"
          aria-label="MathU – hem"
          className="flex items-center gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Image src="/mathu-logo.svg" alt="MathU logo" width={32} height={32} className="w-8 h-8" />
          {!sidebarCollapsed && (
            <span className="font-bold text-base text-text whitespace-nowrap">MathU</span>
          )}
        </Link>

      </div>

      {/* ── Main nav ───────────────────────────────────────────── */}
      <ul className="flex flex-col gap-0.5 flex-1 px-2" role="list">
        {NAV_ITEMS.map(({ key, href, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={key}>
              <Link
                href={href}
                aria-label={labels[key]}
                aria-current={active ? 'page' : undefined}
                title={sidebarCollapsed ? labels[key] : undefined}
                className={[
                  'flex items-center gap-3 p-3 rounded-2xl transition-all duration-150',
                  'focus-visible:outline-2 focus-visible:outline-primary',
                  sidebarCollapsed ? 'justify-center' : '',
                  active
                    ? 'bg-primary-light text-primary'
                    : 'text-text-muted hover:bg-surface hover:text-text',
                ].join(' ')}
              >
                <Icon filled={active} />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                    {labels[key]}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* ── Bottom section ─────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 px-2">
        {/* Settings */}
        <Link
          href="/settings"
          aria-label={t.nav.settings}
          aria-current={pathname === '/settings' ? 'page' : undefined}
          title={sidebarCollapsed ? t.nav.settings : undefined}
          className={[
            'flex items-center gap-3 p-3 rounded-2xl transition-all duration-150',
            'focus-visible:outline-2 focus-visible:outline-primary',
            sidebarCollapsed ? 'justify-center' : '',
            pathname === '/settings'
              ? 'bg-primary-light text-primary'
              : 'text-text-muted hover:bg-surface hover:text-text',
          ].join(' ')}
        >
          <GearIcon filled={pathname === '/settings'} />
          {!sidebarCollapsed && (
            <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
              {t.nav.settings}
            </span>
          )}
        </Link>

        {/* User avatar */}
        <div
          className={[
            'flex items-center gap-3 px-3 py-2',
            sidebarCollapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <div
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0"
            title={profile?.display_name?.trim() || 'Användare'}
          >
            {(profile?.display_name?.trim()?.[0] ?? 'U').toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm text-text-muted font-medium truncate">
              {profile?.display_name?.trim() || 'Användare'}
            </span>
          )}
        </div>

        <LogoutButton collapsed={sidebarCollapsed} />

        {/* Toggle button — always visible at bottom, same position */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandera sidopanel' : 'Dölj sidopanel'}
          className={[
            'flex items-center justify-center p-3 rounded-2xl text-text-muted',
            'hover:bg-surface hover:text-text transition-all duration-150',
            'focus-visible:outline-2 focus-visible:outline-primary mt-0.5',
            sidebarCollapsed ? '' : '',
          ].join(' ')}
        >
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>
    </nav>
  )
}

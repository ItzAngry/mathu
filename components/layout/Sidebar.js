'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useActionState } from 'react'
import { logout } from '@/lib/actions/auth'
import { useI18n } from '@/hooks/useI18n'

const NAV_ITEMS = [
  {
    key: 'plugga',
    href: '/plugga',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    key: 'fragor',
    href: '/fragor',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'prov',
    href: '/prov',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

function LogoutButton() {
  const [, action, pending] = useActionState(logout, null)
  return (
    <form action={action}>
      <button
        type="submit"
        disabled={pending}
        className="w-full flex flex-col items-center gap-1 p-3 rounded-2xl text-text-muted hover:bg-danger/10 hover:text-danger transition-all group focus-visible:outline-2 focus-visible:outline-danger"
        aria-label="Logga ut"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="text-xs font-medium">Logga ut</span>
      </button>
    </form>
  )
}

export default function Sidebar({ profile }) {
  const pathname = usePathname()
  const t = useI18n()

  const navLabels = {
    plugga: t.nav.plugga,
    fragor: t.nav.fragor,
    prov: t.nav.prov,
  }

  return (
    <nav
      className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-6 bg-white border-r border-border z-40"
      role="navigation"
      aria-label="Huvudnavigation"
    >
      {/* Logo */}
      <Link
        href="/plugga"
        className="mb-8 flex flex-col items-center group focus-visible:outline-2 focus-visible:outline-primary rounded-xl"
        aria-label="Mathu – hem"
      >
        <span
          className="text-3xl transition-transform group-hover:scale-110"
          role="img"
          aria-hidden="true"
        >
          🧮
        </span>
      </Link>

      {/* Main nav */}
      <ul className="flex flex-col gap-1 flex-1" role="list">
        {NAV_ITEMS.map(({ key, href, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <li key={key}>
              <Link
                href={href}
                aria-label={navLabels[key]}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary',
                  active
                    ? 'bg-primary-light text-primary'
                    : 'text-text-muted hover:bg-surface hover:text-text',
                ].join(' ')}
              >
                {icon(active)}
                <span className="text-xs font-medium">{navLabels[key]}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Bottom actions */}
      <div className="flex flex-col gap-1 items-center">
        {/* Settings */}
        <Link
          href="/settings"
          aria-label={t.nav.settings}
          aria-current={pathname === '/settings' ? 'page' : undefined}
          className={[
            'flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary',
            pathname === '/settings'
              ? 'bg-primary-light text-primary'
              : 'text-text-muted hover:bg-surface hover:text-text',
          ].join(' ')}
        >
          <svg viewBox="0 0 24 24" fill={pathname === '/settings' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium">{t.nav.settings}</span>
        </Link>

        {/* User avatar */}
        <div
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm mb-2 mt-1"
          aria-label={profile?.display_name ?? 'Användare'}
          title={profile?.display_name ?? 'Användare'}
        >
          {(profile?.display_name ?? 'U')[0].toUpperCase()}
        </div>

        <LogoutButton />
      </div>
    </nav>
  )
}

import { createClient } from '@/lib/supabaseServer'
import Link from 'next/link'

function StatCard({ label, value, color, children }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + '18' }}
      >
        <span style={{ color }}>{children}</span>
      </div>
      <div>
        <div className="text-2xl font-bold text-text tabular-nums">{value}</div>
        <div className="text-xs text-text-muted mt-0.5">{label}</div>
      </div>
    </div>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  )
}

function QuestionMarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  )
}

const QUICK_LINKS = [
  { href: '/admin/roadmap', label: 'Kursträd', desc: 'Redigera kapitel, noder och frågor' },
  { href: '/admin/questions', label: 'Frågor', desc: 'Lägg till och redigera frågor' },
  { href: '/admin/tests', label: 'Noder', desc: 'Hantera noder och delprov' },
  { href: '/admin/national', label: 'Nationella prov', desc: 'Skapa nationella prov med frågor' },
]

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: chaptersCount },
    { count: nodesCount },
    { count: questionsCount },
    { count: usersCount },
    { count: nationalCount },
  ] = await Promise.all([
    supabase.from('chapters').select('*', { count: 'exact', head: true }),
    supabase.from('nodes').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('nodes').select('*', { count: 'exact', head: true }).eq('is_national_exam', true),
  ])

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Översikt</h1>
        <p className="text-text-muted text-sm mt-1">Välkommen till adminpanelen för MathU</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <StatCard label="Kapitel" value={chaptersCount ?? 0} color="#2e3758">
          <BookIcon />
        </StatCard>
        <StatCard label="Noder" value={nodesCount ?? 0} color="#6e89a0">
          <MapIcon />
        </StatCard>
        <StatCard label="Frågor" value={questionsCount ?? 0} color="#2e3758">
          <QuestionMarkIcon />
        </StatCard>
        <StatCard label="Användare" value={usersCount ?? 0} color="#22c55e">
          <UsersIcon />
        </StatCard>
        <StatCard label="Nationella prov" value={nationalCount ?? 0} color="#f59e0b">
          <FlagIcon />
        </StatCard>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Snabbåtkomst</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_LINKS.map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-2xl border border-border p-5 flex items-center justify-between gap-4 hover:border-primary/40 hover:shadow-sm transition-all group focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div>
                <p className="font-semibold text-text group-hover:text-primary transition-colors">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
              <span className="text-text-muted group-hover:text-primary transition-colors shrink-0">
                <ArrowIcon />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

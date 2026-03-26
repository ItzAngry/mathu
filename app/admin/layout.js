import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Admin' }

export default async function AdminLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim())
  if (adminEmails.length > 0 && !adminEmails.includes(user.email ?? '')) {
    redirect('/plugga')
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Admin sidebar */}
      <nav
        className="fixed left-0 top-0 h-full w-56 bg-white border-r border-border flex flex-col py-6 px-4"
        aria-label="Admin navigation"
      >
        <div className="mb-8 px-2">
          <Link href="/plugga" className="text-xs text-text-muted hover:text-primary transition-colors">
            ← Tillbaka till kursen
          </Link>
          <h1 className="text-xl font-bold text-text mt-2">Admin</h1>
        </div>
        <ul className="flex flex-col gap-1" role="list">
          {[
            { href: '/admin', label: 'Översikt' },
            { href: '/admin/roadmap', label: 'Kursträd' },
            { href: '/admin/questions', label: 'Frågor' },
            { href: '/admin/tests', label: 'Prov & Noder' },
          ].map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-surface hover:text-text transition-all focus-visible:outline-2 focus-visible:outline-primary"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <main className="flex-1 ml-56 p-8">
        {children}
      </main>
    </div>
  )
}

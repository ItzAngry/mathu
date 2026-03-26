import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import AdminNav from './AdminNav'

export const metadata = { title: 'Admin – MathU' }

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
      {/* Sidebar */}
      <nav
        className="fixed left-0 top-0 h-full w-56 flex flex-col py-6 px-3"
        style={{ backgroundColor: '#2e3758' }}
        aria-label="Admin navigation"
      >
        <AdminNav />
      </nav>

      {/* Main content */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}

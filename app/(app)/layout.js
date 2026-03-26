import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import AppProviders from '@/components/providers/AppProviders'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Redirect to onboarding if not complete
  if (profile && !profile.onboarding_complete) {
    redirect('/onboarding')
  }

  return (
    <AppProviders initialProfile={profile}>
      <div className="flex min-h-screen">
        <Sidebar profile={profile} />
        <main
          id="main-content"
          className="flex-1 ml-20 min-h-screen bg-surface"
          tabIndex={-1}
        >
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-24 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
          >
            Hoppa till huvudinnehåll
          </a>
          {children}
        </main>
      </div>
    </AppProviders>
  )
}

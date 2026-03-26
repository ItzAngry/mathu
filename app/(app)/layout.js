import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import AppProviders from '@/components/providers/AppProviders'
import AppShell from '@/components/layout/AppShell'

export default async function AppLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile && !profile.onboarding_complete) {
    redirect('/onboarding')
  }

  // Merge auth email into profile so UI can display it
  const profileWithEmail = profile ? { ...profile, email: profile.email ?? user.email } : null

  return (
    <AppProviders initialProfile={profileWithEmail}>
      <AppShell profile={profileWithEmail}>
        {children}
      </AppShell>
    </AppProviders>
  )
}

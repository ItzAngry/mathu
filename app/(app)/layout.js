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

  return (
    <AppProviders initialProfile={profile}>
      <AppShell profile={profile}>
        {children}
      </AppShell>
    </AppProviders>
  )
}

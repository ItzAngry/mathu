'use server'

import { createClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

export async function login(prevState, formData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/plugga')
}

export async function register(prevState, formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')
  const name = formData.get('name')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user && !data.session) {
    return { message: 'Kontrollera din e-post för bekräftelselänk.' }
  }

  redirect('/onboarding')
}

export async function loginWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback?next=/plugga`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register, loginWithGoogle } from '@/lib/actions/auth'
import Button from '@/components/ui/Button'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, null)

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #574ECC 60%, #43C6AC 100%)' }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2 border-white"
              style={{
                width: `${(i + 1) * 100}px`,
                height: `${(i + 1) * 100}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold mb-3">MathU</h1>
          <p className="text-xl text-white/80 max-w-xs">
            Börja din matematikresa idag – gratis och anpassad för dig.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">MathU</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
            <h2 className="text-2xl font-bold text-text mb-1">Skapa ditt konto</h2>
            <p className="text-text-muted mb-8 text-sm">
              Börja din matematikresa idag
            </p>

            {/* Google sign-up */}
            <form action={loginWithGoogle}>
              <Button type="submit" variant="google" size="lg" fullWidth className="mb-4">
                <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.16C6.51 42.62 14.62 48 24 48z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.16C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#EB4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.16C12.43 13.72 17.74 9.5 24 9.5z" />
                </svg>
                Fortsätt med Google
              </Button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <hr className="flex-1 border-border" />
              <span className="text-xs text-text-muted font-medium">eller</span>
              <hr className="flex-1 border-border" />
            </div>

            <form action={action} noValidate>
              {state?.error && (
                <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                  {state.error}
                </div>
              )}
              {state?.message && (
                <div role="status" className="mb-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
                  {state.message}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text mb-1.5">
                    Namn
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Ditt namn"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted text-sm
                               focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">
                    E-post
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="din@email.se"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted text-sm
                               focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-text mb-1.5">
                    Lösenord
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Minst 8 tecken"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted text-sm
                               focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth loading={pending} className="mt-6">
                Skapa konto
              </Button>
            </form>

            <p className="text-center text-sm text-text-muted mt-6">
              Har du redan ett konto?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Logga in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { login, loginWithGoogle } from '@/lib/actions/auth'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-surface">
      {/* Left — branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1e2847 0%, #2e3758 55%, #3a4f7a 100%)' }}
        aria-hidden="true"
      >
        {/* Subtle grid decoration */}
        <div className="absolute inset-0 opacity-[0.06]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="math-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#math-grid)" />
          </svg>
        </div>

        {/* Floating math symbols */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { sym: 'f(x)', x: '12%', y: '18%', size: '1.1rem', rot: '-12deg' },
            { sym: 'π', x: '80%', y: '14%', size: '1.8rem', rot: '8deg' },
            { sym: '∫', x: '88%', y: '55%', size: '2rem', rot: '0deg' },
            { sym: '√', x: '8%', y: '72%', size: '1.6rem', rot: '6deg' },
            { sym: 'Σ', x: '75%', y: '80%', size: '1.5rem', rot: '-8deg' },
            { sym: '∞', x: '22%', y: '88%', size: '1.4rem', rot: '4deg' },
          ].map(({ sym, x, y, size, rot }, i) => (
            <span
              key={i}
              className="absolute font-mono font-bold text-white/10 select-none"
              style={{ left: x, top: y, fontSize: size, transform: `rotate(${rot})` }}
            >
              {sym}
            </span>
          ))}
        </div>

        <div className="relative z-10 text-center">
          <Image src="/mathu-logo.svg" alt="MathU mascot" width={120} height={108} className="mb-6 mx-auto drop-shadow-lg" />
          <h1 className="text-4xl font-bold mb-3 tracking-tight">MathU</h1>
          <p className="text-lg text-white/70 max-w-xs leading-relaxed">
            Din personliga matematikresa – från nybörjare till mästare.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Image src="/mathu-logo.svg" alt="MathU mascot" width={100} height={100} className="mb-3 mx-auto" />
            <h1 className="text-3xl font-bold text-primary">MathU</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-border p-8">
            <h2 className="text-2xl font-bold text-text mb-1">Välkommen tillbaka!</h2>
            <p className="text-text-muted mb-8 text-sm">
              Logga in för att fortsätta din matematikresa
            </p>

            {/* Google sign-in */}
            <form action={loginWithGoogle}>
              <Button
                type="submit"
                variant="google"
                size="lg"
                fullWidth
                className="mb-4"
              >
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

            {/* Email/password form */}
            <form action={action} noValidate>
              {state?.error && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3"
                >
                  {state.error}
                </div>
              )}

              <div className="space-y-4">
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
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    aria-describedby={state?.error ? 'login-error' : undefined}
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
                    autoComplete="current-password"
                    required
                    placeholder="Ditt lösenord"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={pending}
                className="mt-6"
              >
                Logga in
              </Button>
            </form>

            <p className="text-center text-sm text-text-muted mt-6">
              Har du inget konto?{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Skapa konto
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

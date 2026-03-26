'use client'

import { useActionState, useState } from 'react'
import { saveGradeGoal } from '@/lib/actions/onboarding'
import Button from '@/components/ui/Button'

const GRADES = [
  { value: 'E', label: 'Betyg E', desc: 'Grundläggande kunskaper', color: '#6B7280', emoji: '' },
  { value: 'C', label: 'Betyg C', desc: 'Goda kunskaper', color: '#8B5CF6', emoji: '' },
  { value: 'A', label: 'Betyg A', desc: 'Utmärkta kunskaper', color: '#10B981', emoji: '' },
]

export default function OnboardingPage() {
  const [selected, setSelected] = useState('C')
  const [state, action, pending] = useActionState(saveGradeGoal, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-white to-purple-50 p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-text mb-2">Välkommen till MathU!</h1>
          <p className="text-text-muted text-lg">Vilket betyg siktar du på i Matematik 1b?</p>
          <p className="text-text-muted text-sm mt-2">
            Vi anpassar uppgifterna efter ditt mål för att hjälpa dig nå dit.
          </p>
        </div>

        <form action={action}>
          <input type="hidden" name="grade_goal" value={selected} />

          {/* Grade selection */}
          <div
            className="space-y-3 mb-8"
            role="radiogroup"
            aria-label="Välj betygsmål"
          >
            {GRADES.map((grade) => (
              <button
                key={grade.value}
                type="button"
                role="radio"
                aria-checked={selected === grade.value}
                onClick={() => setSelected(grade.value)}
                className={[
                  'w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200',
                  'focus-visible:outline-2 focus-visible:outline-primary',
                  selected === grade.value
                    ? 'border-primary bg-primary-light shadow-md scale-[1.01]'
                    : 'border-border bg-white hover:border-primary/40 hover:bg-surface',
                ].join(' ')}
              >
                <div className="flex-1">
                  <div className="font-semibold text-text">{grade.label}</div>
                  <div className="text-sm text-text-muted">{grade.desc}</div>
                </div>
                <div
                  className={[
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                    selected === grade.value
                      ? 'border-primary bg-primary'
                      : 'border-border',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {selected === grade.value && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {state?.error && (
            <div role="alert" className="mb-4 text-red-600 text-sm text-center">
              {state.error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            loading={pending}
            className="shadow-lg shadow-primary/25"
          >
            Kom igång!
          </Button>

          <p className="text-center text-xs text-text-muted mt-4">
            Du kan ändra detta senare i inställningar.
          </p>
        </form>
      </div>
    </div>
  )
}

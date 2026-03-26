'use client'

import { useActionState, useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useI18n } from '@/hooks/useI18n'
import Button from '@/components/ui/Button'
import { saveSettings } from '@/lib/actions/settings'

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const t = useI18n()
  const [saved, setSaved] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    const formData = new FormData(e.target)
    await saveSettings(formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-border px-6 py-5">
        <h1 className="text-2xl font-bold text-text">{t.settings.title}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <form onSubmit={handleSave}>
          {/* Appearance */}
          <section className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold text-text mb-4">{t.settings.appearance}</h2>

            {/* Language */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-text mb-2">
                {t.settings.language}
              </label>
              <div className="flex gap-3" role="radiogroup" aria-label="Välj språk">
                {['sv', 'en'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    role="radio"
                    aria-checked={settings.language === lang}
                    onClick={() => updateSettings({ language: lang })}
                    className={[
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-primary',
                      settings.language === lang
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-border text-text-muted hover:border-primary/40',
                    ].join(' ')}
                  >
                    {lang === 'sv' ? '🇸🇪 Svenska' : '🇬🇧 English'}
                  </button>
                ))}
              </div>
              <input type="hidden" name="language" value={settings.language} />
            </div>

            {/* Font */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-text mb-2">
                {t.settings.font}
              </label>
              <div className="flex flex-col gap-3" role="radiogroup" aria-label="Välj typsnitt">
                {[
                  { value: 'default', label: t.settings.defaultFont, sample: 'Abc 123' },
                  { value: 'dyslexic', label: t.settings.dyslexicFont, sample: 'Abc 123', fontFamily: 'OpenDyslexic' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={settings.font === opt.value}
                    onClick={() => updateSettings({ font: opt.value })}
                    className={[
                      'flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all focus-visible:outline-2 focus-visible:outline-primary text-left',
                      settings.font === opt.value
                        ? 'border-primary bg-primary-light'
                        : 'border-border hover:border-primary/40',
                    ].join(' ')}
                  >
                    <span className="font-medium text-text">{opt.label}</span>
                    <span
                      className="text-text-muted text-base"
                      style={opt.fontFamily ? { fontFamily: opt.fontFamily } : {}}
                      aria-hidden="true"
                    >
                      {opt.sample}
                    </span>
                  </button>
                ))}
              </div>
              <input type="hidden" name="font_preference" value={settings.font} />
            </div>

            {/* Dark mode */}
            <div className="mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">{t.settings.darkMode}</p>
                  <p className="text-xs text-text-muted mt-0.5">{t.settings.darkModeDescription}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.darkMode}
                  onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                  className={[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                    settings.darkMode ? 'bg-primary' : 'bg-border',
                  ].join(' ')}
                  aria-label={t.settings.darkMode}
                >
                  <span
                    className={[
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                      settings.darkMode ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')}
                  />
                </button>
              </div>
              <input type="hidden" name="dark_mode" value={String(settings.darkMode)} />
            </div>

            {/* TTS */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text">{t.settings.tts}</p>
                  <p className="text-xs text-text-muted mt-0.5">{t.settings.ttsDescription}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.tts}
                  onClick={() => updateSettings({ tts: !settings.tts })}
                  className={[
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                    settings.tts ? 'bg-primary' : 'bg-border',
                  ].join(' ')}
                  aria-label={t.settings.tts}
                >
                  <span
                    className={[
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                      settings.tts ? 'translate-x-6' : 'translate-x-1',
                    ].join(' ')}
                  />
                </button>
              </div>
              <input type="hidden" name="tts_enabled" value={String(settings.tts)} />
            </div>
          </section>

          {/* Grade goal */}
          <section className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold text-text mb-4">{t.settings.gradeGoal}</h2>
            <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Välj betygsmål">
              {['E', 'D', 'C', 'B', 'A'].map((g) => (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={settings.gradeGoal === g}
                  onClick={() => updateSettings({ gradeGoal: g })}
                  className={[
                    'w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-primary',
                    settings.gradeGoal === g
                      ? 'border-primary bg-primary text-white'
                      : 'border-border text-text-muted hover:border-primary/40',
                  ].join(' ')}
                  aria-label={`Betygsmål ${g}`}
                >
                  {g}
                </button>
              ))}
            </div>
            <input type="hidden" name="grade_goal" value={settings.gradeGoal} />
          </section>

          {/* AI Settings */}
          <section className="bg-white rounded-2xl border border-border p-6 mb-6">
            <h2 className="text-lg font-semibold text-text mb-4">{t.settings.aiSettings}</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="mathew-url" className="block text-sm font-medium text-text mb-1.5">
                  {t.settings.mathewUrl}
                </label>
                <input
                  id="mathew-url"
                  name="mathew_api_url"
                  type="text"
                  defaultValue={settings.mathewUrl}
                  placeholder="http://192.168.x.x:11434"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label htmlFor="qwen-url" className="block text-sm font-medium text-text mb-1.5">
                  {t.settings.qwenUrl}
                </label>
                <input
                  id="qwen-url"
                  name="qwen_api_url"
                  type="text"
                  defaultValue={settings.qwenUrl}
                  placeholder="http://192.168.x.x:11435"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>
          </section>

          <Button type="submit" variant="primary" size="lg" fullWidth>
            {saved ? '✓ Sparad!' : t.settings.save}
          </Button>
        </form>
      </div>
    </div>
  )
}

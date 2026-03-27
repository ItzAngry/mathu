'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import QuestionSession from '@/components/questions/QuestionSession'

// ─── Icons ────────────────────────────────────────────────────────────────────

function ClipboardIcon({ color }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6" style={{ color }} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  )
}

// ─── Grade logic ──────────────────────────────────────────────────────────────

const GRADE_THRESHOLDS = [
  { grade: 'A', min: 80, label: 'Mycket väl godkänt', color: '#22c55e', bg: '#dcfce7', text: '#15803d' },
  { grade: 'C', min: 55, label: 'Väl godkänt',        color: '#2e3758', bg: '#eef1f2', text: '#2e3758' },
  { grade: 'E', min: 20, label: 'Godkänt',             color: '#6e89a0', bg: '#f0f4f6', text: '#4a6880' },
  { grade: 'F', min: 0,  label: 'Ej godkänt',          color: '#ef4444', bg: '#fee2e2', text: '#dc2626' },
]

function estimateGrade(avgScore) {
  return GRADE_THRESHOLDS.find((t) => avgScore >= t.min) ?? GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1]
}

// ─── GradeEstimate component ──────────────────────────────────────────────────

function GradeEstimate({ testNodes, progressMap }) {
  if (testNodes.length === 0) return null

  const completedNodes = testNodes.filter((n) => progressMap[n.id]?.completed)
  if (completedNodes.length === 0) return null

  const avgScore = completedNodes.reduce((sum, n) => sum + (progressMap[n.id]?.score ?? 0), 0) / completedNodes.length
  const allComplete = completedNodes.length === testNodes.length
  const grade = estimateGrade(avgScore)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-border overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <h2 className="font-semibold text-text">Estimerat betyg</h2>
        <span className="text-xs text-text-muted">Baserat på delprov</span>
      </div>

      <div className="px-5 py-5">
        {/* Grade badge + label */}
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ backgroundColor: grade.bg, color: grade.text }}
            aria-label={`Estimerat betyg: ${grade.grade}`}
          >
            {grade.grade}
          </div>
          <div>
            <p className="font-semibold text-text">{grade.label}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {Math.round(avgScore)}% genomsnitt · {completedNodes.length} av {testNodes.length} delprov klara
            </p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-4">
          <div className="relative h-3 bg-surface-2 rounded-full overflow-hidden">
            {/* Grade threshold markers */}
            {GRADE_THRESHOLDS.slice(0, -1).map((t) => (
              <div
                key={t.grade}
                className="absolute top-0 bottom-0 w-px bg-border/70"
                style={{ left: `${t.min}%` }}
                aria-hidden="true"
              />
            ))}
            {/* Fill */}
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: grade.color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(avgScore)}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          {/* Threshold labels */}
          <div className="relative h-5 mt-1">
            {GRADE_THRESHOLDS.slice(0, -1).map((t) => (
              <span
                key={t.grade}
                className="absolute text-[10px] text-text-muted -translate-x-1/2"
                style={{ left: `${t.min}%` }}
                aria-hidden="true"
              >
                {t.grade}
              </span>
            ))}
          </div>
        </div>

        {/* Per-test mini bars */}
        <div className="flex flex-col gap-2 mb-4">
          {testNodes.map((n) => {
            const p = progressMap[n.id]
            const s = p?.score ?? null
            const g = s !== null ? estimateGrade(s) : null
            return (
              <div key={n.id} className="flex items-center gap-3 text-xs">
                <span className="text-text-muted truncate w-40 shrink-0">{n.title}</span>
                {s !== null ? (
                  <>
                    <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.round(s)}%`, backgroundColor: g.color }}
                      />
                    </div>
                    <span className="text-text-muted tabular-nums w-8 text-right">{Math.round(s)}%</span>
                    <span
                      className="w-5 text-center font-semibold"
                      style={{ color: g.text }}
                    >
                      {g.grade}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex-1 h-1.5 bg-surface-2 rounded-full" />
                    <span className="text-text-muted w-8 text-right">—</span>
                    <span className="w-5" />
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Caveat when incomplete */}
        {!allComplete && (
          <div className="flex items-start gap-2 bg-surface rounded-xl px-3 py-2.5 text-xs text-text-muted">
            <InfoIcon />
            <p>
              Ditt betyg kan variera eftersom du inte är klar med alla delprov än. Resultatet uppdateras allt eftersom du genomför fler prov.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  )
}

// ─── TestCard ─────────────────────────────────────────────────────────────────

function TestCard({ node, progress, index, onStart }) {
  const chapter = node.chapters

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: (chapter?.color ?? '#2e3758') + '22' }}
        aria-hidden="true"
      >
        <ClipboardIcon color={chapter?.color ?? '#2e3758'} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-text">{node.title}</p>
        <p className="text-xs text-text-muted mt-0.5">
          {chapter?.title}
          {node.exam_year && <span className="ml-2 font-medium">{node.exam_year}</span>}
          {progress?.completed && (
            <span className="ml-2 text-success font-medium inline-flex items-center gap-0.5">
              <CheckIcon />
              {Math.round(progress.score ?? 0)}%
            </span>
          )}
        </p>
      </div>
      <button
        onClick={() => onStart(node)}
        className={[
          'px-4 py-2 rounded-xl text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-primary',
          progress?.completed
            ? 'bg-surface-2 text-text-muted hover:bg-border'
            : 'bg-primary text-white hover:bg-primary-dark shadow-sm',
        ].join(' ')}
        aria-label={`${progress?.completed ? 'Gör om' : 'Starta'} ${node.title}`}
      >
        {progress?.completed ? 'Gör om' : 'Starta'}
      </button>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProvClient({ testNodes, nationalNodes = [], progressMap }) {
  const [activeTest, setActiveTest] = useState(null)

  if (activeTest) {
    return <QuestionSession node={activeTest} onClose={() => setActiveTest(null)} />
  }

  // Group national exams by year
  const byYear = {}
  for (const node of nationalNodes) {
    const yr = node.exam_year ?? 'Okänt år'
    if (!byYear[yr]) byYear[yr] = []
    byYear[yr].push(node)
  }
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-border px-6 py-5">
        <h1 className="text-2xl font-bold text-text">Prov</h1>
        <p className="text-text-muted text-sm mt-0.5">Delprov och nationella prov</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">

        {/* Grade estimate — only shown when at least one delprov is completed */}
        <GradeEstimate testNodes={testNodes} progressMap={progressMap} />

        {/* Delprov */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Delprov</h2>
          {testNodes.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <p>Inga delprov tillgängliga ännu.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {testNodes.map((node, i) => (
                <TestCard
                  key={node.id}
                  node={node}
                  progress={progressMap[node.id]}
                  index={i}
                  onStart={setActiveTest}
                />
              ))}
            </div>
          )}
        </section>

        {/* Nationella prov */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-1">Nationella prov – Ma1b</h2>
          <p className="text-sm text-text-muted mb-4">Träna på frisläppta nationella prov från tidigare år.</p>

          {nationalNodes.length === 0 ? (
            <div className="text-center py-12 text-text-muted rounded-2xl border border-border bg-surface">
              <p>Inga nationella prov tillagda ännu.</p>
              <p className="text-xs mt-1">Admin kan lägga till prov via adminpanelen.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {years.map((yr) => (
                <div key={yr}>
                  <p className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">{yr}</p>
                  <div className="flex flex-col gap-3">
                    {byYear[yr].map((node, i) => (
                      <TestCard
                        key={node.id}
                        node={node}
                        progress={progressMap[node.id]}
                        index={i}
                        onStart={setActiveTest}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import QuestionSession from '@/components/questions/QuestionSession'

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

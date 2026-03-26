'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import QuestionSession from '@/components/questions/QuestionSession'
import MathewChatbot from '@/components/chat/MathewChatbot'

export default function ProvClient({ testNodes, progressMap }) {
  const [activeTest, setActiveTest] = useState(null)

  if (activeTest) {
    return <QuestionSession node={activeTest} onClose={() => setActiveTest(null)} />
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-border px-6 py-5">
        <h1 className="text-2xl font-bold text-text">Prov</h1>
        <p className="text-text-muted text-sm mt-0.5">Delprov för varje kapitel</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {testNodes.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <div className="text-5xl mb-4">📝</div>
            <p>Inga prov tillgängliga ännu.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {testNodes.map((node, i) => {
              const progress = progressMap[node.id]
              const chapter = node.chapters

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: (chapter?.color ?? '#6C63FF') + '22' }}
                    aria-hidden="true"
                  >
                    🏆
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text">{node.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {chapter?.title}
                      {progress?.completed && (
                        <span className="ml-2 text-success font-medium">
                          ✓ {Math.round(progress.score ?? 0)}%
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTest(node)}
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
            })}
          </div>
        )}
      </div>

      <MathewChatbot />
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'

export default function ProgressBar({ completed = 0, total = 1, label }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="px-6 py-4 bg-white border-b border-border" role="region" aria-label="Din framgång">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text">
            {label ?? 'Din framgång'}
          </span>
          <span className="text-sm font-bold text-success" aria-live="polite">
            {pct}%
          </span>
        </div>
        <div
          className="h-3 bg-surface-2 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% klart`}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-success to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
        <p className="text-xs text-text-muted mt-1">
          {completed} av {total} avsnitt klart
        </p>
      </div>
    </div>
  )
}

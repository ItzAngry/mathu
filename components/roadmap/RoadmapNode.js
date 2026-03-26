'use client'

import { motion } from 'framer-motion'

const SIZE_MAP = {
  small: { outer: 56, inner: 44, fontSize: '1.25rem' },
  medium: { outer: 72, inner: 58, fontSize: '1.5rem' },
  large: { outer: 88, inner: 72, fontSize: '1.75rem' },
}

const TYPE_ICON = {
  intro: '📖',
  practice: '✏️',
  test: '🏆',
}

const TYPE_LABEL = {
  intro: 'Läsavsnitt',
  practice: 'Övningar',
  test: 'Delprov',
}

function NodeBadge({ status }) {
  if (status === 'completed') {
    return (
      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center shadow-md z-10" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="white" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }
  if (status === 'locked') {
    return (
      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-border flex items-center justify-center shadow-sm z-10" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="#9CA3AF" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }
  return null
}

export default function RoadmapNode({ node, progress, isActive, onClick }) {
  const { outer, inner, fontSize } = SIZE_MAP[node.size] ?? SIZE_MAP.medium

  const status = (() => {
    if (progress?.completed) return 'completed'
    if (!isActive) return 'locked'
    if ((progress?.attempts ?? 0) > 0) return 'in-progress'
    return 'available'
  })()

  const isClickable = status !== 'locked'

  const outerColor = {
    completed: '#22C55E',
    'in-progress': '#6C63FF',
    available: '#6C63FF',
    locked: '#E5E7EB',
  }[status]

  const innerColor = {
    completed: '#DCFCE7',
    'in-progress': '#EEF0FF',
    available: '#EEF0FF',
    locked: '#F9FAFB',
  }[status]

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        aria-label={`${node.title} — ${TYPE_LABEL[node.type]} — ${status === 'completed' ? 'Klart' : status === 'locked' ? 'Låst' : status === 'in-progress' ? 'Pågående' : 'Tillgänglig'}`}
        aria-disabled={!isClickable}
        className={[
          'relative rounded-full flex items-center justify-center transition-all focus-visible:outline-2 focus-visible:outline-primary',
          isClickable ? 'cursor-pointer' : 'cursor-not-allowed',
          status === 'available' && 'node-pulse',
        ].filter(Boolean).join(' ')}
        style={{
          width: outer,
          height: outer,
          backgroundColor: outerColor,
          boxShadow: isClickable ? `0 4px 14px ${outerColor}55` : 'none',
        }}
        whileHover={isClickable ? { scale: 1.1, y: -3 } : {}}
        whileTap={isClickable ? { scale: 0.95 } : {}}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Inner circle */}
        <div
          className="rounded-full flex items-center justify-center"
          style={{ width: inner, height: inner, backgroundColor: innerColor }}
        >
          <span style={{ fontSize }} role="img" aria-hidden="true">
            {TYPE_ICON[node.type]}
          </span>
        </div>

        {/* Badge */}
        <NodeBadge status={status} />
      </motion.button>

      {/* Label */}
      <div className="text-center max-w-[100px]">
        <p className="text-xs font-semibold text-text leading-tight">{node.title}</p>
        <p className="text-xs text-text-muted mt-0.5">{TYPE_LABEL[node.type]}</p>
      </div>
    </div>
  )
}

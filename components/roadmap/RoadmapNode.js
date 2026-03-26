'use client'

import { motion } from 'framer-motion'

const SIZE_MAP = {
  small: { outer: 56, inner: 44, fontSize: '1.25rem' },
  medium: { outer: 72, inner: 58, fontSize: '1.5rem' },
  large: { outer: 88, inner: 72, fontSize: '1.75rem' },
}

// Inline SVG icons for node types (no emoji)
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: '50%', height: '50%' }}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
)

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: '50%', height: '50%' }}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
)

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: '50%', height: '50%' }}>
    <polyline points="8 21 12 17 16 21" />
    <line x1="12" y1="17" x2="12" y2="12" />
    <path d="M7 4H4a2 2 0 0 0-2 2v3a4 4 0 0 0 4 4h1" />
    <path d="M17 4h3a2 2 0 0 1 2 2v3a4 4 0 0 1-4 4h-1" />
    <rect x="7" y="2" width="10" height="10" rx="2" />
  </svg>
)

const TYPE_ICON = {
  intro: BookIcon,
  practice: PencilIcon,
  test: TrophyIcon,
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
    completed: '#22c55e',
    'in-progress': '#2e3758',
    available: '#2e3758',
    locked: '#adb8c0',
  }[status]

  const innerColor = {
    completed: '#dcfce7',
    'in-progress': '#eef1f2',
    available: '#eef1f2',
    locked: '#eef1f2',
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
          className={[
            'rounded-full flex items-center justify-center',
            status === 'locked' ? 'text-text-muted/60' : status === 'completed' ? 'text-success' : 'text-primary',
          ].join(' ')}
          style={{ width: inner, height: inner, backgroundColor: innerColor }}
        >
          {(() => { const Icon = TYPE_ICON[node.type]; return Icon ? <Icon /> : null })()}
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

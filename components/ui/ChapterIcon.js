// Math-themed SVG icons for chapters — cycles by order_index
const ICONS = [
  // Sigma / Algebra
  ({ style, className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style} className={className}>
      <path d="M17 4H7L13 12L7 20H17" />
    </svg>
  ),
  // Graph / Function
  ({ style, className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={style} className={className}>
      <path d="M3 20C7 18 7 6 12 6C17 6 17 18 21 20" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  ),
  // Triangle / Geometry
  ({ style, className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style} className={className}>
      <path d="M12 4L21 20H3L12 4Z" />
    </svg>
  ),
  // Integral / Calculus
  ({ style, className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={style} className={className}>
      <path d="M9 4C8 4 7 5 7 6V18C7 19 8 20 9 20" />
      <path d="M15 4C16 4 17 5 17 6V18C17 19 16 20 15 20" />
    </svg>
  ),
  // Bar chart / Statistics
  ({ style, className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style} className={className}>
      <line x1="3" y1="20" x2="21" y2="20" />
      <rect x="4" y="13" width="4" height="7" rx="1" />
      <rect x="10" y="8" width="4" height="12" rx="1" />
      <rect x="16" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  // Circle / Trigonometry
  ({ style, className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={style} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3V12L17 17" />
    </svg>
  ),
]

export default function ChapterIcon({ chapter, style, className }) {
  const idx = ((chapter.order_index ?? 1) - 1) % ICONS.length
  const Icon = ICONS[idx]
  return <Icon style={style} className={className} />
}

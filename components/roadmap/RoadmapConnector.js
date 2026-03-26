'use client'

// viewBox coordinate system: 600 wide, 72 tall
// Horizontal positions match the zigzag pl-10/pr-10 offsets
const POS = { left: 80, center: 300, right: 520 }
const VB_W = 600
const VB_H = 72

export default function RoadmapConnector({
  completed = false,
  topPos = 'center',    // position of the node visually above this connector
  bottomPos = 'center', // position of the node visually below this connector
}) {
  const x1 = POS[topPos]    ?? 300  // SVG top  → visual top  (higher on the mountain)
  const x2 = POS[bottomPos] ?? 300  // SVG bottom → visual bottom (lower on the mountain)

  const color = completed ? '#22C55E' : '#D1D5DB'

  // Cubic bezier: vertical control points create a smooth S-curve
  // when nodes are at different horizontal positions
  const d = `M ${x1} 0 C ${x1} ${VB_H * 0.45} ${x2} ${VB_H * 0.55} ${x2} ${VB_H}`

  return (
    <div
      className="relative w-full overflow-visible"
      style={{ height: VB_H }}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 w-full h-full overflow-visible"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Shadow / glow for completed paths */}
        {completed && (
          <path
            d={d}
            stroke="#22C55E"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.15"
          />
        )}

        {/* Main path — dashed when locked, solid when done */}
        <path
          d={d}
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={completed ? undefined : '10 7'}
          style={{ transition: 'stroke 0.5s ease' }}
        />

        {/* Small dot at the top end (where the above node sits) */}
        <circle cx={x1} cy={2} r="4" fill={color} style={{ transition: 'fill 0.5s ease' }} />
        {/* Small dot at the bottom end (where the below node sits) */}
        <circle cx={x2} cy={VB_H - 2} r="4" fill={color} style={{ transition: 'fill 0.5s ease' }} />
      </svg>
    </div>
  )
}

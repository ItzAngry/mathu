'use client'

export default function RoadmapConnector({ completed = false, direction = 'down' }) {
  const isHorizontal = direction === 'right' || direction === 'left'

  if (isHorizontal) {
    return (
      <div
        className="flex items-center"
        style={{ width: 40, height: 4 }}
        aria-hidden="true"
      >
        <div
          className="h-1 w-full rounded-full transition-all duration-500"
          style={{ backgroundColor: completed ? '#22C55E' : '#E5E7EB' }}
        />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center"
      style={{ height: 32, width: 4 }}
      aria-hidden="true"
    >
      <div
        className="w-1 h-full rounded-full transition-all duration-500"
        style={{ backgroundColor: completed ? '#22C55E' : '#E5E7EB' }}
      />
    </div>
  )
}

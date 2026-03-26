'use client'

import { useEffect } from 'react'

// Scrolls the window to the bottom on mount so the user starts
// at the beginning of the reversed (bottom-to-top) roadmap.
export default function RoadmapScroller() {
  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
  }, [])
  return null
}

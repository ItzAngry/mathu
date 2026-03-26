'use client'

import { useEffect, useRef } from 'react'

export default function GeoGebraEmbed({ materialId, height = 300 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!materialId || !window) return

    const script = document.createElement('script')
    script.src = 'https://www.geogebra.org/apps/deployggb.js'
    script.async = true
    script.onload = () => {
      if (!window.GGBApplet || !containerRef.current) return
      const params = {
        material_id: materialId,
        width: containerRef.current.offsetWidth || 560,
        height,
        showMenuBar: false,
        showToolBar: false,
        showAlgebraInput: false,
        enableLabelDrags: false,
        enableShiftDragZoom: true,
        enableRightClick: false,
        showResetIcon: true,
        useBrowserForJS: false,
      }
      const applet = new window.GGBApplet(params, true)
      applet.inject(containerRef.current)
    }
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [materialId, height])

  if (!materialId) return null

  return (
    <div
      className="mb-4 rounded-2xl overflow-hidden border border-border bg-white"
      aria-label="GeoGebra interaktiv matematik"
    >
      <div ref={containerRef} style={{ height }} />
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

const DEPLOY_URL = 'https://www.geogebra.org/apps/deployggb.js'

let deployLoadPromise = null

function loadDeployGgb() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.GGBApplet) return Promise.resolve()

  if (!deployLoadPromise) {
    deployLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${DEPLOY_URL}"]`)
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true })
        existing.addEventListener('error', () => reject(new Error('GeoGebra script')), { once: true })
        return
      }
      const script = document.createElement('script')
      script.src = DEPLOY_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('GeoGebra script failed to load'))
      document.head.appendChild(script)
    })
  }

  return deployLoadPromise
}

function syncAppletDimensions(applet, wrapEl) {
  if (!applet || !wrapEl) return
  const w = Math.max(280, Math.round(wrapEl.clientWidth))
  const h = Math.max(220, Math.round(wrapEl.clientHeight))
  try {
    if (typeof applet.setWidth === 'function') applet.setWidth(w)
    if (typeof applet.setHeight === 'function') applet.setHeight(h)
  } catch {
    /* ignore */
  }
}

/**
 * Tom GeoGebra grafritare — fyller förälderns höjd (t.ex. resize-y-panel).
 */
export default function GeoGebraEmbed({ appName = 'graphing', className = '' }) {
  const plotWrapRef = useRef(null)
  const containerRef = useRef(null)
  const appletRef = useRef(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const wrap = plotWrapRef.current
    const mount = containerRef.current
    if (!wrap || !mount) return

    let cancelled = false

    function destroyApplet() {
      try {
        const a = appletRef.current
        if (a && typeof a.remove === 'function') a.remove()
      } catch {
        /* ignore */
      }
      appletRef.current = null
      mount.innerHTML = ''
    }

    setStatus('loading')
    destroyApplet()

    function injectWhenLaidOut() {
      if (cancelled || !plotWrapRef.current || !containerRef.current || !window.GGBApplet) return

      const w = Math.max(280, Math.round(plotWrapRef.current.clientWidth))
      const h = Math.max(260, Math.round(plotWrapRef.current.clientHeight))

      const params = {
        appName,
        width: w,
        height: h,
        showMenuBar: false,
        showToolBar: true,
        showAlgebraInput: true,
        enableLabelDrags: true,
        enableShiftDragZoom: true,
        enableRightClick: false,
        showResetIcon: true,
        useBrowserForJS: false,
        language: 'sv',
      }

      const applet = new window.GGBApplet(params, true)
      appletRef.current = applet
      applet.inject(containerRef.current)

      if (!cancelled) setStatus('ready')
    }

    loadDeployGgb()
      .then(() => {
        requestAnimationFrame(() => requestAnimationFrame(injectWhenLaidOut))
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    const ro = new ResizeObserver(() => {
      if (appletRef.current && plotWrapRef.current) {
        syncAppletDimensions(appletRef.current, plotWrapRef.current)
      }
    })
    ro.observe(wrap)

    return () => {
      cancelled = true
      ro.disconnect()
      destroyApplet()
    }
  }, [appName])

  return (
    <div
      className={`rounded-2xl overflow-hidden border border-border bg-white shadow-inner flex flex-col min-h-0 h-full ${className}`}
      aria-label="GeoGebra grafritare"
    >
      <div className="px-3 py-2 bg-surface-2/80 border-b border-border shrink-0">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">GeoGebra</span>
        <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
          Tom arbetsyta — dra i nedre högra hörnet för att ändra höjd (som i ett textfält).
        </p>
      </div>
      {status === 'error' ? (
        <p className="text-sm text-danger px-4 py-8 text-center shrink-0">
          Kunde inte ladda GeoGebra. Kontrollera din uppkoppling.
        </p>
      ) : (
        <div ref={plotWrapRef} className="relative flex-1 min-h-[280px] w-full min-w-0 bg-white">
          {status === 'loading' && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center text-text-muted text-sm gap-2 bg-white/90"
              aria-busy="true"
            >
              <svg className="animate-spin h-5 w-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Laddar GeoGebra…
            </div>
          )}
          <div ref={containerRef} className="absolute inset-0 w-full h-full min-h-[240px]" />
        </div>
      )}
    </div>
  )
}

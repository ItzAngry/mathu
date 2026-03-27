'use client'

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

const CanvasInput = forwardRef(function CanvasInput(
  { width = 600, height = 250, onHasContent, fillContainer = false },
  ref
) {
  const canvasRef = useRef(null)
  const sizeContainerRef = useRef(null)
  const hasContentRef = useRef(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState('#1a1a1a')
  const [lineWidth, setLineWidth] = useState(3)
  const [tool, setTool] = useState('pen') // pen | eraser
  const [hasContent, setHasContent] = useState(false)
  const lastPos = useRef(null)

  useImperativeHandle(ref, () => ({
    getImageBase64() {
      const canvas = canvasRef.current
      if (!canvas) return null
      const dataUrl = canvas.toDataURL('image/png')
      return dataUrl.split(',')[1]
    },
    clear() {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        setHasContent(false)
        hasContentRef.current = false
        onHasContent?.(false)
      }
    },
    hasContent,
  }))

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  function startDrawing(e) {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    lastPos.current = pos
    setIsDrawing(true)
  }

  const draw = useCallback((e) => {
    if (!isDrawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)

    ctx.lineWidth = tool === 'eraser' ? lineWidth * 5 : lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color

    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos

    if (!hasContent) {
      setHasContent(true)
      hasContentRef.current = true
      onHasContent?.(true)
    }
  }, [isDrawing, color, lineWidth, tool, hasContent, onHasContent])

  function stopDrawing() {
    setIsDrawing(false)
    lastPos.current = null
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      setHasContent(false)
      hasContentRef.current = false
      onHasContent?.(false)
    }
  }

  useEffect(() => {
    hasContentRef.current = hasContent
  }, [hasContent])

  useEffect(() => {
    if (fillContainer) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [fillContainer, width, height])

  useEffect(() => {
    if (!fillContainer) return
    const canvas = canvasRef.current
    const el = sizeContainerRef.current
    if (!canvas || !el) return

    let raf = 0
    function sync() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
        const w = Math.max(2, Math.round(rect.width * dpr))
        const h = Math.max(2, Math.round(rect.height * dpr))
        if (w < 2 || h < 2) return
        if (canvas.width === w && canvas.height === h) return

        const had = hasContentRef.current && canvas.width > 0 && canvas.height > 0
        const prev = had ? canvas.toDataURL('image/png') : null
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
        if (prev) {
          const img = new Image()
          img.onload = () => {
            ctx.drawImage(img, 0, 0, w, h)
          }
          img.onerror = () => {
            hasContentRef.current = false
            setHasContent(false)
            onHasContent?.(false)
          }
          img.src = prev
        }
      })
    }

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [fillContainer, onHasContent])

  const rootClass = fillContainer ? 'flex flex-col flex-1 min-h-0 gap-2' : 'flex flex-col gap-2'
  const frameClass = fillContainer
    ? 'relative flex-1 min-h-0 rounded-2xl overflow-hidden border-2 border-border shadow-inner bg-white touch-none'
    : 'relative rounded-2xl overflow-hidden border-2 border-border shadow-inner bg-white touch-none'

  return (
    <div className={rootClass}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap shrink-0" role="toolbar" aria-label="Ritverktyg">
        {/* Pen/Eraser */}
        <button
          type="button"
          onClick={() => setTool('pen')}
          aria-pressed={tool === 'pen'}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tool === 'pen' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted hover:bg-border'}`}
          aria-label="Penna"
        >
          ✏️ Penna
        </button>
        <button
          type="button"
          onClick={() => setTool('eraser')}
          aria-pressed={tool === 'eraser'}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tool === 'eraser' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted hover:bg-border'}`}
          aria-label="Suddgummi"
        >
          🧹 Sudda
        </button>

        {/* Line width */}
        <label className="flex items-center gap-1.5 text-sm text-text-muted">
          <span className="text-xs">Tjocklek</span>
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-20 accent-primary"
            aria-label="Pennans tjocklek"
          />
        </label>

        {/* Color */}
        {tool === 'pen' && (
          <label className="flex items-center gap-1.5 text-sm text-text-muted">
            <span className="text-xs">Färg</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
              aria-label="Pennfärg"
            />
          </label>
        )}

        {/* Clear */}
        <button
          type="button"
          onClick={clearCanvas}
          className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-2 text-text-muted hover:bg-border transition-all"
          aria-label="Rensa canvas"
        >
          Rensa
        </button>
      </div>

      {/* Canvas */}
      <div ref={fillContainer ? sizeContainerRef : undefined} className={frameClass}>
        <canvas
          ref={canvasRef}
          width={fillContainer ? 2 : width}
          height={fillContainer ? 2 : height}
          className={fillContainer ? 'h-full w-full block cursor-crosshair' : 'w-full block cursor-crosshair'}
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          aria-label="Rityta för din lösning"
          role="img"
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-text-muted text-sm">Rita din lösning här...</p>
          </div>
        )}
      </div>
    </div>
  )
})

export default CanvasInput

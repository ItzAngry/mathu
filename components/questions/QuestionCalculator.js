'use client'

import { useState, useCallback } from 'react'

const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => (b === 0 ? NaN : a / b),
}

function formatNum(n) {
  if (!Number.isFinite(n)) return 'Fel'
  if (Math.abs(n) > 1e12 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(6)
  const rounded = Math.round(n * 1e9) / 1e9
  const s = String(rounded)
  return s.length > 14 ? rounded.toPrecision(10) : s
}

function CalcButton({ children, onClick, className = '', variant = 'default' }) {
  const base =
    variant === 'op'
      ? 'bg-primary/15 text-primary hover:bg-primary/25'
      : 'bg-white border border-border text-text hover:bg-surface-2'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[2.5rem] rounded-xl text-sm font-semibold transition-colors ${base} ${className}`}
    >
      {children}
    </button>
  )
}

export default function QuestionCalculator() {
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState(null)
  const [operator, setOperator] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const reset = useCallback(() => {
    setDisplay('0')
    setPreviousValue(null)
    setOperator(null)
    setWaitingForOperand(false)
  }, [])

  const inputDigit = useCallback(
    (d) => {
      if (display === 'Fel') {
        setDisplay(String(d))
        setWaitingForOperand(false)
        return
      }
      if (waitingForOperand) {
        setDisplay(String(d))
        setWaitingForOperand(false)
      } else {
        setDisplay(display === '0' ? String(d) : display + d)
      }
    },
    [display, waitingForOperand]
  )

  const inputDot = useCallback(() => {
    if (display === 'Fel') {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }
    if (!display.includes('.')) setDisplay(display + '.')
  }, [display, waitingForOperand])

  const backspace = useCallback(() => {
    if (waitingForOperand || display === 'Fel') return
    if (display.length <= 1) setDisplay('0')
    else setDisplay(display.slice(0, -1))
  }, [display, waitingForOperand])

  const performOperator = useCallback(
    (nextOp) => {
      const input = parseFloat(display)
      if (display === 'Fel' || Number.isNaN(input)) {
        reset()
        return
      }

      if (previousValue === null) {
        setPreviousValue(input)
      } else if (operator) {
        const fn = OPS[operator]
        const result = fn(previousValue, input)
        const formatted = formatNum(result)
        setDisplay(formatted)
        setPreviousValue(parseFloat(formatted) || 0)
        if (formatted === 'Fel') {
          setOperator(null)
          setWaitingForOperand(true)
          return
        }
      }

      setWaitingForOperand(true)
      setOperator(nextOp)
    },
    [display, operator, previousValue, reset]
  )

  const equals = useCallback(() => {
    const input = parseFloat(display)
    if (operator === null || previousValue === null || display === 'Fel' || Number.isNaN(input)) {
      return
    }
    const fn = OPS[operator]
    const result = fn(previousValue, input)
    const formatted = formatNum(result)
    setDisplay(formatted)
    setPreviousValue(null)
    setOperator(null)
    setWaitingForOperand(true)
  }, [display, operator, previousValue])

  const sqrt = useCallback(() => {
    const v = parseFloat(display)
    if (display === 'Fel' || Number.isNaN(v)) {
      reset()
      return
    }
    if (v < 0) {
      setDisplay('Fel')
      setPreviousValue(null)
      setOperator(null)
      setWaitingForOperand(true)
      return
    }
    setDisplay(formatNum(Math.sqrt(v)))
    setWaitingForOperand(true)
    setPreviousValue(null)
    setOperator(null)
  }, [display, reset])

  const square = useCallback(() => {
    const v = parseFloat(display)
    if (display === 'Fel' || Number.isNaN(v)) {
      reset()
      return
    }
    setDisplay(formatNum(v * v))
    setWaitingForOperand(true)
    setPreviousValue(null)
    setOperator(null)
  }, [display, reset])

  return (
    <div
      className="rounded-2xl border border-border bg-surface-2/50 p-3 shadow-inner"
      role="region"
      aria-label="Miniräknare"
    >
      <p className="text-xs font-medium text-text-muted mb-2">Miniräknare</p>
      <div
        className="mb-2 rounded-xl bg-white border border-border px-3 py-2 text-right font-mono text-lg text-text tabular-nums min-h-[2.75rem] flex items-center justify-end break-all"
        aria-live="polite"
      >
        {display}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <CalcButton onClick={reset}>Rensa</CalcButton>
        <CalcButton onClick={backspace}>⌫</CalcButton>
        <CalcButton onClick={sqrt} className="text-xs">
          √
        </CalcButton>
        <CalcButton onClick={square} className="text-xs">
          x²
        </CalcButton>

        <CalcButton onClick={() => inputDigit(7)}>7</CalcButton>
        <CalcButton onClick={() => inputDigit(8)}>8</CalcButton>
        <CalcButton onClick={() => inputDigit(9)}>9</CalcButton>
        <CalcButton variant="op" onClick={() => performOperator('/')}>
          ÷
        </CalcButton>

        <CalcButton onClick={() => inputDigit(4)}>4</CalcButton>
        <CalcButton onClick={() => inputDigit(5)}>5</CalcButton>
        <CalcButton onClick={() => inputDigit(6)}>6</CalcButton>
        <CalcButton variant="op" onClick={() => performOperator('*')}>
          ×
        </CalcButton>

        <CalcButton onClick={() => inputDigit(1)}>1</CalcButton>
        <CalcButton onClick={() => inputDigit(2)}>2</CalcButton>
        <CalcButton onClick={() => inputDigit(3)}>3</CalcButton>
        <CalcButton variant="op" onClick={() => performOperator('-')}>
          −
        </CalcButton>

        <CalcButton onClick={() => inputDigit(0)} className="col-span-2">
          0
        </CalcButton>
        <CalcButton onClick={inputDot}>.</CalcButton>
        <CalcButton variant="op" onClick={() => performOperator('+')}>
          +
        </CalcButton>

        <CalcButton variant="op" onClick={equals} className="col-span-4">
          =
        </CalcButton>
      </div>
    </div>
  )
}

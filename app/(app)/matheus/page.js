'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

function Mascot({ size = 96 }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/vectorink-vectorizer-result.svg" // must exist under /public
        alt=""
        width={size}
        height={size}
        priority
        draggable={false}
      />
    </div>
  )
}


function SmallMascot({ size = 50 }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src="/vectorink-vectorizer-result.svg" // must exist under /public
        alt=""
        width={size}
        height={size}
        priority
        draggable={false}
      />
    </div>
  )
}

// ── Typing indicator ───────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-1.5 px-4 py-3" aria-label="Matheus skriver...">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce"
          style={{ animationDelay: `${i * 0.18}s` }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

// ── Suggested starter questions ────────────────────────────────────────────
const SUGGESTIONS = [
  'Vad är en potens?',
  'Förklara linjära funktioner',
  'Hur löser jag en ekvation?',
  'Vad är sannolikhet?',
]

const GREETING = 'Hej! Jag är Matheus. Jag är din personliga AI-matematiklärare för Matte 1b. Fråga mig vad som helst — jag förklarar, hjälper dig lösa problem och ger tips på hur du kan förbättra din förståelse.'

export default function MathewPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const hasMessages = messages.length > 0

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function sendMessage(text) {
    const userText = (text ?? input).trim()
    if (!userText || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userText }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/mathew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAnswer: userText, mode: 'chat' }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response ?? 'Kunde inte svara just nu.' },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Något gick fel. Kontrollera din nätverksanslutning.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage()
  }

  return (
    <div className="flex flex-col h-screen bg-surface">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-border shrink-0">
        <Mascot size={40} />
        <div className="flex-1">
          <h1 className="font-bold text-text text-lg leading-tight">Matheus</h1>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success inline-block" aria-hidden="true" />
            <span className="text-xs text-text-muted">AI-matematiklärare · Alltid redo att hjälpa</span>
          </div>
        </div>
        {hasMessages && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-text-muted hover:text-danger transition-colors px-3 py-1.5 rounded-lg hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Rensa konversation"
          >
            Rensa
          </button>
        )}
      </div>

      {/* ── Messages area ────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-label="Konversation med Matheus"
      >
        {/* Welcome / empty state */}
        <AnimatePresence>
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 text-center"
            >
              <Mascot size={100} />

              <h2 className="mt-6 text-2xl font-bold text-text">Hej! Jag är Matheus</h2>
              <p className="mt-2 text-text-muted text-sm max-w-sm leading-relaxed">
                Din personliga AI-matematiklärare för Matte&nbsp;1b. Ställ en fråga eller välj ett ämne nedan.
              </p>

              {/* Suggestion chips */}
              <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-sm">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="px-4 py-2 rounded-full border-2 border-primary/30 bg-primary-light text-primary text-sm font-medium hover:border-primary hover:bg-primary hover:text-white transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message list */}
        {hasMessages && (
          <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={['flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : ''].join(' ')}
              >
                {msg.role === 'assistant' && <SmallMascot />}

                <div
                  className={[
                    'max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white text-text rounded-2xl rounded-tl-sm border border-border',
                  ].join(' ')}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2.5 items-start"
              >
                <SmallMascot />
                <div className="bg-white border border-border rounded-2xl rounded-tl-sm shadow-sm">
                  <TypingDots />
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ───────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-border px-4 py-4 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto flex items-end gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ställ en fråga till Matheus..."
            disabled={loading}
            aria-label="Meddelande till Matheus"
            className="flex-1 px-4 py-3 rounded-2xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Skicka meddelande"
            className="h-11 w-11 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:outline-2 focus-visible:outline-primary shadow-md shadow-primary/30 shrink-0"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

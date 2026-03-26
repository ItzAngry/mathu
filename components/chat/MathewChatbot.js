'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function MathewAvatar({ size = 48, pulsing = false }) {
  return (
    <div
      className={['relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-500 shadow-lg', pulsing && 'node-pulse'].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span style={{ fontSize: size * 0.5 }}>🤖</span>
    </div>
  )
}

const GREETING = 'Hej! Jag är Mathew, din AI-matematiklärare. Hur kan jag hjälpa dig idag? 😊'

export default function MathewChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/mathew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAnswer: userMessage, mode: 'chat' }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response ?? 'Kunde inte svara just nu.' },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Något gick fel. Försök igen.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 flex flex-col bg-white rounded-3xl shadow-2xl border border-border w-80 h-[420px] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mathew AI-assistent"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary to-purple-500 text-white">
              <MathewAvatar size={36} />
              <div className="flex-1">
                <p className="font-bold text-sm">Mathew</p>
                <p className="text-xs text-white/70">AI-matematiklärare</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Stäng Mathew"
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-white"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
              role="log"
              aria-live="polite"
              aria-label="Konversation"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={['flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : ''].join(' ')}
                >
                  {msg.role === 'assistant' && (
                    <MathewAvatar size={28} />
                  )}
                  <div
                    className={[
                      'max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-surface-2 text-text rounded-tl-sm',
                    ].join(' ')}
                    aria-label={msg.role === 'user' ? 'Du:' : 'Mathew:'}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 items-center">
                  <MathewAvatar size={28} />
                  <div className="bg-surface-2 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1" aria-label="Mathew skriver...">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-text-muted rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-border">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Skriv en fråga..."
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted
                           focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                aria-label="Meddelande till Mathew"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center
                           hover:bg-primary-dark active:scale-95 disabled:opacity-40 transition-all
                           focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="Skicka meddelande"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-lg shadow-primary/40
                   focus-visible:outline-2 focus-visible:outline-primary"
        style={{ width: 60, height: 60 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ y: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } }}
        aria-label={open ? 'Stäng Mathew' : 'Öppna Mathew AI-assistent'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <MathewAvatar size={60} pulsing={!open} />
      </motion.button>
    </>
  )
}

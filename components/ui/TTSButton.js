'use client'

import { useState, useRef } from 'react'

export default function TTSButton({ text, audioUrl, label = 'Lyssna' }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)
  const utteranceRef = useRef(null)

  function speak() {
    if (playing) {
      stop()
      return
    }

    // Prefer pre-recorded audio file
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.onended = () => setPlaying(false)
      audio.onerror = () => {
        setPlaying(false)
        useSpeechSynthesis()
      }
      audio.play()
      setPlaying(true)
      return
    }

    useSpeechSynthesis()
  }

  function useSpeechSynthesis() {
    if (!window.speechSynthesis || !text) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'sv-SE'
    utterance.rate = 0.9
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setPlaying(true)
  }

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    utteranceRef.current = null
    setPlaying(false)
  }

  if (!text && !audioUrl) return null

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={playing ? 'Stoppa uppläsning' : label}
      aria-pressed={playing}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
        'focus-visible:outline-2 focus-visible:outline-primary',
        playing
          ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30'
          : 'bg-white text-text-muted border-border hover:border-primary hover:text-primary',
      ].join(' ')}
    >
      {playing ? (
        <>
          <span className="relative flex h-3 w-3" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          Stoppa
        </>
      ) : (
        <>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}

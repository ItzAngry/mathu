/**
 * AI Request Queue
 * Limits concurrent AI model calls to MAX_CONCURRENT.
 * If the queue is full (> MAX_QUEUE), rejects with a 429-style error.
 */

const MAX_CONCURRENT = 2
const MAX_QUEUE = 10

let running = 0
const waiters = []

function dequeue() {
  if (running >= MAX_CONCURRENT || waiters.length === 0) return
  running++
  const { resolve } = waiters.shift()
  resolve()
}

/**
 * Enqueue an async function. Waits until a slot is free, then runs it.
 * Throws if the queue is full.
 */
export async function enqueue(fn) {
  if (running >= MAX_CONCURRENT && waiters.length >= MAX_QUEUE) {
    throw Object.assign(new Error('Kön är full, försök igen om ett ögonblick.'), { status: 429 })
  }

  if (running < MAX_CONCURRENT) {
    running++
  } else {
    await new Promise((resolve) => waiters.push({ resolve }))
  }

  try {
    return await fn()
  } finally {
    running--
    dequeue()
  }
}

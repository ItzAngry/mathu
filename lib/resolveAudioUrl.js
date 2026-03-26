/**
 * Turn stored audio references into a URL the browser can play.
 * - Full URLs (http/https) are left as-is.
 * - Paths starting with / are left as-is (Next.js serves public/ at /).
 * - Anything else is treated as a path under public/, e.g. "lesson.mp3" → "/lesson.mp3",
 *   "audio/lesson.mp3" → "/audio/lesson.mp3".
 */
export function resolvePublicAudioUrl(raw) {
  if (raw == null) return ''
  const s = String(raw).trim()
  if (!s) return ''
  const lower = s.toLowerCase()
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('//') ||
    lower.startsWith('blob:') ||
    lower.startsWith('data:')
  ) {
    return s
  }
  if (s.startsWith('/')) return s
  return `/${s.replace(/^\/+/, '')}`
}

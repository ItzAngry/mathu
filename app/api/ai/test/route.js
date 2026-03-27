import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

export const maxDuration = 15

// Admin-only endpoint: confirms which AI URLs are configured and whether
// they respond from Vercel. Hit GET /api/ai/test after deploying.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  if (admins.length > 0 && !admins.includes(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const useRemote = process.env.USE_REMOTE_MODELS === 'true'

  const mathewUrl = useRemote
    ? (process.env.MATHEW_API_URL_REMOTE || process.env.MATHEW_API_URL)
    : (process.env.MATHEW_API_URL || process.env.MATHEW_API_URL_REMOTE)

  const qwenUrl = useRemote
    ? (process.env.QWEN_API_URL_REMOTE || process.env.QWEN_API_URL)
    : (process.env.QWEN_API_URL || process.env.QWEN_API_URL_REMOTE)

  async function probe(label, base) {
    if (!base) return { label, url: null, status: 'not configured' }
    const url = base.replace(/\/+$/, '') + '/models'
    const start = Date.now()
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${label === 'mathew' ? process.env.MATHEW_REMOTE_API_KEY : process.env.QWEN_REMOTE_API_KEY}` },
        signal: AbortSignal.timeout(8000),
      })
      return { label, url, status: res.ok ? 'ok' : `http ${res.status}`, ms: Date.now() - start }
    } catch (err) {
      return { label, url, status: err.message, ms: Date.now() - start }
    }
  }

  const [mathew, qwen] = await Promise.all([
    probe('mathew', mathewUrl),
    probe('qwen', qwenUrl),
  ])

  return NextResponse.json({ useRemote, mathew, qwen })
}

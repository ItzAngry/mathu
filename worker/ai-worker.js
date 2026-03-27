#!/usr/bin/env node
/**
 * AI Worker — run this on each LM Studio machine.
 *
 * It polls Supabase for pending AI jobs, calls LM Studio locally (no Tailscale
 * needed), and writes the result back so Vercel can return it to the browser.
 *
 * SETUP (do this once on each machine):
 *   1. Copy this file + the project repo to the machine (or just git clone).
 *   2. Run:  npm install   (in the project root)
 *   3. Create  worker/.env  with the vars below.
 *   4. Start:  node worker/ai-worker.js
 *
 * worker/.env  (for the Mathew/text machine):
 *   SUPABASE_URL=https://painvmazwbzbzdejfioa.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<your service role key>
 *   WORKER_TYPE=mathew
 *   LM_STUDIO_URL=http://127.0.0.1:1234/v1
 *   LM_MODEL=qwen/qwen3-4b-2507
 *
 * worker/.env  (for the Qwen/vision machine):
 *   SUPABASE_URL=https://painvmazwbzbzdejfioa.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<your service role key>
 *   WORKER_TYPE=qwen
 *   LM_STUDIO_URL=http://127.0.0.1:1234/v1
 *   LM_MODEL=qwen/qwen3-4b-2507
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// ── Load worker/.env manually (no dotenv dependency needed) ────────────
const __dir = dirname(fileURLToPath(import.meta.url))
try {
  const envText = readFileSync(resolve(__dir, '.env'), 'utf8')
  for (const line of envText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
} catch {
  // .env missing — rely on shell environment variables
}

// ── Config ────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const WORKER_TYPE  = process.env.WORKER_TYPE   // 'mathew' or 'qwen'
const LM_URL       = process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/'
const MODEL        = process.env.LM_MODEL      || 'qwen/qwen3-4b-2507'
const API_KEY      = process.env.LM_API_KEY    || 'lm-studio'
const JOB_TYPE     = WORKER_TYPE === 'qwen' ? 'vision' : 'matheus'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[worker] ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in worker/.env')
  process.exit(1)
}
if (!WORKER_TYPE) {
  console.error('[worker] ERROR: WORKER_TYPE must be "mathew" or "qwen" in worker/.env')
  process.exit(1)
}

// ── Supabase + OpenAI ─────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

const baseURL = LM_URL.endsWith('/') ? LM_URL : LM_URL + '/'
const openai = new OpenAI({ baseURL, apiKey: API_KEY, maxRetries: 0, timeout: 120_000 })

console.log(`[worker] started  type=${JOB_TYPE}  model=${MODEL}  url=${baseURL}`)

// ── System prompts ────────────────────────────────────────────────────
const MATHEW_CHECK_SYSTEM = `Du är Matheus, en pedagogisk och uppmuntrande matematiklärare för svenska gymnasieelever.
Din uppgift är att utvärdera användarens svar jämfört med facit. Tilltala alltid användaren direkt med "du". ANVÄND ALDRIG EMOJIS.

INSTRUKTIONER:
1. Analysera: Jämför vad användaren har svarat med det förväntade svaret (facit).
2. Bedöm korrekthet (VAR STRIKT): Svaret måste stämma exakt. Ett teckenfel eller räknefel (t.ex. -163 istället för -63) är alltid fel. Godkänn ENDAST sanna matematiska ekvivalenser (t.ex. bråk vs. decimalform) och korrekta avrundningar om uppgiften kräver det.
3. Formatera utdata: Ditt svar MÅSTE följa denna struktur:
   - Börja med ett kort och enkelt resonemang riktat till användaren (t.ex. "Du svarade rätt eftersom..." eller "Ditt svar är tyvärr fel, du råkade få -163 men det ska vara -63.").
   - På en ny rad, skriv exakt: "CorrectAnswer: True" eller "CorrectAnswer: False".
   - Avsluta med en kort, uppmuntrande förklaring på svenska.`

const MATHEW_CHAT_SYSTEM = `Ditt namn är Matheus, en pedagogisk matematiklärare på gymnasiet. ANVÄND ALDRIG EMOJIS. Du hjälper ungdomar som ofta tycker matte är svårt. Tilltala alltid användaren direkt med "du".

REGLER:
1. Tonalitet: Förklara tydligt men håll det kort. Använd enkelt språk. Var uppmuntrande, men släpp aldrig igenom felaktig matematik. Påpeka teckenfel och räknefel tydligt. Använd ALDRIG emojis eller onödiga specialtecken.
2. Ämne (ENDAST MATTE): Svara bara på matematikfrågor. Försöker användaren fråga om annat, avböj vänligt och förklara att du bara hjälper till med matematik.
3. Språk: Svara ALLTID på samma språk som användarens senaste meddelande.
4. Svarsstruktur:
   - Ge din förklaring eller lösning och rätta eventuella fel stegen visar.
   - Avsluta alltid hela svaret med en kort sammanfattning.
   - Ställ en direkt följdfråga (t.ex. "Ser du var minustecknet försvann?" eller "Vill du prova en liknande uppgift?").`

const VISION_CHECK_SYSTEM = `Du är en AI-matematiklärare som rättar handskrivna lösningar. ANVÄND ALDRIG EMOJIS.
Du får: en fråga, ett facit och en bild på användarens lösning. Tilltala alltid användaren direkt med "du" och "din".

INSTRUKTIONER:
- Granska uträkning och slutsvar MYCKET STRIKT.
- Matematiken måste stämma. Ett räknefel (t.ex. att skriva -163 om facit är -63) är ett fel, och 'final_answer_correct' måste då bli false. Låt inte snällhet gå ut över matematisk korrekthet.
- Acceptera alternativa metoder, men var stenhård med att logiken i varje steg måste vara felfri.

UTDATA:
Du MÅSTE svara EXAKT med ett giltigt JSON-objekt, inget annat. Ingen inledande/avslutande text, inga markdown-block.

JSON-FORMAT:
{
  "is_correct": boolean,
  "method_correct": boolean,
  "final_answer_correct": boolean,
  "completeness": "complete" | "partially_complete" | "incomplete",
  "feedback": "string"
}`

// ── Response parsers (mirrors lib/ai.js) ─────────────────────────────
function textFromContent(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map(p => (typeof p === 'string' ? p : p?.text ?? '')).join('')
  return ''
}

function parseMessage(message) {
  if (!message) return { reasoning: '', content: '' }
  return {
    reasoning: typeof message.reasoning_content === 'string' ? message.reasoning_content.trim() : '',
    content: textFromContent(message.content)?.trim() ?? '',
  }
}

function parseVerdict(message) {
  const { reasoning, content } = parseMessage(message)
  const searchText = reasoning || content || ''
  const match = searchText.match(/CorrectAnswer\s*:\s*(true|false)/i)
  const correct = match ? match[1].toLowerCase() === 'true' : false
  let explanation = content
  if (!explanation && reasoning) {
    const parts = reasoning.split(/CorrectAnswer\s*:\s*(true|false)/i)
    explanation = (parts[parts.length - 1] || '').trim()
  }
  return { correct, explanation, reasoning }
}

function parseVisionVerdict(message) {
  const { reasoning, content } = parseMessage(message)
  const searchText = content || reasoning || ''
  const jsonMatch = searchText.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        correct: Boolean(parsed.is_correct),
        methodCorrect: Boolean(parsed.method_correct),
        finalAnswerCorrect: Boolean(parsed.final_answer_correct),
        completeness: parsed.completeness ?? 'incomplete',
        explanation: parsed.feedback ?? '',
        reasoning,
      }
    } catch { /* fall through */ }
  }
  const isCorrectMatch = searchText.match(/["']?is_correct["']?\s*:\s*(true|false)/i)
  return {
    correct: isCorrectMatch ? isCorrectMatch[1].toLowerCase() === 'true' : false,
    methodCorrect: false,
    finalAnswerCorrect: false,
    completeness: 'incomplete',
    explanation: searchText.replace(/\{[\s\S]*\}/, '').trim() || 'Kunde inte tolka svaret.',
    reasoning,
  }
}

// ── Job processor ─────────────────────────────────────────────────────
async function processJob(job) {
  const { id, type, payload } = job
  console.log(`[worker] processing ${id} (${type})`)

  try {
    let result

    if (type === 'matheus') {
      const { question, userAnswer, correctAnswer, mode = 'check' } = payload
      const isCheck = mode === 'check'
      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: isCheck ? 0.2 : 0.55,
        messages: [
          { role: 'system', content: isCheck ? MATHEW_CHECK_SYSTEM : MATHEW_CHAT_SYSTEM },
          {
            role: 'user',
            content: isCheck
              ? `Fråga: ${question}\nKorrekt svar: ${correctAnswer}\nElevens svar: ${userAnswer}`
              : userAnswer,
          },
        ],
      })
      const message = completion.choices[0]?.message
      if (isCheck) {
        result = parseVerdict(message)
      } else {
        const { reasoning, content } = parseMessage(message)
        result = { response: content || reasoning || 'Inget svar.' }
      }
    } else {
      // vision
      const { question, userAnswer, correctAnswer, imageBase64 } = payload
      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        messages: [
          { role: 'system', content: VISION_CHECK_SYSTEM },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: [
                  `Fråga: ${question}`,
                  `Korrekt svar: ${correctAnswer}`,
                  userAnswer ? `Elevens skrivna svar: ${userAnswer}` : '',
                  'Analysera bilden nedan som visar elevens handskrivna lösning.',
                ].filter(Boolean).join('\n'),
              },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } },
            ],
          },
        ],
      })
      result = parseVisionVerdict(completion.choices[0]?.message)
    }

    await supabase
      .from('ai_jobs')
      .update({ status: 'done', result, completed_at: new Date().toISOString() })
      .eq('id', id)

    console.log(`[worker] done    ${id}`)
  } catch (err) {
    console.error(`[worker] error   ${id}:`, err.message)
    await supabase
      .from('ai_jobs')
      .update({ status: 'error', result: { error: err.message }, completed_at: new Date().toISOString() })
      .eq('id', id)
  }
}

// ── Poll loop ─────────────────────────────────────────────────────────
let busy = false

async function poll() {
  if (busy) return
  busy = true
  try {
    const { data: rows } = await supabase
      .from('ai_jobs')
      .select('id, type, payload')
      .eq('status', 'pending')
      .eq('type', JOB_TYPE)
      .order('created_at', { ascending: true })
      .limit(1)

    const job = rows?.[0]
    if (!job) return

    // Atomically claim: only proceed if status is still 'pending'
    const { data: claimed } = await supabase
      .from('ai_jobs')
      .update({ status: 'processing' })
      .eq('id', job.id)
      .eq('status', 'pending')
      .select('id')

    if (!claimed?.length) return // another worker claimed it first

    await processJob(job)
  } catch (err) {
    console.error('[worker] poll error:', err.message)
  } finally {
    busy = false
  }
}

// Clean up completed jobs older than 1 hour
async function cleanup() {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  await supabase.from('ai_jobs').delete().in('status', ['done', 'error']).lt('completed_at', cutoff)
}

poll()
setInterval(poll, 2000)
setInterval(cleanup, 5 * 60 * 1000)

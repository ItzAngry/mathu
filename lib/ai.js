import OpenAI from 'openai'

// ── Endpoint configuration ─────────────────────────────────────────────────
//
// Each model has a "local" Tailscale IP and an optional "remote" Funnel URL.
// Set USE_REMOTE_MODELS=true to route through Funnel (needed on Vercel).
//
const USE_REMOTE = process.env.USE_REMOTE_MODELS === 'true'

const ENDPOINTS = {
  matheus: {
    local:     process.env.MATHEW_API_URL         ?? 'http://100.105.232.94:1234',
    remote:    process.env.MATHEW_API_URL_REMOTE  ?? '',
    model:     process.env.MATHEW_MODEL           ?? 'qwen/qwen3-4b-2507',
    localKey:  process.env.MATHEW_API_KEY         ?? 'lm-studio',
    remoteKey: process.env.MATHEW_REMOTE_API_KEY  ?? '',
  },
  vision: {
    local:     process.env.QWEN_API_URL           ?? 'http://100.114.219.75:1234',
    remote:    process.env.QWEN_API_URL_REMOTE    ?? '',
    model:     process.env.QWEN_MODEL             ?? 'qwen/qwen3-4b-2507',
    localKey:  process.env.QWEN_API_KEY           ?? 'lm-studio',
    remoteKey: process.env.QWEN_REMOTE_API_KEY    ?? '',
  },
}

// ── Inference settings ─────────────────────────────────────────────────────
const CHECK_TEMPERATURE = 0.2
const CHAT_TEMPERATURE  = 0.55

// ── System prompts ─────────────────────────────────────────────────────────

const MATHEUS_CHECK_SYSTEM = `Du är Matheus, en pedagogisk och uppmuntrande matematiklärare för svenska gymnasieelever.
Din uppgift är att utvärdera användarens svar jämfört med facit. Tilltala alltid användaren direkt med "du".

INSTRUKTIONER:
1. Analysera: Jämför vad användaren har svarat med det förväntade svaret (facit).
2. Bedöm korrekthet (VAR STRIKT): Svaret måste stämma exakt. Ett teckenfel eller räknefel (t.ex. -163 istället för -63) är alltid fel. Godkänn ENDAST sanna matematiska ekvivalenser (t.ex. bråk vs. decimalform) och korrekta avrundningar om uppgiften kräver det.
3. Formatera utdata: Ditt svar MÅSTE följa denna struktur:
   - Börja med ett kort och enkelt resonemang riktat till användaren (t.ex. "Du svarade rätt eftersom..." eller "Ditt svar är tyvärr fel, du råkade få -163 men det ska vara -63.").
   - På en ny rad, skriv exakt: "CorrectAnswer: True" eller "CorrectAnswer: False".
   - Avsluta med en kort, uppmuntrande förklaring på svenska.`

const MATHEUS_CHAT_SYSTEM = `Ditt namn är Matheus, en pedagogisk matematiklärare på gymnasiet. Du hjälper ungdomar som ofta tycker matte är svårt. Tilltala alltid användaren direkt med "du".

REGLER:
1. Tonalitet: Förklara tydligt men håll det kort. Använd enkelt språk. Var uppmuntrande, men släpp aldrig igenom felaktig matematik. Påpeka teckenfel och räknefel tydligt. Använd ALDRIG emojis eller onödiga specialtecken.
2. Ämne (ENDAST MATTE): Svara bara på matematikfrågor. Försöker användaren fråga om annat, avböj vänligt och förklara att du bara hjälper till med matematik.
3. Språk: Svara ALLTID på samma språk som användarens senaste meddelande.
4. Svarsstruktur:
   - Ge din förklaring eller lösning och rätta eventuella fel stegen visar.
   - Avsluta alltid hela svaret med en kort sammanfattning.
   - Ställ en direkt följdfråga (t.ex. "Ser du var minustecknet försvann?" eller "Vill du prova en liknande uppgift?").`

const VISION_CHECK_SYSTEM = `Du är en AI-matematiklärare som rättar handskrivna lösningar.
Du får: en fråga, ett facit, eventuellt ett skrivet textsvar från eleven och en bild på elevens handskrivna lösning. Tilltala alltid användaren direkt med "du" och "din".

VIKTIGT – PRIORITERINGSREGEL:
Om eleven har skrivit ett textsvar, har detta ALLTID högst prioritet vid bedömning. Bedöm textsvaret i första hand.
Bilden visar elevens uträkning och är kompletterande – om textsvaret och bilden pekar på olika slutsvar, lita alltid på textsvaret.
Eleven förväntas dra den slutgiltiga slutsatsen i textsvaret. Bilden är stöd för metod och mellansteg.

INSTRUKTIONER:
- Granska uträkning och slutsvar MYCKET STRIKT.
- Matematiken måste stämma. Ett räknefel (t.ex. att skriva -163 om facit är -63) är ett fel, och 'final_answer_correct' måste då bli false. Låt inte snällhet gå ut över matematisk korrekthet.
- Acceptera alternativa metoder, men var stenhård med att logiken i varje steg måste vara felfri.

UTDATA:
Du MÅSTE svara EXAKT med ett giltigt JSON-objekt, inget annat. Ingen inledande/avslutande text, inga markdown-block.

JSON-FORMAT:
{
  "is_correct": boolean, // true ENDAST om hela uppgiften (metod och svar) är helt felfri
  "method_correct": boolean, // true om uppställningen/logiken är rätt, false vid minsta logiska fel i stegen
  "final_answer_correct": boolean, // true ENDAST om det slutgiltiga svaret matchar facit exakt (ekvivalenta uttryck är ok)
  "completeness": "complete" | "partially_complete" | "incomplete", // Endast en av dessa
  "feedback": "string" // Kort, uppmuntrande feedback direkt till användaren (t.ex. "Din metod är helt rätt, men du gjorde ett litet teckenfel på slutet...")
}`

// ── Helpers ────────────────────────────────────────────────────────────────

function ensureV1(url) {
  const raw = (url || '').trim().replace(/\/+$/, '')
  if (/\/v1$/i.test(raw)) return raw
  return `${raw}/v1`
}

/**
 * Resolve the correct base URL for a named model.
 * Respects USE_REMOTE_MODELS env var. Throws if remote is requested but not configured.
 */
function resolveBaseURL(name, customUrl) {
  if (customUrl) return ensureV1(customUrl)

  const ep = ENDPOINTS[name]
  if (!ep) throw new Error(`Unknown model: ${name}`)

  if (USE_REMOTE) {
    if (!ep.remote) throw new Error(`Remote URL not configured for model "${name}". Set ${name === 'matheus' ? 'MATHEW_API_URL_REMOTE' : 'QWEN_API_URL_REMOTE'}.`)
    return ensureV1(ep.remote)
  }

  return ensureV1(ep.local)
}

/**
 * Pick the correct API key.
 * Remote requests use the per-model remoteKey; local requests use the per-model localKey.
 * customUrl (per-user override) falls back to the remote key.
 */
function resolveApiKey(name, customUrl) {
  const ep = ENDPOINTS[name]
  if (USE_REMOTE || customUrl) return ep?.remoteKey || ep?.localKey || 'lm-studio'
  return ep?.localKey ?? 'lm-studio'
}

/**
 * Build an OpenAI client for the given model name.
 */
function buildClient(name, { customUrl, timeoutMs } = {}) {
  const baseURL = resolveBaseURL(name, customUrl)
  const apiKey  = resolveApiKey(name, customUrl)
  return new OpenAI({ baseURL, apiKey, maxRetries: 0, timeout: timeoutMs ?? 60_000 })
}

/** Extract text from LM Studio / OpenAI message content (string or array). */
function textFromContent(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content.map((p) => (p && typeof p === 'object' && 'text' in p ? String(p.text) : typeof p === 'string' ? p : '')).join('')
  }
  return ''
}

function parseMessage(message) {
  if (!message) return { reasoning: '', content: '' }
  return {
    reasoning: typeof message.reasoning_content === 'string' ? message.reasoning_content.trim() : '',
    content:   textFromContent(message.content)?.trim() ?? '',
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
        correct:            Boolean(parsed.is_correct),
        methodCorrect:      Boolean(parsed.method_correct),
        finalAnswerCorrect: Boolean(parsed.final_answer_correct),
        completeness:       parsed.completeness ?? 'incomplete',
        explanation:        parsed.feedback ?? '',
        reasoning,
      }
    } catch { /* fall through */ }
  }

  const isCorrectMatch = searchText.match(/["']?is_correct["']?\s*:\s*(true|false)/i)
  const correct = isCorrectMatch ? isCorrectMatch[1].toLowerCase() === 'true' : false
  return {
    correct,
    methodCorrect:      false,
    finalAnswerCorrect: correct,
    completeness:       'incomplete',
    explanation:        searchText.replace(/\{[\s\S]*\}/, '').trim() || 'Kunde inte tolka svaret.',
    reasoning,
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Send a text-only answer to Matheus for verification or chat.
 */
export async function callMatheus({ question, userAnswer, correctAnswer, customUrl, mode = 'check' }) {
  const timeoutMs = mode === 'check' ? 60_000 : 120_000
  const client = buildClient('matheus', { customUrl, timeoutMs })
  const model  = ENDPOINTS.matheus.model

  const systemPrompt  = mode === 'check' ? MATHEUS_CHECK_SYSTEM : MATHEUS_CHAT_SYSTEM
  const temperature   = mode === 'check' ? CHECK_TEMPERATURE : CHAT_TEMPERATURE
  const userContent   = mode === 'check'
    ? [`Fråga: ${question}`, `Korrekt svar: ${correctAnswer}`, `Elevens svar: ${userAnswer}`].join('\n')
    : userAnswer

  const t0 = Date.now()
  try {
    const completion = await client.chat.completions.create({
      model,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent  },
      ],
    })
    console.log(`[ai] matheus (${mode}) ${Date.now() - t0}ms`)

    const message = completion.choices[0]?.message
    if (mode === 'check') return parseVerdict(message)

    const { reasoning, content } = parseMessage(message)
    return { response: content || reasoning || 'Inget svar.' }
  } catch (err) {
    console.error(`[ai] matheus error (${Date.now() - t0}ms):`, err.message ?? err)
    return mode === 'check'
      ? { correct: false, explanation: 'Kunde inte nå Matheus just nu.', reasoning: '' }
      : { response: 'Kunde inte nå Matheus just nu. Om problemet fortsätter, var snäll och kontakta support.' }
  }
}

/**
 * Send a canvas image + answer to the vision model for verification.
 * Falls back to text-only Matheus check if the vision call fails.
 */
export async function callVision({ question, userAnswer, correctAnswer, imageBase64, customUrl }) {
  const client = buildClient('vision', { customUrl, timeoutMs: 60_000 })
  const model  = ENDPOINTS.vision.model

  const userContent = [
    {
      type: 'text',
      text: [
        `Fråga: ${question}`,
        `Korrekt svar (facit): ${correctAnswer}`,
        userAnswer
          ? `ELEVENS SLUTSVAR (PRIORITERA DETTA VID BEDÖMNING): ${userAnswer}`
          : '(Eleven har inte skrivit något textsvar — bedöm enbart utifrån bilden.)',
        `Bilden nedan visar elevens handskrivna uträkning (kompletterande stöd):`,
      ].join('\n'),
    },
    {
      type: 'image_url',
      image_url: { url: `data:image/png;base64,${imageBase64}` },
    },
  ]

  const t0 = Date.now()
  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: CHECK_TEMPERATURE,
      messages: [
        { role: 'system', content: VISION_CHECK_SYSTEM },
        { role: 'user',   content: userContent         },
      ],
    })
    console.log(`[ai] vision ${Date.now() - t0}ms`)
    return parseVisionVerdict(completion.choices[0]?.message)
  } catch (err) {
    console.error(`[ai] vision error (${Date.now() - t0}ms):`, err.message ?? err)

    // Fallback: try Matheus text-only check
    console.log('[ai] vision failed — falling back to matheus text check')
    try {
      const fallback = await callMatheus({ question, userAnswer, correctAnswer, mode: 'check' })
      return {
        correct:            fallback.correct,
        methodCorrect:      false,
        finalAnswerCorrect: fallback.correct,
        completeness:       'incomplete',
        explanation:        fallback.explanation,
        reasoning:          fallback.reasoning,
      }
    } catch {
      return {
        correct:            false,
        methodCorrect:      false,
        finalAnswerCorrect: false,
        completeness:       'incomplete',
        explanation:        'Kunde inte analysera bilden just nu.',
        reasoning:          '',
      }
    }
  }
}

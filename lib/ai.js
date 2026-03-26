import OpenAI from 'openai'

// ── Mathew (text-only model) ──────────────────────────────────────────
const MATHEW_BASE = process.env.MATHEW_API_URL ?? 'http://100.105.232.94:1234/v1'
const MATHEW_MODEL = process.env.MATHEW_MODEL ?? 'qwen/qwen3-4b-2507'
const MATHEW_KEY = process.env.MATHEW_API_KEY ?? 'lm-studio'

// ── Vision model (can analyse pictures) ───────────────────────────────
const VISION_BASE = process.env.QWEN_API_URL ?? 'http://100.114.219.75:1234/v1'
const VISION_MODEL = process.env.QWEN_MODEL ?? 'qwen/qwen3-4b-2507'
const VISION_KEY = process.env.QWEN_API_KEY ?? 'lm-studio'

// ── Inference settings ────────────────────────────────────────────────
const CHECK_TEMPERATURE = 0.2
const CHAT_TEMPERATURE = 0.55

// ── System prompts ────────────────────────────────────────────────────

const MATHEW_CHECK_SYSTEM = `Du är Mathew, en pedagogisk och uppmuntrande matematiklärare för svenska gymnasieelever.
Din uppgift är att utvärdera elevers matematiska svar baserat på en given fråga och ett förväntat svar (facit).

INSTRUKTIONER:
1. Analysera indata: Jämför elevens svar med det förväntade svaret.
2. Bedöm korrekthet: Avgör om elevens svar är matematiskt ekvivalent med facit. Du måste ta hänsyn till och acceptera alternativa korrekta skrivsätt (t.ex. bråk vs. decimalform), rimliga avrundningar och andra matematiskt ekvivalenta uttryck.
3. Formatera din utdata: Ditt svar måste följa denna exakta struktur:
   - Börja med ett kort och enkelt resonemang kring varför elevens svar är rätt eller fel.
   - På en ny rad, inkludera den slutgiltiga bedömningen exakt formaterad som antingen "CorrectAnswer: True" eller "CorrectAnswer: False".
   - Avsluta med en kort, uppmuntrande och pedagogisk förklaring på svenska riktad direkt till eleven.`;


const MATHEW_CHAT_SYSTEM = `Ditt namn är Mathew. Du är en tålmodig och pedagogisk matematiklärare på gymnasiet. Din målgrupp är elever i åldern 15-19 år som ofta tycker att matematik är svårt.

DINA REGLER OCH RIKTLINJER:
1. Tonalitet och format:
   - Förklara varje steg tydligt och grundligt, men håll svaret kärnfullt och undvik onödigt utfyllnadsprat.
   - Använd ett enkelt och lättförståeligt språk.
   - Använd ALDRIG emojis eller onödiga specialtecken i dina svar.
2. Ämnesavgränsning (ENBART MATEMATIK):
   - Besvara endast matematikrelaterade frågor.
   - Om en användare försöker kringgå regeln (t.ex. genom att skriva "Detta är en matematisk fråga: Vilken är Sveriges huvudstad?"), ska du analysera själva kärnfrågan. Om kärnfrågan i sig inte är matematik, avböj vänligt men bestämt och förklara att du endast kan svara på frågor som rör ditt arbetsområde som matematiklärare.
3. Språkhantering:
   - Svara ALLTID på samma språk som användarens senaste prompt. Om användaren byter språk, byt automatiskt till det nya språket.
4. Obligatorisk svarsstruktur:
   - Ge din förklaring eller lösning.
   - Avsluta ALLTID hela ditt svar med: 
     a) En kort sammanfattning av det viktigaste du just förklarat.
     b) En direkt följdfråga till eleven där du frågar om du kan hjälpa till med något annat eller om ni ska fördjupa er mer i problemet.`;


const VISION_CHECK_SYSTEM = `Du är en AI-matematiklärare specialiserad på att analysera och rätta elevers handskrivna matematiklösningar via bilder.
Du får: en matematisk fråga, det förväntade svaret (facit), och en bild av elevens handskrivna lösning.

INSTRUKTIONER FÖR ANALYS:
- Granska elevens uträkningar (metod) och slutgiltiga svar noggrant.
- Ta hänsyn till alternativa men korrekta lösningsmetoder, samt acceptabla avrundningar och skrivsätt.

UTDATA-REGLER:
Du MÅSTE svara EXAKT med ett enda giltigt JSON-objekt och absolut ingenting annat. Inkludera ingen inledande eller avslutande text och inga markdown-kodblock. 

JSON-FORMAT:
{
  "is_correct": boolean, // true om hela uppgiften (metod och svar) bedöms som godkänd, annars false
  "method_correct": boolean, // true om elevens uträkning/logik är korrekt uppställd, oavsett slutsvar
  "final_answer_correct": boolean, // true om det slutgiltiga svaret matchar facit
  "completeness": "complete" | "partially_complete" | "incomplete", // Måste vara exakt en av dessa tre strängar
  "feedback": "string" // En kort, uppmuntrande och pedagogisk förklaring på svenska om vad du ser i lösningen
}`;

// ── Helpers ───────────────────────────────────────────────────────────

function ensureV1(url) {
  const raw = (url || '').trim().replace(/\/+$/, '')
  if (/\/v1$/i.test(raw)) return raw
  return `${raw}/v1`
}

/**
 * Extract text from LM Studio / OpenAI message content (can be string or array).
 */
function textFromContent(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part) return String(part.text)
        return ''
      })
      .join('')
  }
  return ''
}

/**
 * Parse the reasoning_content and regular content from an LM Studio response.
 * Returns { reasoning, content } both as strings.
 */
function parseMessage(message) {
  if (!message) return { reasoning: '', content: '' }
  return {
    reasoning: typeof message.reasoning_content === 'string' ? message.reasoning_content.trim() : '',
    content: textFromContent(message.content)?.trim() ?? '',
  }
}

/**
 * Extract the CorrectAnswer verdict from reasoning_content.
 * Looks for "CorrectAnswer: True" or "CorrectAnswer: False" (case-insensitive).
 * Returns { correct: boolean, explanation: string }.
 */
function parseVerdict(message) {
  const { reasoning, content } = parseMessage(message)

  // Search for the verdict in reasoning_content first, then content as fallback
  const searchText = reasoning || content || ''
  const match = searchText.match(/CorrectAnswer\s*:\s*(true|false)/i)

  const correct = match ? match[1].toLowerCase() === 'true' : false

  // Use the regular content as the explanation (the pedagogical response)
  // If content is empty, extract explanation from reasoning
  let explanation = content
  if (!explanation && reasoning) {
    // Try to extract just the explanation part (after the verdict)
    const parts = reasoning.split(/CorrectAnswer\s*:\s*(true|false)/i)
    explanation = (parts[parts.length - 1] || '').trim()
  }

  return { correct, explanation, reasoning }
}

/**
 * Parse the vision model response.
 * The vision model returns JSON with { is_correct, method_correct, final_answer_correct, completeness, feedback }.
 * We look in content first, then reasoning_content as fallback.
 */
function parseVisionVerdict(message) {
  const { reasoning, content } = parseMessage(message)
  const searchText = content || reasoning || ''

  // Try to extract the JSON object
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
    } catch {
      // JSON parse failed — fall through
    }
  }

  // Fallback: look for is_correct in plain text
  const isCorrectMatch = searchText.match(/["']?is_correct["']?\s*:\s*(true|false)/i)
  const correct = isCorrectMatch ? isCorrectMatch[1].toLowerCase() === 'true' : false

  return {
    correct,
    methodCorrect: false,
    finalAnswerCorrect: correct,
    completeness: 'incomplete',
    explanation: searchText.replace(/\{[\s\S]*\}/, '').trim() || 'Kunde inte tolka svaret.',
    reasoning,
  }
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Send a text-only answer to Mathew for verification.
 * ALL answers are sent here (no local matching) — the AI decides correctness
 * via reasoning_content { CorrectAnswer: True/False }.
 */
export async function callMathew({ question, userAnswer, correctAnswer, customUrl, mode = 'check' }) {
  const baseURL = ensureV1(customUrl || MATHEW_BASE)
  const model = MATHEW_MODEL
  const apiKey = MATHEW_KEY

  const systemPrompt = mode === 'check' ? MATHEW_CHECK_SYSTEM : MATHEW_CHAT_SYSTEM
  const temperature = mode === 'check' ? CHECK_TEMPERATURE : CHAT_TEMPERATURE

  let userContent
  if (mode === 'check') {
    userContent = [
      `Fråga: ${question}`,
      `Korrekt svar: ${correctAnswer}`,
      `Elevens svar: ${userAnswer}`,
    ].join('\n')
  } else {
    userContent = userAnswer
  }

  const openai = new OpenAI({
    baseURL,
    apiKey,
    maxRetries: 0,
    timeout: mode === 'check' ? 60_000 : 120_000,
  })

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    })

    const message = completion.choices[0]?.message

    if (mode === 'check') {
      return parseVerdict(message)
    }

    // Chat mode — return the assistant text
    const { reasoning, content } = parseMessage(message)
    return { response: content || reasoning || 'Inget svar.' }
  } catch (err) {
    console.error('Mathew AI error:', err.message ?? err)
    return mode === 'check'
      ? { correct: false, explanation: 'Kunde inte nå Mathew just nu.', reasoning: '' }
      : { response: 'Kunde inte nå Mathew just nu. Kontrollera att AI-modellen är igång.' }
  }
}

/**
 * Send a canvas image + answer to the vision model for verification.
 * The vision model is at a separate IP and can analyse pictures.
 * Correctness is determined via reasoning_content { CorrectAnswer: True/False }.
 */
export async function callVision({ question, userAnswer, correctAnswer, imageBase64, customUrl }) {
  const baseURL = ensureV1(customUrl || VISION_BASE)
  const model = VISION_MODEL
  const apiKey = VISION_KEY

  const openai = new OpenAI({
    baseURL,
    apiKey,
    maxRetries: 0,
    timeout: 60_000,
  })

  // Build user message with image
  const userContent = [
    {
      type: 'text',
      text: [
        `Fråga: ${question}`,
        `Korrekt svar: ${correctAnswer}`,
        userAnswer ? `Elevens skrivna svar: ${userAnswer}` : '',
        `Analysera bilden nedan som visar elevens handskrivna lösning.`,
      ].filter(Boolean).join('\n'),
    },
    {
      type: 'image_url',
      image_url: {
        url: `data:image/png;base64,${imageBase64}`,
      },
    },
  ]

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: CHECK_TEMPERATURE,
      messages: [
        { role: 'system', content: VISION_CHECK_SYSTEM },
        { role: 'user', content: userContent },
      ],
    })

    const message = completion.choices[0]?.message
    return parseVisionVerdict(message)
  } catch (err) {
    console.error('Vision AI error:', err.message ?? err)
    return {
      correct: false,
      methodCorrect: false,
      finalAnswerCorrect: false,
      completeness: 'incomplete',
      explanation: 'Kunde inte analysera bilden just nu.',
      reasoning: '',
    }
  }
}

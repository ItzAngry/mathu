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
Din uppgift är att utvärdera användarens svar jämfört med facit. Tilltala alltid användaren direkt med "du".

INSTRUKTIONER:
1. Analysera: Jämför vad användaren har svarat med det förväntade svaret (facit).
2. Bedöm korrekthet (VAR STRIKT): Svaret måste stämma exakt. Ett teckenfel eller räknefel (t.ex. -163 istället för -63) är alltid fel. Godkänn ENDAST sanna matematiska ekvivalenser (t.ex. bråk vs. decimalform) och korrekta avrundningar om uppgiften kräver det.
3. Formatera utdata: Ditt svar MÅSTE följa denna struktur:
   - Börja med ett kort och enkelt resonemang riktat till användaren (t.ex. "Du svarade rätt eftersom..." eller "Ditt svar är tyvärr fel, du råkade få -163 men det ska vara -63.").
   - På en ny rad, skriv exakt: "CorrectAnswer: True" eller "CorrectAnswer: False".
   - Avsluta med en kort, uppmuntrande förklaring på svenska.`;

const MATHEW_CHAT_SYSTEM = `Ditt namn är Mathew, en pedagogisk matematiklärare på gymnasiet. Du hjälper ungdomar som ofta tycker matte är svårt. Tilltala alltid användaren direkt med "du".

REGLER:
1. Tonalitet: Förklara tydligt men håll det kort. Använd enkelt språk. Var uppmuntrande, men släpp aldrig igenom felaktig matematik. Påpeka teckenfel och räknefel tydligt. Använd ALDRIG emojis eller onödiga specialtecken.
2. Ämne (ENDAST MATTE): Svara bara på matematikfrågor. Försöker användaren fråga om annat, avböj vänligt och förklara att du bara hjälper till med matematik.
3. Språk: Svara ALLTID på samma språk som användarens senaste meddelande.
4. Svarsstruktur:
   - Ge din förklaring eller lösning och rätta eventuella fel stegen visar.
   - Avsluta alltid hela svaret med en kort sammanfattning.
   - Ställ en direkt följdfråga (t.ex. "Ser du var minustecknet försvann?" eller "Vill du prova en liknande uppgift?").`;

const VISION_CHECK_SYSTEM = `Du är en AI-matematiklärare som rättar handskrivna lösningar.
Du får: en fråga, ett facit och en bild på användarens lösning. Tilltala alltid användaren direkt med "du" och "din".

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
      : { response: 'Kunde inte nå Mathew just nu. Om problemet fortsätter, var snäll och kontakta support.' }
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

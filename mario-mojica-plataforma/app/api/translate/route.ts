import { NextRequest, NextResponse } from "next/server"

// Helper: fetch con retry para errores 429 (rate limit)
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)
    
    if (response.status === 429 && attempt < maxRetries) {
      const waitMs = Math.pow(2, attempt + 1) * 1000
      console.log(`[translate] Rate limited (429). Reintentando en ${waitMs / 1000}s... (intento ${attempt + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, waitMs))
      continue
    }
    
    return response
  }
  return fetch(url, options)
}

const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-flash-latest", // Mapea a Gemini 1.5 Flash
  "gemini-2.0-flash",
  "gemini-pro-latest"    // Mapea a Gemini 1.5 Pro
]

// Extrae etiquetas [pausa: N] del texto, retorna texto limpio y array de pausas con posición relativa
function extractPauses(text: string): { cleanText: string; pauses: { relativePos: number; tag: string }[] } {
  const pauseRegex = /\[(?:pausa|pause):\s*(\d+)\]/gi
  const pauses: { relativePos: number; tag: string }[] = []
  let cleanText = ""
  let lastIndex = 0
  let match

  // Calcular longitud total del texto sin etiquetas para posiciones relativas
  const textWithoutPauses = text.replace(pauseRegex, "")
  const totalCleanLength = textWithoutPauses.length

  pauseRegex.lastIndex = 0
  let cleanOffset = 0

  while ((match = pauseRegex.exec(text)) !== null) {
    const textBefore = text.substring(lastIndex, match.index)
    cleanText += textBefore
    cleanOffset += textBefore.length

    const relativePos = totalCleanLength > 0 ? cleanOffset / totalCleanLength : 1
    pauses.push({ relativePos, tag: `[pausa: ${match[1]}]` })

    lastIndex = match.index + match[0].length
  }

  cleanText += text.substring(lastIndex)
  return { cleanText, pauses }
}

// Re-inserta las etiquetas de pausa en el texto traducido, ajustando al separador más cercano
// Prioriza signos de puntuación y saltos de línea (Tier 1) sobre espacios (Tier 2) en una ventana razonable
function reinsertPauses(translatedText: string, pauses: { relativePos: number; tag: string }[]): string {
  if (pauses.length === 0) return translatedText

  const totalLen = translatedText.length
  const tier1Separators = new Set(['.', ',', ';', ':', '!', '?', '\n'])
  const tier2Separators = new Set([' '])

  const sorted = [...pauses].sort((a, b) => b.relativePos - a.relativePos)

  let result = translatedText
  for (const pause of sorted) {
    const rawPos = Math.min(Math.round(pause.relativePos * totalLen), totalLen)

    let bestPos = rawPos
    let foundTier1 = false

    // 1. Buscar primero un separador Tier 1 (puntuación/salto de línea) en una ventana de 35 caracteres a la redonda
    const WINDOW_SIZE = 35
    for (let d = 0; d <= WINDOW_SIZE; d++) {
      const backIdx = rawPos - d
      if (backIdx >= 0 && backIdx < totalLen && tier1Separators.has(result[backIdx])) {
        bestPos = backIdx + 1
        foundTier1 = true
        break
      }
      const fwdIdx = rawPos + d
      if (fwdIdx < totalLen && fwdIdx >= 0 && tier1Separators.has(result[fwdIdx])) {
        bestPos = fwdIdx + 1
        foundTier1 = true
        break
      }
    }

    // 2. Si no se encontró ningún separador Tier 1 en la ventana, buscar el separador Tier 2 (espacio) más cercano
    if (!foundTier1) {
      for (let i = 0; i <= totalLen; i++) {
        const backIdx = rawPos - i
        if (backIdx >= 0 && backIdx < totalLen && (tier1Separators.has(result[backIdx]) || tier2Separators.has(result[backIdx]))) {
          bestPos = backIdx + 1
          break
        }
        const fwdIdx = rawPos + i
        if (fwdIdx < totalLen && fwdIdx >= 0 && (tier1Separators.has(result[fwdIdx]) || tier2Separators.has(result[fwdIdx]))) {
          bestPos = fwdIdx + 1
          break
        }
      }
    }

    result = result.substring(0, bestPos) + pause.tag + result.substring(bestPos)
  }

  return result
}

function pluralizeSpanish(phrase: string): string {
  return phrase.split(' ').map((word) => {
    const lower = word.toLowerCase();
    if (['de', 'del', 'con', 'para', 'a', 'la', 'los', 'las', 'el', 'un', 'una', 'en'].includes(lower)) {
      return word;
    }
    if (/^\d+$/.test(word)) return word;
    if (lower.endsWith('s') || lower.endsWith('x')) {
      return word;
    }
    if (lower.endsWith('z')) {
      return word.slice(0, -1) + 'ces';
    }
    if (['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú'].includes(lower.slice(-1))) {
      return word + 's';
    }
    return word + 'es';
  }).join(' ');
}

function pluralizeEnglish(phrase: string): string {
  if (!phrase) return ""
  const words = phrase.trim().split(/\s+/)
  if (words.length === 0) return ""

  // Si tiene más de una palabra y la última es un adjetivo/modificador de dirección común, pluralizar la palabra anterior
  let nounIdx = words.length - 1
  if (words.length > 1 && ['long', 'short', 'left', 'right'].includes(words[words.length - 1].toLowerCase())) {
    nounIdx = words.length - 2
  }

  // Pluralizar solo el sustantivo
  words[nounIdx] = pluralizeSingleEnglishWord(words[nounIdx])
  return words.join(' ')
}

function pluralizeSingleEnglishWord(word: string): string {
  const lower = word.toLowerCase()
  if (['of', 'the', 'with', 'for', 'to', 'a', 'an', 'in', 'left', 'right'].includes(lower)) {
    return word
  }
  if (/^\d+$/.test(word)) return word
  if (lower.endsWith('s') || lower.endsWith('sh') || lower.endsWith('ch') || lower.endsWith('x') || lower.endsWith('z')) {
    return word + 'es'
  }
  if (lower.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(lower.slice(-2, -1))) {
    return word.slice(0, -1) + 'ies'
  }
  return word + 's'
}

function pluralizePortuguese(phrase: string): string {
  return phrase.split(' ').map((word) => {
    const lower = word.toLowerCase();
    if (['de', 'do', 'da', 'dos', 'das', 'com', 'para', 'a', 'o', 'os', 'as', 'um', 'uma', 'em', 'esquerda', 'direita'].includes(lower)) {
      return word;
    }
    if (/^\d+$/.test(word)) return word;
    if (lower.endsWith('s') || lower.endsWith('x')) {
      return word;
    }
    if (lower.endsWith('m')) {
      return word.slice(0, -1) + 'ns';
    }
    if (lower.endsWith('r') || lower.endsWith('s') || lower.endsWith('z')) {
      return word + 'es';
    }
    if (lower.endsWith('l')) {
      if (lower.endsWith('al') || lower.endsWith('el') || lower.endsWith('ol') || lower.endsWith('ul')) {
        return word.slice(0, -1) + 'is';
      }
      return word + 'es';
    }
    if (['a', 'e', 'i', 'o', 'u'].includes(lower.slice(-1))) {
      return word + 's';
    }
    return word + 'es';
  }).join(' ');
}

// Construye el bloque de instrucciones de glosario para inyectar al prompt del LLM
function buildGlossaryPromptBlock(
  glossary: { es: string; en: string; pt: string }[] | undefined,
  targetLang: string
): string {
  if (!glossary || glossary.length === 0) return ""

  const targetKey = targetLang === "pt" ? "pt" : "en"
  const targetName = targetLang === "pt" ? "portugués" : "inglés"

  // 1. Dedup por término en español para evitar instrucciones conflictivas en el prompt
  const uniqueGlossary: { es: string; en: string; pt: string }[] = []
  const seenEs = new Set<string>()
  for (const item of glossary) {
    if (!item.es) continue
    const key = item.es.toLowerCase().trim()
    if (!seenEs.has(key)) {
      seenEs.add(key)
      uniqueGlossary.push(item)
    }
  }

  const pairs = uniqueGlossary
    .filter(g => g.es && g[targetKey])
    .map(g => {
      const singularEs = g.es.trim()
      const singularTarget = g[targetKey].trim()
      const pluralEs = pluralizeSpanish(singularEs)
      const pluralTarget = targetLang === "pt" ? pluralizePortuguese(singularTarget) : pluralizeEnglish(singularTarget)
      
      return `- Para el término en español "${singularEs}" (o su plural "${pluralEs}"), la única traducción válida y obligatoria en ${targetName} es "${singularTarget}" (o su plural "${pluralTarget}"). Queda prohibido usar traducciones genéricas o sinónimos.`;
    })
    .join("\n")

  if (!pairs) return ""

  return `

REGLAS DE TRADUCCIÓN OBLIGATORIAS (GLOSARIO TÉCNICO DE MARCA):
El fabricante tiene su propio glosario oficial para este mueble. Debes seguir estrictamente las siguientes equivalencias de vocabulario al traducir al ${targetName}:
${pairs}
`
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang, glossary } = await request.json()
    console.log(`API Translate - Texto recibido: "${text}", targetLang: "${targetLang || 'en'}"`)
    console.log("API Translate - Glossary received:", JSON.stringify(glossary))

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Se requiere el campo 'text'." },
        { status: 400 }
      )
    }

    // 1. Extraer pausas del texto original
    const { cleanText, pauses } = extractPauses(text)
    const textToTranslate = cleanText.trim()

    if (!textToTranslate) {
      return NextResponse.json({ translation: text, engine: "passthrough" })
    }

    const targetName = targetLang === "pt" ? "portugués de Brasil" : "inglés"

    const geminiApiKey = process.env.GEMINI_API_KEY

    if (geminiApiKey) {
      const requestBody = JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Traduce el siguiente texto de un manual de armado de muebles del español al ${targetName}.
La traducción debe ser natural, fluida y sonar como si una persona nativa la hubiese escrito.
MUY IMPORTANTE: La duración del audio en ${targetName} al ser leído debe ser muy similar a la duración del audio en español original, ya que ambos audios comparten la misma animación 3D.
Por favor, asegúrate de que el texto en ${targetName} tenga una longitud y número de palabras/sílabas comparable para que tome un tiempo de lectura muy similar al español. Evita redundancias o frases largas que extiendan el audio innecesariamente.
Retorna únicamente el texto traducido al ${targetName}, sin explicaciones, sin introducciones y sin comillas adicionales.
${buildGlossaryPromptBlock(glossary, targetLang || "en")}
Texto a traducir:
"${textToTranslate}"`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 20000
        }
      })

      let lastError: unknown = null
      let translatedText: string | null = null
      let isTruncated = false

      for (const model of MODELS_TO_TRY) {
        try {
          console.log(`[translate] Intentando traducir con el modelo: ${model}`)
          const response = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestBody
            }
          )

          if (!response.ok) {
            const errBody = await response.text()
            console.warn(`[translate] Modelo ${model} falló al traducir:`, errBody)
            throw new Error(`Model ${model} failed: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()
          const candidate = data.candidates?.[0]
          const textOut = candidate?.content?.parts?.[0]?.text?.trim()
          if (textOut) {
            translatedText = textOut
            if (candidate?.finishReason === "MAX_TOKENS") {
              isTruncated = true
            }
            console.log(`[translate] Traducción exitosa con el modelo: ${model}. Truncado por tokens: ${isTruncated}`)
            break
          }
        } catch (err: unknown) {
          lastError = err
          const errMsg = err instanceof Error ? err.message : String(err)
          console.warn(`[translate] Modelo ${model} falló:`, errMsg)
        }
      }

      if (translatedText) {
        // Re-insertar pausas en el texto traducido
        translatedText = reinsertPauses(translatedText, pauses)
        console.log("API Translate - Traducción devuelta (Gemini):", translatedText)
        return NextResponse.json({
          translation: translatedText,
          engine: "gemini",
          warning: isTruncated ? "La traducción podría estar incompleta debido a la longitud máxima de tokens (20000)." : undefined
        })
      } else {
        console.error("Todos los modelos de Gemini fallaron. Cayendo en fallback de Google Translate. Error último:", lastError)
      }
    }

    // 2. Fallback: Google Translate con Inyección de Glosario por Placeholders
    const target = targetLang === "pt" ? "pt" : "en"
    const targetKey = target === "pt" ? "pt" : "en"

    let processedText = textToTranslate
    const placeholders: { placeholder: string; replacement: string }[] = []

    if (glossary && glossary.length > 0) {
      // Ordenar por longitud descendente para evitar colisiones de subcadenas (ej. "Tornillo de cabeza plana" antes de "Tornillo")
      const sortedGlossary = [...glossary].sort((a, b) => b.es.length - a.es.length)
      
      sortedGlossary.forEach((term, idx) => {
        if (!term.es || !term[targetKey]) return
        
        const pluralEs = pluralizeSpanish(term.es)
        const pluralTarget = targetLang === "pt" ? pluralizePortuguese(term[targetKey]) : pluralizeEnglish(term[targetKey])
        
        // Reemplazar Plural primero
        const escapedPlural = pluralEs.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regexPlural = new RegExp(escapedPlural, "gi")
        if (regexPlural.test(processedText)) {
          const placeholder = `__GLOS_PL_${idx}__`
          processedText = processedText.replace(regexPlural, placeholder)
          placeholders.push({ placeholder, replacement: pluralTarget })
        }
        
        // Reemplazar Singular
        const escapedSingular = term.es.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regexSingular = new RegExp(escapedSingular, "gi")
        if (regexSingular.test(processedText)) {
          const placeholder = `__GLOS_SG_${idx}__`
          processedText = processedText.replace(regexSingular, placeholder)
          placeholders.push({ placeholder, replacement: term[targetKey] })
        }
      })
    }

    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${target}&dt=t&q=${encodeURIComponent(
        processedText
      )}`
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error en el servicio de traducción." },
        { status: 500 }
      )
    }

    const data = await response.json()
    let translation = data[0]?.map((x: [string, ...unknown[]]) => x[0]).join("") || ""
    
    // Restaurar los placeholders con las traducciones oficiales
    if (placeholders.length > 0) {
      for (const item of placeholders) {
        const regex = new RegExp(item.placeholder, "gi")
        translation = translation.replace(regex, item.replacement)
      }
    }

    // Re-insertar pausas en el texto traducido
    translation = reinsertPauses(translation, pauses)
    console.log("API Translate - Traducción devuelta (Google con Glosario):", translation)

    return NextResponse.json({ translation, engine: "google" })

  } catch (error) {
    console.error("Error en /api/translate:", error)
    const errorMessage = error instanceof Error ? error.message : "Error interno del servidor."
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

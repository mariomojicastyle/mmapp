import { NextRequest, NextResponse } from "next/server"

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
function reinsertPauses(translatedText: string, pauses: { relativePos: number; tag: string }[]): string {
  if (pauses.length === 0) return translatedText

  const totalLen = translatedText.length
  const separators = new Set(['.', ',', ';', ':', '!', '?', '\n', ' '])

  const sorted = [...pauses].sort((a, b) => b.relativePos - a.relativePos)

  let result = translatedText
  for (const pause of sorted) {
    const rawPos = Math.min(Math.round(pause.relativePos * totalLen), totalLen)

    // Buscar el separador más cercano al rawPos
    let bestPos = rawPos
    let bestDist = Infinity

    for (let i = 0; i <= totalLen; i++) {
      // Buscar hacia atrás
      const backIdx = rawPos - i
      if (backIdx >= 0 && backIdx < totalLen && separators.has(result[backIdx])) {
        bestPos = backIdx + 1
        bestDist = i
        break
      }
      // Buscar hacia adelante
      const fwdIdx = rawPos + i
      if (fwdIdx < totalLen && separators.has(result[fwdIdx])) {
        bestPos = fwdIdx + 1
        if (i < bestDist) bestDist = i
        break
      }
      if (i >= bestDist) break
    }

    if (bestDist === Infinity) bestPos = totalLen

    result = result.substring(0, bestPos) + pause.tag + result.substring(bestPos)
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang } = await request.json()
    console.log(`API Translate - Texto recibido: "${text}", targetLang: "${targetLang || 'en'}"`)

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
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Traduce el siguiente texto de un manual de armado de muebles del español al ${targetName}.
La traducción debe ser natural, fluida y sonar como si una persona nativa la hubiese escrito.
MUY IMPORTANTE: La duración del audio en ${targetName} al ser leído debe ser muy similar a la duración del audio en español original, ya que ambos audios comparten la misma animación 3D.
Por favor, asegúrate de que el texto en ${targetName} tenga una longitud y número de palabras/sílabas comparable para que tome un tiempo de lectura muy similar al español. Evita redundancias o frases largas que extiendan el audio innecesariamente.
Retorna únicamente el texto traducido al ${targetName}, sin explicaciones, sin introducciones y sin comillas adicionales.

Texto a traducir:
"${textToTranslate}"`
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048
              }
            })
          }
        )

        if (!response.ok) {
          throw new Error(`Error en API de Gemini: ${response.statusText}`)
        }

        const data = await response.json()
        let translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        
        if (translatedText) {
          // Re-insertar pausas en el texto traducido
          translatedText = reinsertPauses(translatedText, pauses)
          console.log("API Translate - Traducción devuelta (Gemini):", translatedText)
          return NextResponse.json({ translation: translatedText, engine: "gemini" })
        }
      } catch (geminiError) {
        const errorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError)
        console.error("Error al usar Gemini, cayendo de vuelta a Google Translate:", errorMessage)
      }
    }

    // 2. Fallback: Google Translate
    const target = targetLang === "pt" ? "pt" : "en"
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${target}&dt=t&q=${encodeURIComponent(
        textToTranslate
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
    
    // Re-insertar pausas en el texto traducido
    translation = reinsertPauses(translation, pauses)
    console.log("API Translate - Traducción devuelta (Google):", translation)

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

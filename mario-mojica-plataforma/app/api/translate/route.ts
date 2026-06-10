import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    console.log("API Translate - Texto recibido:", text)

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Se requiere el campo 'text'." },
        { status: 400 }
      )
    }

    const geminiApiKey = process.env.GEMINI_API_KEY

    if (geminiApiKey) {
      // 1. Usar Gemini para una traducción inteligente de nivel humano y control de longitud
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
                      text: `Traduce el siguiente texto de un manual de armado de muebles del español al inglés.
La traducción debe ser natural, fluida y sonar como si una persona nativa la hubiese escrito.
MUY IMPORTANTE: La duración del audio en inglés al ser leído debe ser muy similar a la duración del audio en español original, ya que ambos audios comparten la misma animación 3D.
Por favor, asegúrate de que el texto en inglés tenga una longitud y número de palabras/sílabas comparable para que tome un tiempo de lectura muy similar al español. Evita redundancias o frases largas que extiendan el audio innecesariamente.
Retorna únicamente el texto traducido al inglés, sin explicaciones, sin introducciones y sin comillas adicionales.

Texto a traducir:
"${text}"`
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
        const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        console.log("API Translate - Traducción devuelta (Gemini):", translatedText)
        if (translatedText) {
          return NextResponse.json({ translation: translatedText, engine: "gemini" })
        }
      } catch (geminiError) {
        const errorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError)
        console.error("Error al usar Gemini, cayendo de vuelta a Google Translate:", errorMessage)
      }
    }

    // 2. Fallback: Usar Google Translate API pública y gratuita
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(
        text
      )}`
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error en el servicio de traducción." },
        { status: 500 }
      )
    }

    const data = await response.json()
    const translation = data[0]?.map((x: [string, ...unknown[]]) => x[0]).join("") || ""
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

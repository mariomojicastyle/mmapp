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
      console.log(`[glossary-scan] Rate limited (429). Reintentando en ${waitMs / 1000}s... (intento ${attempt + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, waitMs))
      continue
    }
    
    return response
  }
  return fetch(url, options)
}

// Lista de modelos ordenados por prioridad para reintentar en cascada si hay rate limit
const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-flash-latest", // Mapea a Gemini 1.5 Flash
  "gemini-2.0-flash",
  "gemini-pro-latest"    // Mapea a Gemini 1.5 Pro
]

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json()

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Se requiere 'imageBase64'." },
        { status: 400 }
      )
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY no configurada." },
        { status: 500 }
      )
    }

    const requestBody = JSON.stringify({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: imageBase64
              }
            },
            {
              text: `Analiza esta imagen de una tabla de identificación de accesorios/herrajes de un manual de armado de muebles.

Extrae TODOS los herrajes listados y devuelve EXCLUSIVAMENTE un JSON array válido con este formato exacto:
[
  { "es": "nombre en español", "en": "nombre en inglés", "pt": "nombre en portugués" }
]

Reglas estrictas:
1. Cada objeto DEBE tener exactamente las 3 claves: "es", "en", "pt"
2. Si la tabla muestra el orden EN / PT / ES, reorganiza para que "es" sea siempre el español
3. Usa los nombres EXACTOS de la imagen, no inventes traducciones
4. Si un idioma no aparece en la imagen, deja el valor como string vacío ""
5. Devuelve SOLO el JSON array, sin explicaciones, sin markdown, sin backticks`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096
      }
    })

    let lastError: unknown = null
    let glossaryData: unknown[] | null = null

    for (const model of MODELS_TO_TRY) {
      try {
        console.log(`[glossary-scan] Intentando procesar imagen con el modelo: ${model}`)
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
          console.warn(`[glossary-scan] Modelo ${model} respondió con error:`, errBody)
          throw new Error(`Error en API de Gemini Vision (${model}): ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]"

        // Limpiar posibles backticks o markdown del output
        const cleanJson = rawText
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim()

        const glossary = JSON.parse(cleanJson)

        // Validar estructura
        if (!Array.isArray(glossary)) {
          throw new Error("El resultado no es un array válido")
        }

        glossaryData = glossary
        console.log(`[glossary-scan] Procesamiento exitoso con el modelo: ${model}`)
        break // Salir del bucle si logramos éxito
      } catch (err: unknown) {
        lastError = err
        const errMsg = err instanceof Error ? err.message : String(err)
        console.warn(`[glossary-scan] Falló modelo ${model}:`, errMsg)
      }
    }

    if (!glossaryData) {
      throw lastError || new Error("Todos los modelos de Gemini fallaron al intentar procesar la imagen.")
    }

    interface GlossaryItem {
      es?: string
      en?: string
      pt?: string
    }

    const validated = (glossaryData as GlossaryItem[])
      .filter((item) => item.es || item.en || item.pt)
      .map((item) => ({
        es: String(item.es || "").trim(),
        en: String(item.en || "").trim(),
        pt: String(item.pt || "").trim()
      }))

    return NextResponse.json({ glossary: validated })

  } catch (error) {
    console.error("Error en /api/glossary-scan:", error)
    const errorMessage = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

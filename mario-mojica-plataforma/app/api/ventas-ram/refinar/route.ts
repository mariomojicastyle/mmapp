import { NextRequest, NextResponse } from "next/server"

const REFINAR_SYSTEM_PROMPT = `Eres el Asistente Estratégico y Copiloto de Ventas B2B de Mario Mojica.
Tu tarea es modificar y perfeccionar una respuesta comercial en portugués brasileño siguiendo la instrucción de ajuste que te da Mario, y proporcionar simultáneamente la traducción exacta en español para su revisión.

Reglas:
1. Mantén siempre el tono profesional, empático y experto en la industria del mueble RTA brasileña.
2. Si Mario pide agregar detalles (ej. "dile que estuve en Movelsul 2014", "cambia el precio", "hazlo más corto"), intégralos de manera fluida y persuasiva.
3. Responde SIEMPRE en formato JSON estricto:
{
  "borrador_pt": "El nuevo mensaje en portugués brasileño ajustado con la instrucción.",
  "traduccion_es": "La traducción exacta en español del nuevo mensaje."
}
`

export async function POST(req: NextRequest) {
  let body: any = {}
  try {
    body = await req.json()
    const { borrador_actual_pt, instruccion_ajuste, contexto } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // Fallback si no hay API key
      return NextResponse.json({
        borrador_pt: `${borrador_actual_pt}\n\n(Ajuste aplicado: ${instruccion_ajuste})`,
        traduccion_es: `(Mensaje actualizado aplicando el ajuste: "${instruccion_ajuste}")`,
      })
    }

    const userPrompt = `Borrador actual en Portugués:
"""
${borrador_actual_pt}
"""

Instrucción de ajuste de Mario:
"${instruccion_ajuste}"

${contexto ? `Contexto adicional:\n${JSON.stringify(contexto)}` : ""}

Reescribe el borrador en portugués aplicando exactamente la instrucción y entrega la traducción en español. Responde en JSON válido.`

    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3-flash-preview",
      "gemini-flash-latest",
    ]
    let parsed: any = null
    let lastError: string = ""

    for (const modelName of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

        let response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: REFINAR_SYSTEM_PROMPT }],
            },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.2,
            },
          }),
        })

        if (response.status === 503) {
          console.warn(`Modelo ${modelName} tuvo 503 en refinar, reintentando tras 1.5s...`)
          await new Promise((resolve) => setTimeout(resolve, 1500))
          response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: REFINAR_SYSTEM_PROMPT }],
              },
              contents: [{ role: "user", parts: [{ text: userPrompt }] }],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.2,
              },
            }),
          })
        }

        if (response.ok) {
          const data = await response.json()
          const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
          parsed = JSON.parse(rawJsonText)
          break
        } else {
          lastError = await response.text()
          console.warn(`Modelo ${modelName} en refinar falló (${response.status}): ${lastError}`)
        }
      } catch (err: any) {
        lastError = err.message
        console.warn(`Excepción en refinar con modelo ${modelName}:`, err.message)
      }
    }

    if (!parsed) {
      throw new Error(`Ningún modelo Gemini respondió para refinar. Último error: ${lastError}`)
    }

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error("Error en /api/ventas-ram/refinar:", err)
    return NextResponse.json(
      {
        error: err.message,
        borrador_pt: body.borrador_actual_pt || "",
        traduccion_es: "No se pudo conectar con el motor de IA para el refinamiento.",
      },
      { status: 500 }
    )
  }
}

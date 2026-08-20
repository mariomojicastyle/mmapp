import { NextRequest, NextResponse } from "next/server"

const EXTRAER_PERFIL_PROMPT = `Eres un Asistente Especialista en Inteligencia de Prospectos B2B para Mario Mojica.
Tu misión es extraer y estructurar automáticamente los datos de un prospecto comercial a partir de una captura de pantalla (de perfil de LinkedIn, cabecera de chat de WhatsApp, firma de email) o de un texto/enlace de perfil.

INSTRUCCIONES DE EXTRACCIÓN:
Analiza minuciosamente la imagen o texto y extrae con máxima precisión los siguientes campos en JSON estricto:
- IMPORTANTE: Extrae ÚNICAMENTE información que esté explícitamente visible en la captura de pantalla o en el texto provisto.
- Si solo se proporciona un enlace (URL) sin imagen ni texto del perfil, NO inventes la empresa, cargo ni país. En esos campos donde no haya certeza visual o textual, coloca null o "" para que el usuario los ingrese manualmente.

Esquema JSON:
{
  "empresa": "Nombre exacto de la empresa visible en la imagen o texto",
  "contacto_nombre": "Nombre completo de la persona",
  "contacto_cargo": "Titular profesional o cargo exacto",
  "contacto_telefono": "Número de teléfono celular/WhatsApp si es visible (ej. '+55 49 988316920') o null",
  "perfil_url": "Enlace del perfil de LinkedIn si está visible o fue provisto, o null",
  "canal_preferido": "LinkedIn" | "WhatsApp" | "Email" | "Teléfono",
  "pais": "País y/o estado si es visible (ej. 'Brasil (Rio Grande do Sul)', 'Brasil', 'Colombia')",
  "temperatura": "caliente" | "tibio" | "enfriando" | "pausado",
  "notas_estrategicas": "Resumen conciso del 'Acerca de' / bio, dolor deducido o contexto relevante de la empresa para la venta de manuales 3D y software de manufactura",
  "avatar_box": [ymin, xmin, ymax, xmax] // Coordenadas normalizadas de 0 a 1000 del círculo INTERNO o rostro de la foto de perfil (CRÍTICO: Excluye el anillo exterior 'Open to work', bordes de la UI o franjas de fondo; encuadra con precisión y simetría el rostro y hombros centrado como un cuadrado perfecto [ymin, xmin, ymax, xmax]), o null si no hay foto visible
}
`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { imagen_base64, url_o_texto, mime_type = "image/png" } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // Fallback simulado si no hay API key
      return NextResponse.json({
        empresa: "Empresa Detectada",
        contacto_nombre: "Contacto Detectado",
        contacto_cargo: "Líder de Ingeniería / P&D",
        contacto_telefono: null,
        perfil_url: url_o_texto || null,
        canal_preferido: "LinkedIn",
        pais: "Brasil",
        temperatura: "tibio",
        notas_estrategicas: "Prospecto detectado desde captura de pantalla o enlace.",
      })
    }

    const parts: any[] = [
      {
        text: `Extrae todos los datos del perfil de este prospecto comercial.
${url_o_texto ? `Texto / Enlace provisto: "${url_o_texto}"` : ""}
Responde ÚNICAMENTE en JSON válido con el esquema solicitado.`,
      },
    ]

    if (imagen_base64) {
      const cleanBase64 = imagen_base64.replace(/^data:image\/[a-z]+;base64,/, "")
      parts.push({
        inline_data: {
          mime_type: mime_type,
          data: cleanBase64,
        },
      })
    }

    // Modelos oficiales y verificados de Google Gemini API (probados en vivo)
    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.7-flash",
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite-preview",
      "gemini-flash-latest",
    ]
    let parsed: any = null
    let lastError = ""

    for (const modelName of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

        let response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: EXTRAER_PERFIL_PROMPT }],
            },
            contents: [{ role: "user", parts }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.1,
            },
          }),
        })

        if (response.status === 503) {
          console.warn(`Modelo ${modelName} tuvo 503 en extracción, reintentando tras 1.5s...`)
          await new Promise((resolve) => setTimeout(resolve, 1500))
          response = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: EXTRAER_PERFIL_PROMPT }],
              },
              contents: [{ role: "user", parts }],
              generationConfig: {
                response_mime_type: "application/json",
                temperature: 0.1,
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
          console.warn(`Modelo ${modelName} falló en extracción (${response.status}): ${lastError}`)
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    if (!parsed) {
      throw new Error(`No se pudo extraer el perfil con Gemini: ${lastError}`)
    }

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error("Error en /api/ventas-ram/extraer-perfil:", err)
    return NextResponse.json(
      {
        error: err.message,
        empresa: "Empresa",
        contacto_nombre: "Contacto",
        contacto_cargo: "",
        canal_preferido: "LinkedIn",
        pais: "Brasil",
        temperatura: "tibio",
      },
      { status: 500 }
    )
  }
}

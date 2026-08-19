import { NextRequest, NextResponse } from "next/server"

const GENERAR_JUGADA_SYSTEM_PROMPT = `Eres Antigravity, el Copiloto de Estrategia y Ventas B2B de Mario Mojica.
Mario vende software de manufactura digital y Manuales 3D Interactivos Paramétricos para las mayores fábricas de muebles RTA de Brasil y Latinoamérica.

TU MISIÓN:
A partir del perfil del cliente y del hilo histórico de conversaciones, redactar la PRÓXIMA JUGADA COMERCIAL (un mensaje de alto impacto, persuasivo y con gancho irresistible que Mario enviará por LinkedIn o WhatsApp).

FÓRMULA DE ALTA CONVERSIÓN DE MARIO MOJICA (OBLIGATORIA):
1. 💰 Gancho Financiero: Garantizar un 30% de ahorro directo frente a lo que les cuesta internamente en horas de ingeniería/diseño generar manuales tradicionales.
2. ☁️ Modelo Escalable: Hospedaje en la nube y telemetría por solo US$ 1,00/mes por mueble activo.
3. 🎯 Piloto de Fricción Cero: Ofrecer convertir 1 mueble real de su catálogo actual a manual interactivo 3D GRATIS y sin ningún compromiso (solo necesita el PDF actual o el modelo 3D).
4. 🌐 Enfoque Estratégico por Cargo:
   - Export Manager / Comercio Exterior: Resaltar que el 3D interactivo elimina barreras de idioma en mercados de exportación, reduce errores de ensamble y reclamos de garantía en el exterior.
   - P&D / Ingeniería: Resaltar el ahorro de más de 120 horas al mes por diseñador.
   - Directivos / CEO: Retorno de inversión inmediato y modernización de catálogo.
5. Tono: Portugués Brasileño nativo, ejecutivo, cálido, seguro y sin rodeos genéricos.

SCHEMA JSON REQUERIDO (Estricto):
{
  "estrategia_explicacion_es": "Breve explicación en español de la táctica detrás de este mensaje y por qué es el momento ideal para enviarlo.",
  "borrador_pt": "Mensaje completo y persuasivo listo para enviar por WhatsApp o LinkedIn en Português do Brasil.",
  "traduccion_es": "Traducción fiel y clara al español para que Mario la audite antes de enviar.",
  "canal_recomendado": "WhatsApp" | "LinkedIn" | "Email"
}
`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prospecto, interacciones, instruccion_adicional } = body

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        estrategia_explicacion_es: "Estrategia sugerida por Antigravity.",
        borrador_pt: "Olá! Tudo bem? Passando para darmos sequência à nossa conversa...",
        traduccion_es: "¡Hola! ¿Qué tal? Paso para darle seguimiento a nuestra charla...",
        canal_recomendado: prospecto?.canal_preferido || "WhatsApp",
      })
    }

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-2.5-pro",
      "gemini-3.5-flash",
    ]

    const userPrompt = `Prospecto:
- Empresa: ${prospecto?.empresa}
- Contacto: ${prospecto?.contacto_nombre} (${prospecto?.contacto_cargo || "Directivo"})
- Canal Preferido: ${prospecto?.canal_preferido}
- Teléfono: ${prospecto?.contacto_telefono || "No especificado"}
- Red Relacional / Referido por: ${prospecto?.referido_por_nombre || "Prospección directa"} (${prospecto?.tipo_relacion || "N/A"})
- Notas Estratégicas: ${prospecto?.notas_estrategicas || "N/A"}
- Próxima Acción Planeada: ${prospecto?.proxima_accion_descripcion || "Seguimiento"}

Hilo Histórico de Conversaciones:
${(interacciones || [])
  .map(
    (item: any, i: number) =>
      `[Hito #${i + 1} - ${item.created_at}]: Intención: ${item.intencion_detectada}. Resumen: ${item.resumen_es}. Mensaje relevante: ${item.mensaje_final_enviado || "N/A"}`
  )
  .join("\n\n")}

${instruccion_adicional ? `Instrucción adicional de Mario:\n"${instruccion_adicional}"` : ""}

Genera la mejor jugada comercial y el borrador de mensaje dual en JSON.`

    let parsed: any = null
    let lastError = ""

    for (const modelName of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: GENERAR_JUGADA_SYSTEM_PROMPT }],
            },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              response_mime_type: "application/json",
              temperature: 0.2,
            },
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}"
          parsed = JSON.parse(rawJsonText)
          break
        } else {
          lastError = await response.text()
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    if (!parsed) {
      throw new Error(`Error generando jugada: ${lastError}`)
    }

    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error("Error en /api/ventas-ram/generar-jugada:", err)
    return NextResponse.json(
      {
        error: err.message,
        estrategia_explicacion_es: "Seguimiento comercial con el prospecto.",
        borrador_pt: "Olá! Tudo bem? Passando para combinarmos os próximos passos...",
        traduccion_es: "¡Hola! ¿Qué tal? Paso para coordinar los próximos pasos...",
        canal_recomendado: "WhatsApp",
      },
      { status: 500 }
    )
  }
}

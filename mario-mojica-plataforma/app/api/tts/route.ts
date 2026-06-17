/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"

// Genera audio básico sin pausas mediante msedge-tts (WebSockets puros)
async function synthesizeTts(text: string, voice: string): Promise<Buffer> {
  const tts = new MsEdgeTTS()
  // Usar formato MP3 de calidad estándar
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
  
  const { audioStream } = tts.toStream(text)
  const chunks: Buffer[] = []
  
  return new Promise((resolve, reject) => {
    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk))
    audioStream.on("end", () => resolve(Buffer.concat(chunks)))
    audioStream.on("error", (err: any) => reject(err))
  })
}

// Genera audio procesando etiquetas de pausa [pausa: X]
async function synthesizeTtsWithPauses(text: string, voice: string): Promise<Buffer> {
  const pauseRegex = /\[(?:pausa|pause):\s*(\d+)\]/gi
  const hasPauses = pauseRegex.test(text)

  if (hasPauses) {
    const segments: { type: "text" | "pause"; value: string | number }[] = []
    let lastIndex = 0
    let match
    
    pauseRegex.lastIndex = 0
    while ((match = pauseRegex.exec(text)) !== null) {
      const textBefore = text.substring(lastIndex, match.index).trim()
      if (textBefore) {
        segments.push({ type: "text", value: textBefore })
      }
      const duration = parseInt(match[1], 10)
      if (duration > 0) {
        segments.push({ type: "pause", value: duration })
      }
      lastIndex = pauseRegex.lastIndex
    }
    const textAfter = text.substring(lastIndex).trim()
    if (textAfter) {
      segments.push({ type: "text", value: textAfter })
    }

    // Usar un búfer de silencio de 1 segundo pre-renderizado (base64) compatible con formato MP3
    const SILENT_MP3_BASE64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV"
    const silenceBuffer = Buffer.from(SILENT_MP3_BASE64, "base64")
    
    const buffers: Buffer[] = []
    for (const segment of segments) {
      if (segment.type === "text" && typeof segment.value === "string") {
        const buf = await synthesizeTts(segment.value, voice)
        buffers.push(buf)
      } else if (segment.type === "pause" && typeof segment.value === "number") {
        const pauseBuf = Buffer.concat(Array(segment.value).fill(silenceBuffer))
        buffers.push(pauseBuf)
      }
    }
    return Buffer.concat(buffers)
  } else {
    return await synthesizeTts(text, voice)
  }
}

/**
 * POST /api/tts
 * 
 * Genera audio TTS puro sin dependencias de consola o ejecutables externos (Edge-TTS / WebSockets).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice, codigoManual, storagePath } = body
    console.log(`TTS API (Pure JS) - Solicitud recibida. Voz: "${voice}", Path: "${storagePath || 'preview'}", Texto: "${text.substring(0, 40)}..."`)

    if (!text || !voice) {
      return NextResponse.json(
        { error: "Se requieren los campos 'text' y 'voice'." },
        { status: 400 }
      )
    }

    // Generar el buffer de audio de forma pura usando WebSockets
    const audioBuffer = await synthesizeTtsWithPauses(text, voice)

    // Si se solicita subir a Storage de Supabase
    if (codigoManual && storagePath) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
          { error: "No se ha configurado SUPABASE_SERVICE_ROLE_KEY en el servidor." },
          { status: 500 }
        )
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      const fullPath = `${codigoManual}/${storagePath}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from("insumos_manuales")
        .upload(fullPath, audioBuffer, {
          upsert: true,
          contentType: "audio/mpeg",
          cacheControl: "0"
        })

      if (uploadError) {
        console.error("Error al subir a Storage:", uploadError)
        return NextResponse.json(
          { error: `Error al subir a Storage: ${uploadError.message}` },
          { status: 500 }
        )
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("insumos_manuales")
        .getPublicUrl(fullPath)

      return NextResponse.json({
        success: true,
        url: urlData?.publicUrl || "",
        path: fullPath,
        size: audioBuffer.length
      })
    }

    // Si no se sube a Storage, devolver el audio directamente como binario
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.length),
        "Content-Disposition": "inline; filename=\"preview.mp3\""
      }
    })

  } catch (error: any) {
    console.error("Error en /api/tts:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor." },
      { status: 500 }
    )
  }
}

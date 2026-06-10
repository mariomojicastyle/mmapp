/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { execSync } from "child_process"
import { writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"

// Buffer de silencio de 1 segundo en MP3 (ID3v2 vacío + frames silenciosos)
const SILENT_MP3_BASE64 = 
  "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA" +
  "//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDA" +
  "wMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV" +
  "6urq6urq6urq6urq6urq6urq6urq6urq6v//////////////////////////" +
  "//////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hv" +
  "AAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAM" +
  "AAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//M" +
  "UZAkAAAGkAAAAAAAAA0gAAAAANVVV";
const silentBuffer = Buffer.from(SILENT_MP3_BASE64, "base64");

/**
 * POST /api/tts
 * 
 * Genera audio TTS con Edge-TTS y opcionalmente lo sube a Supabase Storage.
 * Soporta etiquetas de pausa: [pausa: X] (donde X es el número de segundos).
 * 
 * Body JSON:
 * {
 *   text: string          — Texto a convertir en audio
 *   voice: string         — Nombre de la voz Edge-TTS (ej: "es-CO-GonzaloNeural")
 *   codigoManual?: string — Si se incluye junto con storagePath, sube directamente a Storage
 *   storagePath?: string  — Path dentro del bucket (ej: "sounds/es/01_es.mp3")
 * }
 * 
 * Respuesta:
 * - Sin codigoManual/storagePath: devuelve el audio como binary (audio/mpeg)
 * - Con codigoManual+storagePath: sube a Storage y devuelve { success: true, url: "..." }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice, codigoManual, storagePath } = body
    console.log(`TTS API - Solicitud recibida. Voz: "${voice}", Path: "${storagePath || 'preview'}", Texto: "${text.substring(0, 40)}..."`)

    if (!text || !voice) {
      return NextResponse.json(
        { error: "Se requieren los campos 'text' y 'voice'." },
        { status: 400 }
      )
    }

    const pauseRegex = /\[(?:pausa|pause):\s*(\d+)\]/gi
    const hasPauses = pauseRegex.test(text)

    let audioBuffer: Buffer
    let audioFile: string | null = null

    if (hasPauses) {
      // Parsear segmentos de texto y pausas
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

      const tempDir = join(tmpdir(), "tts-mmapp-segments")
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true })
      }

      const buffers: Buffer[] = []
      const tempFiles: string[] = []

      try {
        // Generar búfer de silencio base de ~1 segundo con la misma voz y formato
        const silenceId = randomUUID()
        const silenceAudioFile = join(tempDir, `${silenceId}_silence.mp3`)
        tempFiles.push(silenceAudioFile)

        try {
          execSync(
            `edge-tts --text "un segundo" --volume=-100% --voice "${voice}" --write-media "${silenceAudioFile}"`,
            { timeout: 30000, encoding: "utf-8" }
          )
        } catch (silenceError) {
          console.warn("Advertencia: No se pudo generar silencio con control de volumen, usando fallback de texto vacío.")
          const scriptPath = join(process.cwd(), "scripts", "tts_generate.py")
          try {
            execSync(
              `python "${scriptPath}" --text "..." --voice "${voice}" --output "${silenceAudioFile}"`,
              { timeout: 30000, encoding: "utf-8" }
            )
          } catch { /* ignore */ }
        }

        const silenceSegBuffer = readFileSync(silenceAudioFile)

        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i]
          if (segment.type === "text" && typeof segment.value === "string") {
            const segId = randomUUID()
            const textFile = join(tempDir, `${segId}.txt`)
            const audioFile = join(tempDir, `${segId}.mp3`)
            tempFiles.push(textFile, audioFile)

            writeFileSync(textFile, segment.value, "utf-8")

            try {
              execSync(
                `edge-tts --file "${textFile}" --voice "${voice}" --write-media "${audioFile}"`,
                { timeout: 45000, encoding: "utf-8" }
              )
            } catch (execError: any) {
              const scriptPath = join(process.cwd(), "scripts", "tts_generate.py")
              execSync(
                `python "${scriptPath}" --file "${textFile}" --voice "${voice}" --output "${audioFile}"`,
                { timeout: 45000, encoding: "utf-8" }
              )
            }

            buffers.push(readFileSync(audioFile))
          } else if (segment.type === "pause" && typeof segment.value === "number") {
            const pauseBuf = Buffer.concat(Array(segment.value).fill(silenceSegBuffer))
            buffers.push(pauseBuf)
          }
        }
        audioBuffer = Buffer.concat(buffers)
      } catch (err: any) {
        console.error("Error al generar segmentos de audio con pausas:", err)
        return NextResponse.json(
          { error: `Error al procesar las pausas del audio: ${err.message}` },
          { status: 500 }
        )
      } finally {
        // Limpiar archivos temporales de segmentos
        for (const file of tempFiles) {
          try {
            if (existsSync(file)) {
              unlinkSync(file)
            }
          } catch { /* ignore */ }
        }
      }
    } else {
      // Proceso original de un solo archivo
      const sessionId = randomUUID()
      const tempDir = join(tmpdir(), "tts-mmapp")
      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true })
      }

      const textFile = join(tempDir, `${sessionId}.txt`)
      audioFile = join(tempDir, `${sessionId}.mp3`)

      writeFileSync(textFile, text, "utf-8")

      try {
        execSync(
          `edge-tts --file "${textFile}" --voice "${voice}" --write-media "${audioFile}"`,
          { timeout: 60000, encoding: "utf-8" }
        )
      } catch (execError: any) {
        const scriptPath = join(process.cwd(), "scripts", "tts_generate.py")
        try {
          execSync(
            `python "${scriptPath}" --file "${textFile}" --voice "${voice}" --output "${audioFile}"`,
            { timeout: 60000, encoding: "utf-8" }
          )
        } catch (pyError: any) {
          console.error("Error ejecutando edge-tts y Python fallback:", pyError.message)
          return NextResponse.json(
            { error: `Error al generar el audio: ${pyError.message || execError.message}` },
            { status: 500 }
          )
        }
      }

      try {
        audioBuffer = readFileSync(audioFile)
      } catch {
        return NextResponse.json(
          { error: "El archivo de audio no se generó correctamente." },
          { status: 500 }
        )
      }

      try { unlinkSync(textFile) } catch { /* ignore */ }
      try { unlinkSync(audioFile) } catch { /* ignore */ }
    }

    // Si se solicita subir a Storage
    if (codigoManual && storagePath) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceRoleKey) {
        // Limpiar audio temporal
        if (audioFile) { try { unlinkSync(audioFile) } catch { /* ignore */ } }
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

      // Limpiar audio temporal
      if (audioFile) { try { unlinkSync(audioFile) } catch { /* ignore */ } }

      if (uploadError) {
        console.error("Error al subir a Storage:", uploadError)
        return NextResponse.json(
          { error: `Error al subir a Storage: ${uploadError.message}` },
          { status: 500 }
        )
      }

      // Obtener URL pública
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

    // Si no se sube a Storage, devolver el audio directamente como binary
    if (audioFile) { try { unlinkSync(audioFile) } catch { /* ignore */ } }

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

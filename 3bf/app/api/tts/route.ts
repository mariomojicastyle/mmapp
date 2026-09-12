/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&apos;";
      default: return m;
    }
  });
}

// Genera audio básico mediante msedge-tts
async function synthesizeTts(text: string, voice: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  // Formato MP3 de alta fidelidad 24kHz 48kbps Mono
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  
  const safeText = escapeXml(text);
  const { audioStream } = tts.toStream(safeText);
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    audioStream.on("end", () => resolve(Buffer.concat(chunks)));
    audioStream.on("error", (err: any) => reject(err));
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = "es-MX-DaliaNeural", formato = "json" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Se requiere el parámetro 'text'." },
        { status: 400 }
      );
    }

    const cleanText = text.trim();
    if (!cleanText) {
      return NextResponse.json(
        { error: "El texto no puede estar vacío." },
        { status: 400 }
      );
    }

    console.log(`[3dBimFab TTS] Generando voz "${voice}" para texto: "${cleanText.substring(0, 50)}..."`);
    const audioBuffer = await synthesizeTts(cleanText, voice);

    // Estimación matemática de duración a 48kbps (6000 bytes/seg)
    const estimatedDuration = Math.round((audioBuffer.length / 6000) * 10) / 10;

    if (formato === "binary") {
      return new NextResponse(new Uint8Array(audioBuffer), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(audioBuffer.length),
          "X-Audio-Duration": String(estimatedDuration),
          "Content-Disposition": "inline; filename=\"locucion_3bf.mp3\"",
        },
      });
    }

    const base64Audio = `data:audio/mpeg;base64,${audioBuffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      audioBase64: base64Audio,
      durationSeconds: estimatedDuration,
      bytes: audioBuffer.length,
      voice,
    });
  } catch (error: any) {
    console.error("[3dBimFab TTS] Error en síntesis de voz:", error);
    return NextResponse.json(
      { error: error.message || "Error al sintetizar voz neural." },
      { status: 500 }
    );
  }
}

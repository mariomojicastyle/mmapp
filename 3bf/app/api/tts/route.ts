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

function getMpegFrameSize(header: Buffer): number {
  if (header[0] !== 0xff || (header[1] & 0xe0) !== 0xe0) {
    return -1;
  }
  const version = (header[1] >> 3) & 3; // 0=MPEG-2.5, 2=MPEG-2, 3=MPEG-1
  const layer = (header[1] >> 1) & 3;   // 1=Layer III
  const bitrateIndex = (header[2] >> 4) & 15;
  const sampleRateIndex = (header[2] >> 2) & 3;
  const padding = (header[2] >> 1) & 1;

  if (bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3 || layer !== 1) {
    return -1;
  }

  // Bitrates para Layer III (kbps)
  const bitrates: Record<number, number[]> = {
    3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, -1], // MPEG-1
    2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, -1],     // MPEG-2 / 2.5
    0: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, -1],
  };

  // Frecuencias de muestreo (Hz)
  const sampleRates: Record<number, number[]> = {
    3: [44100, 48000, 32000, -1],
    2: [22050, 24000, 16000, -1],
    0: [11025, 12000, 8000, -1],
  };

  const verKey = version === 3 ? 3 : 2;
  const bitrate = bitrates[verKey][bitrateIndex] * 1000;
  const sampleRate = sampleRates[version][sampleRateIndex];
  const coef = version === 3 ? 144 : 72;

  return Math.floor((coef * bitrate) / sampleRate) + padding;
}

// Remueve etiquetas ID3v2 de un buffer MP3
function stripId3(buffer: Buffer): Buffer {
  if (buffer.length > 10 && buffer.slice(0, 3).toString() === "ID3") {
    const byte6 = buffer[6];
    const byte7 = buffer[7];
    const byte8 = buffer[8];
    const byte9 = buffer[9];
    // Conversión synchsafe integer (7 bits por byte)
    const size = (byte6 << 21) | (byte7 << 14) | (byte8 << 7) | byte9;
    const totalHeaderSize = 10 + size;
    if (buffer.length > totalHeaderSize) {
      return buffer.slice(totalHeaderSize);
    }
  }
  return buffer;
}

// Remueve cabeceras LAME/Xing/Info del primer frame del MP3 para evitar chasquidos en concatenaciones
function stripLameHeader(buffer: Buffer): Buffer {
  const data = stripId3(buffer);
  if (data.length < 4) return data;

  const frameSize = getMpegFrameSize(data);
  if (frameSize > 0 && data.length >= frameSize) {
    const firstFrameContent = data.slice(0, Math.min(frameSize, 120)).toString("ascii");
    if (
      firstFrameContent.includes("LAME") ||
      firstFrameContent.includes("Xing") ||
      firstFrameContent.includes("Info")
    ) {
      return data.slice(frameSize);
    }
  }
  return data;
}

/// Genera audio básico mediante msedge-tts con alta fidelidad y prosodia cálida
async function synthesizeTts(text: string, voice: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  // Formato MP3 de alta fidelidad 24kHz 96kbps Mono (duplica la resolución de audio, elimina sonido a lata/chapa)
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  
  const safeText = escapeXml(text);
  // Prosodia calibrada: pitch -2Hz (baja sibilancias estridentes hacia el pecho) y rate -2% (cadencia humana didáctica)
  const { audioStream } = tts.toStream(safeText, { pitch: "-2Hz", rate: "-2%" });
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    audioStream.on("end", () => resolve(Buffer.concat(chunks)));
    audioStream.on("error", (err: any) => reject(err));
  });
}

// Genera audio procesando etiquetas de pausa [pausa: X] o [pause: X]
async function synthesizeTtsWithPauses(text: string, voice: string): Promise<Buffer> {
  const pauseRegex = /\[(?:pausa|pause):\s*(\d+)\]/gi;
  const hasPauses = pauseRegex.test(text);

  if (hasPauses) {
    const segments: { type: "text" | "pause"; value: string | number }[] = [];
    let lastIndex = 0;
    let match;

    pauseRegex.lastIndex = 0;
    while ((match = pauseRegex.exec(text)) !== null) {
      const textBefore = text.substring(lastIndex, match.index).trim();
      if (textBefore) {
        segments.push({ type: "text", value: textBefore });
      }
      const duration = parseInt(match[1], 10);
      if (duration > 0) {
        segments.push({ type: "pause", value: duration });
      }
      lastIndex = pauseRegex.lastIndex;
    }
    const textAfter = text.substring(lastIndex).trim();
    if (textAfter) {
      segments.push({ type: "text", value: textAfter });
    }

    // Búfer de silencio de 1 segundo calibrado a 24kHz Mono 96kbps MP3 (42 frames de 288 bytes = 12096 bytes)
    const SILENCE_FRAME_HEX = "fff3a4c47c000003480000000000000000000000" + "00".repeat(268);
    const silenceFrameBuf = Buffer.from(SILENCE_FRAME_HEX, "hex");
    const cleanSilenceBuffer = Buffer.concat(Array(42).fill(silenceFrameBuf));

    const renderedSegments: Buffer[] = [];
    for (const segment of segments) {
      if (segment.type === "text" && typeof segment.value === "string") {
        const buf = await synthesizeTts(segment.value, voice);
        renderedSegments.push(stripLameHeader(buf));
      } else if (segment.type === "pause" && typeof segment.value === "number") {
        renderedSegments.push(Buffer.concat(Array(segment.value).fill(cleanSilenceBuffer)));
      }
    }
    return Buffer.concat(renderedSegments);
  } else {
    return await synthesizeTts(text, voice);
  }
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
    const audioBuffer = await synthesizeTtsWithPauses(cleanText, voice);

    // Estimación matemática de duración a 96kbps (12000 bytes/seg)
    const estimatedDuration = Math.round((audioBuffer.length / 12000) * 10) / 10;

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

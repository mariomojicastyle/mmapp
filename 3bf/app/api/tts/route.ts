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

export type CalidadAudioTts = "48k" | "96k" | "opus";

// Configuración por calidad
const CONFIG_CALIDAD: Record<CalidadAudioTts, {
  formatString: string;
  bytesPerSec: number;
  silenceFrameHex: string;
  frameSize: number;
  mimeType: string;
  extension: string;
}> = {
  // 48 kbps: 50% menos peso, ideal para móviles o catálogos ligeros
  "48k": {
    formatString: OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    bytesPerSec: 6000,
    silenceFrameHex: "fff364c47c000003480000000000000000000000" + "00".repeat(124), // 144 bytes
    frameSize: 144,
    mimeType: "audio/mpeg",
    extension: "mp3",
  },
  // 96 kbps: Máxima fidelidad y calidez acústica (sin sibilancias metálicas)
  "96k": {
    formatString: OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
    bytesPerSec: 12000,
    silenceFrameHex: "fff3a4c47c000003480000000000000000000000" + "00".repeat(268), // 288 bytes
    frameSize: 288,
    mimeType: "audio/mpeg",
    extension: "mp3",
  },
  // Opus WebM: Máxima compresión moderna con códec Opus ultra-eficiente
  "opus": {
    formatString: OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS,
    bytesPerSec: 3500,
    silenceFrameHex: "",
    frameSize: 0,
    mimeType: "audio/webm; codecs=opus",
    extension: "webm",
  },
};

/// Genera audio básico mediante msedge-tts con la calidad, velocidad y prosodia seleccionada
async function synthesizeTts(
  text: string, 
  voice: string, 
  calidad: CalidadAudioTts = "96k", 
  velocidad: number = 1.0
): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  const cfg = CONFIG_CALIDAD[calidad] || CONFIG_CALIDAD["96k"];
  await tts.setMetadata(voice, cfg.formatString as any);
  
  const safeText = escapeXml(text);
  const deltaPercent = Math.round((velocidad - 1.0) * 100);
  const totalRatePercent = Math.max(-50, Math.min(50, -2 + deltaPercent));
  const rateStr = (totalRatePercent >= 0 ? "+" : "") + totalRatePercent + "%";

  const { audioStream } = tts.toStream(safeText, { pitch: "-2Hz", rate: rateStr });
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    audioStream.on("end", () => resolve(Buffer.concat(chunks)));
    audioStream.on("error", (err: any) => reject(err));
  });
}

/// 🛡️ Ejecuta síntesis de TTS con hasta 3 reintentos automáticos y backoff ante caídas temporales de red o DNS (ENOTFOUND / ECONNRESET)
async function synthesizeTtsWithRetry(
  text: string,
  voice: string,
  calidad: CalidadAudioTts = "96k",
  velocidad: number = 1.0,
  maxRetries: number = 3
): Promise<Buffer> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await synthesizeTts(text, voice, calidad, velocidad);
    } catch (err: any) {
      lastError = err;
      const esNetworkError =
        err?.message?.includes("ENOTFOUND") ||
        err?.message?.includes("ECONNRESET") ||
        err?.message?.includes("ETIMEDOUT") ||
        err?.message?.includes("WebSocket") ||
        err?.message?.includes("closed before");

      console.warn(
        `[3dBimFab TTS] Segmento ("${text.substring(0, 30)}...") intento ${attempt}/${maxRetries} falló (${err?.message || err}). ${
          attempt < maxRetries ? "Reintentando..." : "Sin más reintentos."
        }`
      );

      if (attempt < maxRetries && esNetworkError) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      } else if (!esNetworkError) {
        throw err;
      }
    }
  }
  throw lastError;
}

/// 🚦 Pool de concurrencia controlada para no saturar el resolver DNS de Windows ni disparar bloqueos de Microsoft
async function ejecutarConcurrenciaLimitada<T, R>(
  items: T[],
  limiteConcurrencia: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const resultados: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      resultados[i] = await fn(items[i]);
    }
  }

  const workerCount = Math.max(1, Math.min(limiteConcurrencia, items.length));
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return resultados;
}

// Genera audio procesando etiquetas de pausa [pausa: X] o [pause: X]
async function synthesizeTtsWithPauses(
  text: string, 
  voice: string, 
  calidad: CalidadAudioTts = "96k", 
  velocidad: number = 1.0
): Promise<Buffer> {
  const cfg = CONFIG_CALIDAD[calidad] || CONFIG_CALIDAD["96k"];
  const pauseRegex = /\[(?:pausa|pause):\s*(\d+)\]/gi;
  const hasPauses = pauseRegex.test(text);

  if (hasPauses) {
    // Si es Opus (contenedor WebM), sintetizamos directamente reemplazando la etiqueta con puntos suspensivos
    // debido a que WebM no permite concatenación simple de frames binarios MP3
    if (calidad === "opus") {
      const parsedText = text.replace(pauseRegex, " ... ");
      return await synthesizeTtsWithRetry(parsedText, voice, calidad, velocidad);
    }

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

    // Búfer de silencio de 1 segundo calibrado para la tasa MP3 seleccionada (42 frames/seg)
    const silenceFrameBuf = Buffer.from(cfg.silenceFrameHex, "hex");
    const cleanSilenceBuffer = Buffer.concat(Array(42).fill(silenceFrameBuf));

    // ⚡ Síntesis controlada con un pool de concurrencia de máximo 3 conexiones simultáneas
    // Evita saturar los 4 hilos del threadpool DNS de Node.js en Windows (ENOTFOUND)
    const textIndices: number[] = [];
    segments.forEach((s, idx) => {
      if (s.type === "text" && typeof s.value === "string") {
        textIndices.push(idx);
      }
    });

    const renderedResults = await ejecutarConcurrenciaLimitada(
      textIndices,
      3, // Concurrencia óptima: rápido, estable y 100% inmune a saturación DNS
      async (idx) => {
        const segText = segments[idx].value as string;
        const buf = await synthesizeTtsWithRetry(segText, voice, calidad, velocidad);
        return {
          idx,
          buf: stripLameHeader(buf),
        };
      }
    );

    const audioMap = new Map<number, Buffer>();
    renderedResults.forEach((r) => audioMap.set(r.idx, r.buf));

    const renderedSegments: Buffer[] = [];
    segments.forEach((segment, idx) => {
      if (segment.type === "text") {
        const audioBuf = audioMap.get(idx);
        if (audioBuf) renderedSegments.push(audioBuf);
      } else if (segment.type === "pause" && typeof segment.value === "number") {
        renderedSegments.push(Buffer.concat(Array(segment.value).fill(cleanSilenceBuffer)));
      }
    });

    return Buffer.concat(renderedSegments);
  } else {
    return await synthesizeTtsWithRetry(text, voice, calidad, velocidad);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      text, 
      voice = "es-MX-DaliaNeural", 
      calidad = "96k", 
      velocidad = 0.9,
      formato = "json" 
    } = body;

    const calidadEfectiva: CalidadAudioTts = (calidad === "48k" || calidad === "opus") ? calidad : "96k";
    const numVelocidad = typeof velocidad === "number" ? Math.max(0.8, Math.min(1.1, velocidad)) : 0.9;
    const cfg = CONFIG_CALIDAD[calidadEfectiva];

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

    console.log(`[3dBimFab TTS] Generando voz "${voice}" (${calidadEfectiva}, ${numVelocidad}x) para texto: "${cleanText.substring(0, 50)}..."`);
    const audioBuffer = await synthesizeTtsWithPauses(cleanText, voice, calidadEfectiva, numVelocidad);

    // Estimación matemática de duración según la tasa de bits seleccionada
    const estimatedDuration = Math.round((audioBuffer.length / cfg.bytesPerSec) * 10) / 10;

    if (formato === "binary") {
      return new NextResponse(new Uint8Array(audioBuffer), {
        status: 200,
        headers: {
          "Content-Type": cfg.mimeType,
          "Content-Length": String(audioBuffer.length),
          "X-Audio-Duration": String(estimatedDuration),
          "Content-Disposition": `inline; filename="locucion_3bf.${cfg.extension}"`,
        },
      });
    }

    const base64Audio = `data:${cfg.mimeType};base64,${audioBuffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      audioBase64: base64Audio,
      durationSeconds: estimatedDuration,
      bytes: audioBuffer.length,
      calidad: calidadEfectiva,
      velocidad: numVelocidad,
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

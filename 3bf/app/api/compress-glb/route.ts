import { NextResponse } from "next/server";
import { Document, NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { draco } from "@gltf-transform/functions";
import draco3d from "draco3d";

import fs from "fs";
import path from "path";

declare global {
  var __3bf_ar_models: Map<string, { buffer: Buffer; createdAt: number; name: string }> | undefined;
}

if (!global.__3bf_ar_models) {
  global.__3bf_ar_models = new Map();
}

let cachedIO: NodeIO | null = null;

async function getDracoIO(): Promise<NodeIO | null> {
  if (cachedIO) return cachedIO;

  try {
    const dracoDir = path.join(process.cwd(), "node_modules", "draco3d");
    const decoderPath = path.join(dracoDir, "draco_decoder.wasm");
    const encoderPath = path.join(dracoDir, "draco_encoder.wasm");

    if (!fs.existsSync(decoderPath) || !fs.existsSync(encoderPath)) {
      console.warn("[3dBimFab Draco] Archivos WASM no encontrados en node_modules/draco3d, usando fallback directo.");
      return null;
    }

    const decoderWasm = fs.readFileSync(decoderPath);
    const encoderWasm = fs.readFileSync(encoderPath);

    const [decoder, encoder] = await Promise.all([
      draco3d.createDecoderModule({ wasmBinary: decoderWasm }),
      draco3d.createEncoderModule({ wasmBinary: encoderWasm }),
    ]);

    cachedIO = new NodeIO()
      .registerExtensions([KHRDracoMeshCompression])
      .registerDependencies({
        "draco3d.decoder": decoder,
        "draco3d.encoder": encoder,
      });

    return cachedIO;
  } catch (err) {
    console.warn("[3dBimFab Draco] No se pudo inicializar Draco IO en este entorno:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "download"; // 'download' | 'ar'
    const modelName = url.searchParams.get("name") || "Modelo_3BF";

    const arrayBuffer = await req.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: "Buffer vacío o inválido" }, { status: 400 });
    }

    const inputBuffer = Buffer.from(arrayBuffer);
    const sizeBefore = inputBuffer.length;
    let outputBuffer = inputBuffer;
    let fueComprimido = false;

    // Intentar compresión Draco de forma segura con fallback automático
    try {
      const io = await getDracoIO();
      if (io) {
        const doc = await io.readBinary(new Uint8Array(inputBuffer));
        await doc.transform(
          draco({
            method: "edgebreaker",
            quantizePosition: 14,
            quantizeNormal: 10,
            quantizeTexcoord: 12,
            quantizeColor: 8,
            quantizeGeneric: 12,
          })
        );
        const compressedUint8 = await io.writeBinary(doc);
        outputBuffer = Buffer.from(compressedUint8);
        fueComprimido = true;
      }
    } catch (dracoErr) {
      console.warn("[3dBimFab Draco Fallback] Ocurrió un error en compresión Draco, usando GLB original sin comprimir:", dracoErr);
      outputBuffer = inputBuffer;
    }

    const sizeAfter = outputBuffer.length;

    console.log(
      `[3dBimFab Compressor] ${modelName}: ${(sizeBefore / (1024 * 1024)).toFixed(2)} MB ➔ ${(sizeAfter / (1024 * 1024)).toFixed(2)} MB (${fueComprimido ? Math.round((1 - sizeAfter / sizeBefore) * 100) + "% reducción Draco" : "Original sin compresión"})`
    );

    if (mode === "ar") {
      const arId = `ar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // 1. Guardar en memoria global de la instancia
      global.__3bf_ar_models?.set(arId, {
        buffer: outputBuffer,
        createdAt: Date.now(),
        name: modelName,
      });

      // 2. Persistir en disco temporal (/tmp) para resiliencia en Serverless
      try {
        const tmpDir = process.env.TMPDIR || process.env.TEMP || "/tmp";
        const tmpFile = path.join(tmpDir, `3bf_${arId}.glb`);
        fs.writeFileSync(tmpFile, outputBuffer);
      } catch (fsErr) {
        // En algunos entornos el FS de tmp es de solo lectura o restringido
      }

      // Limpiar modelos antiguos mayores a 2 horas
      const now = Date.now();
      global.__3bf_ar_models?.forEach((val, key) => {
        if (now - val.createdAt > 2 * 60 * 60 * 1000) {
          global.__3bf_ar_models?.delete(key);
        }
      });

      return NextResponse.json({
        status: "success",
        id: arId,
        sizeBefore,
        sizeAfter,
        name: modelName,
      });
    }

    // Modo descarga directa del archivo
    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Disposition": `attachment; filename="${modelName}${fueComprimido ? "_comprimido" : ""}.glb"`,
        "Content-Length": outputBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error en endpoint compress-glb:", error);
    return NextResponse.json({ error: error.message || "Error al procesar GLB" }, { status: 500 });
  }
}

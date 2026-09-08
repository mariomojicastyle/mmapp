import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

declare global {
  var __3bf_ar_models: Map<string, { buffer: Buffer; createdAt: number; name: string }> | undefined;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export async function HEAD(req: Request, { params }: { params: { id: string } }) {
  try {
    const rawId = params.id;
    const id = rawId.replace(/\.glb$/i, "");
    let bufferLength = 0;

    const model = global.__3bf_ar_models?.get(id);
    if (model && model.buffer) {
      bufferLength = model.buffer.length;
    } else {
      const tmpDir = process.env.TMPDIR || process.env.TEMP || "/tmp";
      const tmpFile = path.join(tmpDir, `3bf_${id}.glb`);
      if (fs.existsSync(tmpFile)) {
        bufferLength = fs.statSync(tmpFile).size;
      }
    }

    if (!bufferLength) {
      return new Response(null, { status: 404 });
    }

    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Length": bufferLength.toString(),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=7200",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const rawId = params.id;
    const id = rawId.replace(/\.glb$/i, "");
    let buffer: Buffer | null = null;
    let modelName = "modelo";

    const model = global.__3bf_ar_models?.get(id);
    if (model && model.buffer) {
      buffer = model.buffer;
      modelName = model.name || "modelo";
    } else {
      // Fallback: Buscar en el almacenamiento temporal /tmp del contenedor Serverless
      try {
        const tmpDir = process.env.TMPDIR || process.env.TEMP || "/tmp";
        const tmpFile = path.join(tmpDir, `3bf_${id}.glb`);
        if (fs.existsSync(tmpFile)) {
          buffer = fs.readFileSync(tmpFile);
        }
      } catch (fsErr) {
        console.warn("Error leyendo modelo de /tmp:", fsErr);
      }
    }

    if (!buffer) {
      return NextResponse.json({ error: "Modelo AR no encontrado o expirado" }, { status: 404 });
    }

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Disposition": `inline; filename="${modelName}.glb"`,
        "Content-Length": buffer.length.toString(),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Cache-Control": "public, max-age=7200",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

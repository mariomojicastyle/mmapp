import { NextResponse } from "next/server";

declare global {
  var __3bf_ar_models: Map<string, { buffer: Buffer; createdAt: number; name: string }> | undefined;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const model = global.__3bf_ar_models?.get(id);

    if (!model || !model.buffer) {
      return NextResponse.json({ error: "Modelo AR no encontrado o expirado" }, { status: 404 });
    }

    return new Response(new Uint8Array(model.buffer), {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Disposition": `inline; filename="${model.name || "modelo"}.glb"`,
        "Content-Length": model.buffer.length.toString(),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=7200",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const carpeta = (formData.get("carpeta") as string || "general")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_");

    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "No se enviaron archivos GLB." }, { status: 400 });
    }

    const targetDir = path.join(process.cwd(), "public", "library", "bloques", "modelos", carpeta);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const savedFiles: { nombre: string; ruta: string; size: number }[] = [];

    for (const file of files) {
      if (!file.name || !file.name.toLowerCase().endsWith(".glb")) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(targetDir, file.name);
      fs.writeFileSync(filePath, buffer);
      savedFiles.push({
        nombre: file.name,
        ruta: `/library/bloques/modelos/${carpeta}/${file.name}`,
        size: buffer.length,
      });
    }

    return NextResponse.json({
      success: true,
      mensaje: `${savedFiles.length} modelos GLB guardados correctamente en /${carpeta}`,
      carpetaModelos: `/library/bloques/modelos/${carpeta}`,
      archivos: savedFiles,
    });
  } catch (err: any) {
    console.error("[3dBimFab Upload] Error subiendo modelos GLB:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

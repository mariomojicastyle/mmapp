import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { model_id, imageBase64 } = await req.json();

    if (!model_id || !imageBase64) {
      return NextResponse.json({ error: "Faltan parámetros model_id o imageBase64" }, { status: 400 });
    }

    const thumbnailsDir = path.join(process.cwd(), "public", "thumbnails");
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    // Limpiar header base64 data:image/png;base64,
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const cleanFilename = `${model_id.replace(/[^a-zA-Z0-9_-]/g, "_")}.png`;
    const filePath = path.join(thumbnailsDir, cleanFilename);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ 
      status: "success", 
      message: `Miniatura guardada para ${model_id}`,
      url: `/thumbnails/${cleanFilename}`
    });
  } catch (error: any) {
    console.error("Error al guardar miniatura:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

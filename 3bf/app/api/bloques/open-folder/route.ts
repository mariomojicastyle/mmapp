import { NextRequest, NextResponse } from "next/server";
import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, carpetaModelos, ruta } = body || {};

    let targetDir = "";

    if (ruta && typeof ruta === "string" && ruta.trim().length > 0) {
      targetDir = path.resolve(ruta.trim());
    } else if (carpetaModelos && typeof carpetaModelos === "string") {
      const cleanRel = carpetaModelos.replace(/^\/+/, "");
      targetDir = path.join(process.cwd(), "public", cleanRel);
    } else if (id && typeof id === "string") {
      targetDir = path.join(process.cwd(), "public", "library", "bloques", "modelos", id);
    } else {
      targetDir = path.join(process.cwd(), "public", "library", "bloques", "modelos");
    }

    // Asegurar que la carpeta exista antes de abrirla
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Normalizar separadores para Windows
    const winPath = path.normalize(targetDir);

    if (process.platform === "win32") {
      try {
        const child = spawn("explorer.exe", [winPath], {
          detached: true,
          stdio: "ignore",
        });
        child.unref();
      } catch (spawnErr) {
        console.warn("[3dBimFab] Fallback abriendo explorer:", spawnErr);
      }
      // Ejecutar también a través de start para garantizar enfoque en primer plano
      exec(`start "" "${winPath}"`);
    } else if (process.platform === "darwin") {
      exec(`open "${winPath}"`);
    } else {
      exec(`xdg-open "${winPath}"`);
    }

    return NextResponse.json({
      success: true,
      ruta: winPath,
      mensaje: "Carpeta abierta en el Explorador de Windows.",
    });
  } catch (error: any) {
    console.error("[3dBimFab API] Error abriendo carpeta en Explorer:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

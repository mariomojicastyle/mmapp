import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BLOQUES_DIR = path.join(process.cwd(), "public", "library", "bloques");

function asegurarDirectorio(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 📖 GET: Obtener todos los bloques estándar escaneados
export async function GET(req: NextRequest) {
  try {
    asegurarDirectorio(BLOQUES_DIR);
    const subcarpetas = ["Universales", "Móveis Henn", "Politorno", "RTA Design"];
    subcarpetas.forEach((sub) => asegurarDirectorio(path.join(BLOQUES_DIR, sub)));

    const bloques: any[] = [];

    // Función recursiva de escaneo
    function escanearDir(dir: string, categoriaMarcaDefault: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          escanearDir(fullPath, entry.name);
        } else if (entry.isFile() && entry.name.endsWith(".3bb.json")) {
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const data = JSON.parse(content);
            const rutaModelos = data.carpetaModelos
              ? path.join(process.cwd(), "public", data.carpetaModelos.replace(/^\/+/, ""))
              : path.join(process.cwd(), "public", "library", "bloques", "modelos", data.id || entry.name.replace(/\.3bb\.json$/i, ""));

            bloques.push({
              ...data,
              categoriaMarca: data.categoriaMarca || categoriaMarcaDefault,
              archivo: entry.name,
              rutaFisica: path.normalize(rutaModelos),
            });
          } catch (readErr) {
            console.warn("[3dBimFab] Error leyendo archivo de bloque:", fullPath, readErr);
          }
        }
      }
    }

    escanearDir(BLOQUES_DIR, "Universales");

    return NextResponse.json({
      success: true,
      bloques,
      count: bloques.length,
      rutaBiblioteca: path.normalize(BLOQUES_DIR),
    });
  } catch (error: any) {
    console.error("[3dBimFab API] Error obteniendo bloques estándar:", error);
    return NextResponse.json({ success: false, error: error.message, bloques: [] }, { status: 500 });
  }
}

// 💾 POST: Guardar o actualizar un bloque estándar
export async function POST(req: NextRequest) {
  try {
    const bloque = await req.json();
    if (!bloque || !bloque.id || !bloque.nombre) {
      return NextResponse.json({ success: false, error: "Datos del bloque incompletos (id y nombre requeridos)" }, { status: 400 });
    }

    const categoriaMarca = bloque.categoriaMarca || "Universales";
    const targetDir = path.join(BLOQUES_DIR, categoriaMarca);
    asegurarDirectorio(targetDir);

    const fileName = bloque.archivo && bloque.archivo.endsWith(".3bb.json")
      ? bloque.archivo
      : `${bloque.id}.3bb.json`;

    const filePath = path.join(targetDir, fileName);
    const payloadToSave = {
      ...bloque,
      archivo: fileName,
      fechaModificacion: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(payloadToSave, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      mensaje: `Bloque "${bloque.nombre}" guardado exitosamente.`,
      bloque: payloadToSave,
    });
  } catch (error: any) {
    console.error("[3dBimFab API] Error guardando bloque estándar:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 🗑️ DELETE: Eliminar un bloque estándar existente
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const id = body.id || searchParams.get("id");
    const categoriaMarca = body.categoriaMarca || searchParams.get("categoriaMarca") || "Universales";
    const archivo = body.archivo || searchParams.get("archivo") || (id ? `${id}.3bb.json` : "");

    if (!id && !archivo) {
      return NextResponse.json({ success: false, error: "Se requiere 'id' o 'archivo' para eliminar el bloque" }, { status: 400 });
    }

    let eliminado = false;
    let rutaEliminada = "";

    // 1. Intentar ruta directa en su categoría
    const targetDir = path.join(BLOQUES_DIR, categoriaMarca);
    const targetFile = archivo ? path.join(targetDir, archivo) : path.join(targetDir, `${id}.3bb.json`);

    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
      eliminado = true;
      rutaEliminada = targetFile;
    } else {
      // 2. Búsqueda recursiva en todo BLOQUES_DIR por si se encuentra en otra subcarpeta
      const fileNameToFind = archivo || `${id}.3bb.json`;
      function buscarYEliminar(dir: string): boolean {
        if (!fs.existsSync(dir)) return false;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (buscarYEliminar(fullPath)) return true;
          } else if (entry.isFile() && (entry.name === fileNameToFind || (id && entry.name === `${id}.3bb.json`))) {
            fs.unlinkSync(fullPath);
            rutaEliminada = fullPath;
            return true;
          }
        }
        return false;
      }
      eliminado = buscarYEliminar(BLOQUES_DIR);
    }

    if (!eliminado) {
      return NextResponse.json({ success: false, error: `No se encontró el archivo del bloque ${id || archivo}` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      mensaje: `Bloque ${id || archivo} eliminado exitosamente.`,
      rutaEliminada: path.normalize(rutaEliminada),
    });
  } catch (error: any) {
    console.error("[3dBimFab API] Error eliminando bloque estándar:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


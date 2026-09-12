import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Detectar directorio base de Google Drive (G:\Mi unidad\Manuales) con fallback local
function getStorageDirectory(): string {
  const gDrivePath = "G:\\Mi unidad\\Manuales";
  if (fs.existsSync("G:\\Mi unidad")) {
    if (!fs.existsSync(gDrivePath)) {
      try {
        fs.mkdirSync(gDrivePath, { recursive: true });
      } catch {
        // Ignorar si hay restricción de permisos
      }
    }
    if (fs.existsSync(gDrivePath)) {
      return gDrivePath;
    }
  }
  return path.join(process.cwd(), "storage", "manuales");
}

function ensureStorage(storageDir: string) {
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
}

// Escaneo dinámico en tiempo real del árbol de carpetas de manuales
function buildLiveTree(storageDir: string) {
  if (!fs.existsSync(storageDir)) return [];
  const entries = fs.readdirSync(storageDir, { withFileTypes: true });
  const marcasFolders = entries.filter((e) => e.isDirectory() && !e.name.startsWith("."));

  return marcasFolders.map((marcaDir) => {
    const marcaName = marcaDir.name;
    const marcaId = marcaName.toLowerCase().replace(/\s+/g, "-");
    const marcaPath = path.join(storageDir, marcaName);

    let subcarpetas: any[] = [];
    try {
      const subEntries = fs.readdirSync(marcaPath, { withFileTypes: true });
      const subFolders = subEntries.filter((e) => e.isDirectory() && !e.name.startsWith("."));

      subcarpetas = subFolders.map((subDir) => {
        const subName = subDir.name;
        const subId = `${marcaId}/${subName.toLowerCase().replace(/\s+/g, "-")}`;
        return {
          id: subId,
          nombre: subName,
          tipo: "tipologia" as const,
          padreId: marcaId,
          ruta: `${marcaName}/${subName}`,
        };
      });
    } catch (err) {
      console.warn("Error leyendo subcarpetas de manuales:", marcaName, err);
    }

    return {
      id: marcaId,
      nombre: marcaName,
      tipo: "marca" as const,
      padreId: null,
      ruta: marcaName,
      subcarpetas,
    };
  });
}

export async function GET() {
  try {
    const storageDir = getStorageDirectory();
    ensureStorage(storageDir);

    const tree = buildLiveTree(storageDir);

    // Escanear todos los manuales guardados (.3bm.json)
    const manuales: any[] = [];
    const scanDir = (currentDir: string) => {
      if (!fs.existsSync(currentDir)) return;
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".3bm.json")) {
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const data = JSON.parse(content);
            manuales.push(data);
          } catch (e) {
            console.error("Error leyendo archivo de manual .3bm.json:", fullPath, e);
          }
        }
      }
    };

    scanDir(storageDir);

    return NextResponse.json({
      success: true,
      tree,
      manuales,
      storagePath: storageDir,
      provider: storageDir.startsWith("G:") ? "google_drive_desktop_active" : "local_storage",
    });
  } catch (error: any) {
    console.error("Error en GET /api/drive/manuales:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const storageDir = getStorageDirectory();
    ensureStorage(storageDir);
    const body = await request.json();
    const { action, folder, manual } = body;

    if (action === "create_folder" && folder) {
      const folderPath = path.join(storageDir, folder.ruta || folder.nombre);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const updatedTree = buildLiveTree(storageDir);
      return NextResponse.json({ success: true, tree: updatedTree });
    }

    if (action === "save_manual" && manual) {
      const marca = manual.marca || "RTA Design";
      const tipologia = manual.tipologia || "Manuales 3D";
      const targetDir = path.join(storageDir, marca, tipologia);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const fileName = `${manual.id}.3bm.json`;
      const filePath = path.join(targetDir, fileName);

      fs.writeFileSync(filePath, JSON.stringify(manual, null, 2), "utf-8");

      return NextResponse.json({
        success: true,
        savedPath: filePath,
        manualId: manual.id,
        fileName,
      });
    }

    if (action === "delete_manual" && body.id) {
      const searchAndDelete = (currentDir: string): boolean => {
        if (!fs.existsSync(currentDir)) return false;
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (searchAndDelete(fullPath)) return true;
          } else if (entry.isFile() && entry.name === `${body.id}.3bm.json`) {
            fs.unlinkSync(fullPath);
            return true;
          }
        }
        return false;
      };

      const deleted = searchAndDelete(storageDir);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en POST /api/drive/manuales:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

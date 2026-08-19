import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Detectar directorio base de Google Drive (G:\Mi unidad\Muebles) con fallback local
function getStorageDirectory(): string {
  const gDrivePath = "G:\\Mi unidad\\Muebles";
  if (fs.existsSync(gDrivePath)) {
    return gDrivePath;
  }
  return path.join(process.cwd(), "storage", "muebles");
}

const OFFICIAL_DRIVE_WEB_URL = "https://drive.google.com/drive/folders/1zzeGpgyLbCUKRuUhT7Lk-_7xRW_kZf9t";

function ensureStorage(storageDir: string) {
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
}

// Escaneo dinámico en tiempo real del árbol de carpetas de Google Drive (SIN carpetas por defecto)
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
      console.warn("Error leyendo subcarpetas de:", marcaName, err);
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

    // Escanear todos los muebles guardados en Google Drive
    const muebles: any[] = [];
    const scanDir = (currentDir: string) => {
      if (!fs.existsSync(currentDir)) return;
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".3bf.json")) {
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const data = JSON.parse(content);
            muebles.push(data);
          } catch (e) {
            console.error("Error leyendo archivo de mueble:", fullPath, e);
          }
        }
      }
    };

    scanDir(storageDir);

    return NextResponse.json({
      success: true,
      tree,
      muebles,
      driveUrl: OFFICIAL_DRIVE_WEB_URL,
      storagePath: storageDir,
      provider: storageDir.startsWith("G:") ? "google_drive_desktop_active" : "local_storage",
    });
  } catch (error: any) {
    console.error("Error en GET /api/drive/muebles:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const storageDir = getStorageDirectory();
    ensureStorage(storageDir);
    const body = await request.json();
    const { action, folder, furniture } = body;

    if (action === "create_folder" && folder) {
      const folderPath = path.join(storageDir, folder.ruta || folder.nombre);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const updatedTree = buildLiveTree(storageDir);
      return NextResponse.json({ success: true, tree: updatedTree });
    }

    if (action === "save_furniture" && furniture) {
      const marca = furniture.marca || "RTA Design";
      const tipologia = furniture.tipologia || "Escritorios";
      const targetDir = path.join(storageDir, marca, tipologia);
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const fileName = `${furniture.id}.3bf.json`;
      const filePath = path.join(targetDir, fileName);

      fs.writeFileSync(filePath, JSON.stringify(furniture, null, 2), "utf-8");

      return NextResponse.json({
        success: true,
        furniture,
        filePath: `${marca}/${tipologia}/${fileName}`,
      });
    }

    if (action === "rename_furniture" && body.id && body.nuevoNombre) {
      const scanAndRename = (currentDir: string): boolean => {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (scanAndRename(fullPath)) return true;
          } else if (entry.isFile() && entry.name === `${body.id}.3bf.json`) {
            try {
              const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
              data.nombre = body.nuevoNombre;
              fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
              return true;
            } catch (e) {
              console.error("Error renombrando mueble en disco:", e);
            }
          }
        }
        return false;
      };

      const ok = scanAndRename(storageDir);
      return NextResponse.json({ success: ok });
    }

    if (action === "delete_furniture" && body.id) {
      const scanAndDelete = (currentDir: string): boolean => {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (scanAndDelete(fullPath)) return true;
          } else if (entry.isFile() && entry.name === `${body.id}.3bf.json`) {
            try {
              fs.unlinkSync(fullPath);
              return true;
            } catch (e) {
              console.error("Error eliminando mueble en disco:", e);
            }
          }
        }
        return false;
      };

      const ok = scanAndDelete(storageDir);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en POST /api/drive/muebles:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import fsp from "fs/promises";
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

async function ensureStorage(storageDir: string) {
  if (!fs.existsSync(storageDir)) {
    await fsp.mkdir(storageDir, { recursive: true });
  }
}

// ── CACHÉ EN MEMORIA DEL SERVIDOR NODE.JS (TTL 60 segundos) ─────────────────
interface CacheStateManuales {
  timestamp: number;
  tree: any[];
  manuales: any[];
  storageDir: string;
}

let memoryCacheManuales: CacheStateManuales | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 segundos

function invalidarCacheManuales() {
  memoryCacheManuales = null;
}

// Escaneo dinámico en tiempo real del árbol de carpetas de manuales
async function buildLiveTreeAsync(storageDir: string) {
  if (!fs.existsSync(storageDir)) return [];
  try {
    const entries = await fsp.readdir(storageDir, { withFileTypes: true });
    const marcasFolders = entries.filter((e) => e.isDirectory() && !e.name.startsWith("."));

    const treePromises = marcasFolders.map(async (marcaDir) => {
      const marcaName = marcaDir.name;
      const marcaId = marcaName.toLowerCase().replace(/\s+/g, "-");
      const marcaPath = path.join(storageDir, marcaName);

      let subcarpetas: any[] = [];
      try {
        const subEntries = await fsp.readdir(marcaPath, { withFileTypes: true });
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
        console.warn("[3dBimFab Drive Manuales] Error leyendo subcarpetas de:", marcaName, err);
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

    return await Promise.all(treePromises);
  } catch (e) {
    console.error("[3dBimFab Drive Manuales] Error escaneando árbol:", e);
    return [];
  }
}

// Escaneo asíncrono recursivo de manuales (.3bm.json)
async function scanManualesAsync(storageDir: string) {
  const manuales: any[] = [];

  async function scanDir(currentDir: string) {
    try {
      const entries = await fsp.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".3bm.json")) {
          try {
            const content = await fsp.readFile(fullPath, "utf-8");
            const data = JSON.parse(content);
            manuales.push(data);
          } catch (e) {
            console.error("[3dBimFab Drive Manuales] Error leyendo manual:", fullPath, e);
          }
        }
      }
    } catch (err) {
      console.warn("[3dBimFab Drive Manuales] Error escaneando directorio:", currentDir, err);
    }
  }

  await scanDir(storageDir);
  return manuales;
}

export async function GET() {
  try {
    const storageDir = getStorageDirectory();
    await ensureStorage(storageDir);

    const now = Date.now();
    if (
      memoryCacheManuales &&
      now - memoryCacheManuales.timestamp < CACHE_TTL_MS &&
      memoryCacheManuales.storageDir === storageDir
    ) {
      return NextResponse.json({
        success: true,
        tree: memoryCacheManuales.tree,
        manuales: memoryCacheManuales.manuales,
        storagePath: storageDir,
        provider: storageDir.startsWith("G:") ? "google_drive_desktop_active" : "local_storage",
        fromCache: true,
      });
    }

    const [tree, manuales] = await Promise.all([
      buildLiveTreeAsync(storageDir),
      scanManualesAsync(storageDir),
    ]);

    memoryCacheManuales = {
      timestamp: now,
      tree,
      manuales,
      storageDir,
    };

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
    await ensureStorage(storageDir);
    const body = await request.json();
    const { action, folder, manual } = body;

    // Cualquier modificación invalida la memoria caché
    invalidarCacheManuales();

    if (action === "create_folder" && folder) {
      const folderPath = path.join(storageDir, folder.ruta || folder.nombre);
      if (!fs.existsSync(folderPath)) {
        await fsp.mkdir(folderPath, { recursive: true });
      }

      const updatedTree = await buildLiveTreeAsync(storageDir);
      return NextResponse.json({ success: true, tree: updatedTree });
    }

    if (action === "save_manual" && manual) {
      const marca = manual.marca || "RTA Design";
      const tipologia = manual.tipologia || "Manuales 3D";
      const targetDir = path.join(storageDir, marca, tipologia);

      if (!fs.existsSync(targetDir)) {
        await fsp.mkdir(targetDir, { recursive: true });
      }

      const fileName = `${manual.id}.3bm.json`;
      const filePath = path.join(targetDir, fileName);

      await fsp.writeFile(filePath, JSON.stringify(manual, null, 2), "utf-8");

      return NextResponse.json({
        success: true,
        savedPath: filePath,
        manualId: manual.id,
        fileName,
      });
    }

    if (action === "delete_manual" && body.id) {
      const searchAndDelete = async (currentDir: string): Promise<boolean> => {
        if (!fs.existsSync(currentDir)) return false;
        const entries = await fsp.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (await searchAndDelete(fullPath)) return true;
          } else if (entry.isFile() && entry.name === `${body.id}.3bm.json`) {
            await fsp.unlink(fullPath);
            return true;
          }
        }
        return false;
      };

      const deleted = await searchAndDelete(storageDir);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en POST /api/drive/manuales:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

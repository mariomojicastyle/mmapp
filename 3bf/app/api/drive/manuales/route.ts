import { NextResponse } from "next/server";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";

function toSafeFileName(name: string): string {
  return (name || "").trim().replace(/[\\/:*?"<>|]/g, "_");
}

// Detectar directorio base de Google Drive (priorizando G:\Mi unidad\Muebles para convivencia en la misma carpeta)
function getStorageDirectory(): string {
  const gDriveMuebles = "G:\\Mi unidad\\Muebles";
  if (fs.existsSync(gDriveMuebles)) {
    return gDriveMuebles;
  }
  const gDriveManuales = "G:\\Mi unidad\\Manuales";
  if (fs.existsSync(gDriveManuales)) {
    return gDriveManuales;
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

// Escaneo asíncrono recursivo de manuales (.3bm.json) en Google Drive y almacenamiento local
async function scanManualesAsync(storageDir: string) {
  const manualesMap = new Map<string, any>();

  const directoriosAEscanear = new Set<string>();
  directoriosAEscanear.add(storageDir);
  if (fs.existsSync("G:\\Mi unidad\\Muebles")) directoriosAEscanear.add("G:\\Mi unidad\\Muebles");
  if (fs.existsSync("G:\\Mi unidad\\Manuales")) directoriosAEscanear.add("G:\\Mi unidad\\Manuales");
  const localManuales = path.join(process.cwd(), "storage", "manuales");
  if (fs.existsSync(localManuales)) directoriosAEscanear.add(localManuales);

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
            const clave = data.id || entry.name.replace(/\.3bm\.json$/, "");
            const existente = manualesMap.get(clave);
            if (!existente) {
              manualesMap.set(clave, data);
            } else {
              // Priorizar el que tenga más pasos o esté en G:\Mi unidad\Muebles
              const pasosEntrante = Array.isArray(data.pasos) ? data.pasos.length : 0;
              const pasosExistente = Array.isArray(existente.pasos) ? existente.pasos.length : 0;
              if (pasosEntrante > pasosExistente || fullPath.includes("Muebles")) {
                manualesMap.set(clave, data);
              }
            }
          } catch (e) {
            console.error("[3dBimFab Drive Manuales] Error leyendo manual:", fullPath, e);
          }
        }
      }
    } catch (err) {
      console.warn("[3dBimFab Drive Manuales] Error escaneando directorio:", currentDir, err);
    }
  }

  for (const dir of directoriosAEscanear) {
    if (fs.existsSync(dir)) {
      await scanDir(dir);
    }
  }

  return Array.from(manualesMap.values());
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
      const safeName = toSafeFileName(manual.nombre || manual.id);
      const fileName = `${safeName}.3bm.json`;

      // 🎯 Co-ubicación Hermana: Guardar primariamente en G:\Mi unidad\Muebles/<marca>/<tipologia>/ junto al .3bf.json
      const gDriveMuebles = "G:\\Mi unidad\\Muebles";
      const targetDir = fs.existsSync(gDriveMuebles)
        ? path.join(gDriveMuebles, marca, tipologia)
        : path.join(storageDir, marca, tipologia);

      if (!fs.existsSync(targetDir)) {
        await fsp.mkdir(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, fileName);
      await fsp.writeFile(filePath, JSON.stringify(manual, null, 2), "utf-8");

      // 🔄 Espejo en G:\Mi unidad\Manuales (para compatibilidad de consultas legacy)
      const gDriveManuales = "G:\\Mi unidad\\Manuales";
      if (fs.existsSync(gDriveManuales)) {
        try {
          const manualesTarget = path.join(gDriveManuales, marca, tipologia);
          if (!fs.existsSync(manualesTarget)) {
            await fsp.mkdir(manualesTarget, { recursive: true });
          }
          const manualesPath = path.join(manualesTarget, fileName);
          await fsp.writeFile(manualesPath, JSON.stringify(manual, null, 2), "utf-8");
        } catch (_) {}
      }

      // 🔄 Espejo Seguro Local: Guardar también copia espejo en storage/manuales local
      try {
        const localDir = path.join(process.cwd(), "storage", "manuales", marca, tipologia);
        if (!fs.existsSync(localDir)) {
          await fsp.mkdir(localDir, { recursive: true });
        }
        const localPath = path.join(localDir, fileName);
        await fsp.writeFile(localPath, JSON.stringify(manual, null, 2), "utf-8");
      } catch (eMirror) {
        console.warn("[3dBimFab Drive Manuales] Error al guardar copia local espejo:", eMirror);
      }

      // 🛡️ Snapshot atómico inmutable de seguridad
      try {
        const snapDir = path.join(process.cwd(), "storage", "snapshots_manuales");
        if (!fs.existsSync(snapDir)) {
          await fsp.mkdir(snapDir, { recursive: true });
        }
        const nowStamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_");
        const snapPath = path.join(snapDir, `${safeName}_${nowStamp}.3bm.json`);
        await fsp.writeFile(snapPath, JSON.stringify(manual, null, 2), "utf-8");
      } catch (_) {}

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

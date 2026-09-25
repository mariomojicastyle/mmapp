import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Detectar directorio base de Google Drive (G:\Mi unidad\Muebles) con fallback local
function getStorageDirectory(): string {
  const gDrivePath = "G:\\Mi unidad\\Muebles";
  if (fs.existsSync(gDrivePath)) {
    return gDrivePath;
  }
  return path.join(process.cwd(), "storage", "muebles");
}

const OFFICIAL_DRIVE_WEB_URL = "https://drive.google.com/drive/u/0/folders/1zzeGpgyLbCUKrUUhT7Lk-_7xRW_kZf9t";

async function ensureStorage(storageDir: string) {
  if (!fs.existsSync(storageDir)) {
    await fsp.mkdir(storageDir, { recursive: true });
  }
}

function toSafeFileName(name: string): string {
  return (name || "").trim().replace(/[\\/:*?"<>|]/g, "_");
}

// ── CACHÉ EN MEMORIA DEL SERVIDOR NODE.JS (TTL 60 segundos) ─────────────────
interface CacheState {
  timestamp: number;
  tree: any[];
  mueblesResumen: any[];
  storageDir: string;
}

let memoryCache: CacheState | null = null;
const fullFurnitureCache = new Map<string, { data: any; mtime: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 segundos

function invalidarCache() {
  memoryCache = null;
  fullFurnitureCache.clear();
}

// Escaneo dinámico y asíncrono del árbol de carpetas
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
        console.warn("[3dBimFab Drive] Error leyendo subcarpetas de:", marcaName, err);
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
    console.error("[3dBimFab Drive] Error escaneando árbol:", e);
    return [];
  }
}

// Escaneo asíncrono recursivo de archivos de muebles (.3bf.json)
async function scanMueblesAsync(storageDir: string) {
  const mueblesResumen: any[] = [];

  async function scanDir(currentDir: string) {
    try {
      const entries = await fsp.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".3bf.json")) {
          try {
            const stat = await fsp.stat(fullPath);
            const cachedItem = fullFurnitureCache.get(fullPath);

            let data: any;
            if (cachedItem && cachedItem.mtime === stat.mtimeMs) {
              data = cachedItem.data;
            } else {
              const content = await fsp.readFile(fullPath, "utf-8");
              data = JSON.parse(content);
              fullFurnitureCache.set(fullPath, { data, mtime: stat.mtimeMs });
              if (data.id) {
                fullFurnitureCache.set(data.id, { data, mtime: stat.mtimeMs });
              }
            }

            // Metadatos ligeros para lista de catálogo (elimina el peso de mallas gigantes)
            mueblesResumen.push({
              id: data.id,
              nombre: data.nombre || entry.name.replace(/\.3bf\.json$/, ""),
              marca: data.marca || "RTA Design",
              tipologia: data.tipologia || "Escritorios",
              rutaCarpeta: data.rutaCarpeta || "",
              fechaGuardado: data.fechaGuardado || new Date(stat.mtimeMs).toISOString(),
              thumbnail: data.thumbnail,
              descripcionComercial: data.descripcionComercial,
              dimensionesEnvolventes: data.dimensionesEnvolventes,
              totalPiezas: data.totalPiezas || (data.instancias ? Object.keys(data.instancias).length : 0),
              costoEstimadoCop: data.costoEstimadoCop,
              costoEstimadoUsd: data.costoEstimadoUsd,
              manualVinculadoId: data.manualVinculadoId,
              pasosManual: data.pasosManual || [],
              instancias: {}, // Se carga bajo demanda en abrirMueble para no saturar con 148 MB
              fichaConfig: data.fichaConfig,
              fichaProducto: data.fichaProducto,
              camara: data.camara,
            });
          } catch (readErr) {
            console.error("[3dBimFab Drive] Error leyendo archivo de mueble:", fullPath, readErr);
          }
        }
      }
    } catch (err) {
      console.warn("[3dBimFab Drive] Error escaneando directorio:", currentDir, err);
    }
  }

  await scanDir(storageDir);
  return mueblesResumen;
}

export async function GET(request: NextRequest) {
  try {
    const storageDir = getStorageDirectory();
    await ensureStorage(storageDir);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    // 🚀 Acción: Obtener mueble completo por ID bajo demanda (para abrir en 3D)
    if (action === "get_furniture" && id) {
      // 1. Intentar desde caché en memoria
      const cached = fullFurnitureCache.get(id);
      if (cached) {
        return NextResponse.json({ success: true, furniture: cached.data });
      }

      const targetId = id;
      const safeId = toSafeFileName(targetId);

      // 2. Buscar archivo en disco asíncronamente
      async function findFileById(dir: string): Promise<any | null> {
        const entries = await fsp.readdir(dir, { withFileTypes: true });
        for (const e of entries) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) {
            const found = await findFileById(p);
            if (found) return found;
          } else if (e.isFile() && e.name.endsWith(".3bf.json")) {
            const baseName = e.name.replace(/\.3bf\.json$/, "");
            if (
              e.name === `${targetId}.3bf.json` ||
              e.name === `${safeId}.3bf.json` ||
              baseName.toLowerCase() === targetId.toLowerCase() ||
              baseName.toLowerCase() === safeId.toLowerCase()
            ) {
              const content = await fsp.readFile(p, "utf-8");
              return JSON.parse(content);
            }
          }
        }
        return null;
      }

      const foundData = await findFileById(storageDir);
      if (foundData) {
        fullFurnitureCache.set(id, { data: foundData, mtime: Date.now() });
        if (foundData.id) fullFurnitureCache.set(foundData.id, { data: foundData, mtime: Date.now() });
        if (foundData.nombre) fullFurnitureCache.set(foundData.nombre, { data: foundData, mtime: Date.now() });
        return NextResponse.json({ success: true, furniture: foundData });
      }

      return NextResponse.json({ success: false, error: "Mueble no encontrado" }, { status: 404 });
    }

    // ⚡ Catálogo y Árbol de Carpetas con Caché en Memoria
    const now = Date.now();
    if (memoryCache && (now - memoryCache.timestamp < CACHE_TTL_MS) && memoryCache.storageDir === storageDir) {
      return NextResponse.json({
        success: true,
        tree: memoryCache.tree,
        muebles: memoryCache.mueblesResumen,
        driveUrl: OFFICIAL_DRIVE_WEB_URL,
        storagePath: storageDir,
        provider: storageDir.startsWith("G:") ? "google_drive_desktop_active" : "local_storage",
        fromCache: true,
      });
    }

    // Si no está en caché o expiró, escanear asíncronamente sin bloquear el event loop
    const [tree, mueblesResumen] = await Promise.all([
      buildLiveTreeAsync(storageDir),
      scanMueblesAsync(storageDir),
    ]);

    memoryCache = {
      timestamp: now,
      tree,
      mueblesResumen,
      storageDir,
    };

    return NextResponse.json({
      success: true,
      tree,
      muebles: mueblesResumen,
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
    await ensureStorage(storageDir);
    const body = await request.json();
    const { action, folder, furniture } = body;

    // Cualquier modificación invalida la caché en memoria inmediatamente
    invalidarCache();

    if (action === "create_folder" && folder) {
      const folderPath = path.join(storageDir, folder.ruta || folder.nombre);
      if (!fs.existsSync(folderPath)) {
        await fsp.mkdir(folderPath, { recursive: true });
      }

      const updatedTree = await buildLiveTreeAsync(storageDir);
      return NextResponse.json({ success: true, tree: updatedTree });
    }

    if (action === "save_furniture" && furniture) {
      const marca = furniture.marca || "RTA Design";
      const tipologia = furniture.tipologia || "Escritorios";
      const targetDir = path.join(storageDir, marca, tipologia);
      
      if (!fs.existsSync(targetDir)) {
        await fsp.mkdir(targetDir, { recursive: true });
      }

      const safeName = toSafeFileName(furniture.nombre || furniture.id);
      const fileName = `${safeName}.3bf.json`;
      let filePath = path.join(targetDir, fileName);

      // Buscar si el archivo ya existía con otro nombre (ej. ID antiguo con hash) para actualizarlo sin dejar duplicados huérfanos
      async function findExistingFile(dir: string): Promise<string | null> {
        try {
          const entries = await fsp.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullP = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              const res = await findExistingFile(fullP);
              if (res) return res;
            } else if (
              entry.isFile() &&
              (entry.name === fileName || (furniture.id && entry.name === `${furniture.id}.3bf.json`))
            ) {
              return fullP;
            }
          }
        } catch (_) {}
        return null;
      }

      const existingPath = await findExistingFile(storageDir);
      if (existingPath && path.resolve(existingPath) !== path.resolve(filePath)) {
        try {
          // Si tenía un nombre viejo diferente, eliminar el viejo para no duplicar
          await fsp.unlink(existingPath);
        } catch (_) {}
      }

      // ⚡ Serialización compacta de alto rendimiento: reduce 80% el tamaño del archivo y elimina el colapso de memoria
      await fsp.writeFile(filePath, JSON.stringify(furniture), "utf-8");

      if (furniture.id) {
        fullFurnitureCache.set(furniture.id, { data: furniture, mtime: Date.now() });
      }
      fullFurnitureCache.set(safeName, { data: furniture, mtime: Date.now() });
      fullFurnitureCache.set(filePath, { data: furniture, mtime: Date.now() });

      return NextResponse.json({
        success: true,
        furniture,
        filePath: path.relative(storageDir, filePath).replace(/\\/g, "/"),
      });
    }

    if (action === "update_thumbnail" && body.id && body.thumbnail) {
      const scanAndUpdateThumb = async (currentDir: string): Promise<boolean> => {
        const entries = await fsp.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (await scanAndUpdateThumb(fullPath)) return true;
          } else if (entry.isFile() && entry.name === `${body.id}.3bf.json`) {
            try {
              const data = JSON.parse(await fsp.readFile(fullPath, "utf-8"));
              data.thumbnail = body.thumbnail;
              await fsp.writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
              return true;
            } catch (e) {
              console.error("Error actualizando thumbnail de mueble en disco:", e);
            }
          }
        }
        return false;
      };

      const ok = await scanAndUpdateThumb(storageDir);
      return NextResponse.json({ success: ok });
    }

    if (action === "rename_furniture" && body.id && body.nuevoNombre) {
      const scanAndRename = async (currentDir: string): Promise<boolean> => {
        const entries = await fsp.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (await scanAndRename(fullPath)) return true;
          } else if (entry.isFile() && entry.name === `${body.id}.3bf.json`) {
            try {
              const data = JSON.parse(await fsp.readFile(fullPath, "utf-8"));
              data.nombre = body.nuevoNombre;
              await fsp.writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
              return true;
            } catch (e) {
              console.error("Error renombrando mueble en disco:", e);
            }
          }
        }
        return false;
      };

      const ok = await scanAndRename(storageDir);
      return NextResponse.json({ success: ok });
    }

    if (action === "delete_furniture" && body.id) {
      const scanAndDelete = async (currentDir: string): Promise<boolean> => {
        const entries = await fsp.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (await scanAndDelete(fullPath)) return true;
          } else if (entry.isFile() && entry.name === `${body.id}.3bf.json`) {
            try {
              await fsp.unlink(fullPath);
              return true;
            } catch (e) {
              console.error("Error eliminando mueble en disco:", e);
            }
          }
        }
        return false;
      };

      const ok = await scanAndDelete(storageDir);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en POST /api/drive/muebles:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

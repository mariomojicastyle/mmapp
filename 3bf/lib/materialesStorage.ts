/**
 * ============================================================================
 * ARCHIVO: materialesStorage.ts
 * UBICACIÓN: c:/Desarrollo/mmapp/3BF/lib/materialesStorage.ts
 * AUTOR: Mario Mojica (Suite 3dBimFab)
 * ============================================================================
 * DESCRIPCIÓN:
 * Almacenamiento local persistente en IndexedDB de alta capacidad para
 * Materiales PBR y Texturas Difusas / Mapas (Normales, Rugosidad, AO).
 * 
 * ¿POR QUÉ INDEXEDDB EN VEZ DE LOCALSTORAGE?
 * Un material PBR con textura fotográfica y mapas generados (normales,
 * rugosidad, ambient occlusion y thumbnail) en DataURL Base64 pesa fácilmente
 * entre 2 MB y 10 MB. El localStorage del navegador tiene una cuota rígida
 * de 5 MB por origen y lanza QuotaExceededError, perdiendo la textura y
 * generando registros huérfanos sin calibración.
 * IndexedDB ofrece cientos de megabytes / gigabytes, permitiendo persistir
 * colecciones completas de materiales de alta definición sin pérdida alguna.
 * ============================================================================
 */

import type { MaterialPBRDef } from "./storeTypes";

const DB_NAME = "3bf_materiales_db";
const STORE_NAME = "materiales_pbr";
const DB_VERSION = 1;

function openMaterialesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB no soportado en este entorno"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda la lista completa de Materiales PBR en IndexedDB.
 */
export async function saveMaterialesToIndexedDB(
  materiales: MaterialPBRDef[]
): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB) return;

  try {
    const db = await openMaterialesDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(materiales, "lista_materiales_pbr");

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      } catch (e) {
        db.close();
        reject(e);
      }
    });
  } catch (err) {
    console.warn("[3dBimFab MaterialesStorage] Error guardando en IndexedDB:", err);
  }
}

/**
 * Carga la lista completa de Materiales PBR desde IndexedDB.
 */
export async function loadMaterialesFromIndexedDB(): Promise<MaterialPBRDef[] | null> {
  if (typeof window === "undefined" || !window.indexedDB) return null;

  try {
    const db = await openMaterialesDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get("lista_materiales_pbr");

        req.onsuccess = () => {
          const res = req.result;
          if (Array.isArray(res) && res.length > 0) {
            resolve(res);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      } catch (e) {
        db.close();
        reject(e);
      }
    });
  } catch (err) {
    console.warn("[3dBimFab MaterialesStorage] Error cargando de IndexedDB:", err);
    return null;
  }
}

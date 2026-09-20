/**
 * ============================================================================
 * ARCHIVO: disenosStorage.ts
 * UBICACIÓN: c:/Desarrollo/mmapp/3BF/lib/disenosStorage.ts
 * AUTOR: Mario Mojica (Suite 3dBimFab)
 * ============================================================================
 * DESCRIPCIÓN:
 * Almacenamiento local persistente en IndexedDB de alta capacidad para
 * Diseños Encapsulados 3D estilo Poser.
 * 
 * ¿POR QUÉ INDEXEDDB EN VEZ DE LOCALSTORAGE?
 * Un mueble complejo (ej. Cómoda Ravenna) con 630 mallas poligonales, vértices,
 * caras y despiece DfMA pesa entre 3 y 8 MB en JSON. El localStorage del navegador
 * tiene una cuota máxima rígida de 5 MB por origen y arroja QuotaExceededError.
 * IndexedDB ofrece cientos de megabytes / gigabytes, permitiendo guardar decenas
 * de diseños 3D completos para conmutación instantánea (< 10 ms).
 * ============================================================================
 */

import type { DisenoEncapsulado3BF } from "./storeTypes";

const DB_NAME = "3bf_disenos_db";
const STORE_NAME = "disenos_encapsulados";
const DB_VERSION = 1;

function openDisenosDB(): Promise<IDBDatabase> {
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
 * Guarda la colección completa de diseños encapsulados para un modelo en IndexedDB.
 */
export async function saveDisenosToIndexedDB(
  modelId: string,
  disenos: DisenoEncapsulado3BF[]
): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB || !modelId) return;

  try {
    const db = await openDisenosDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(disenos, modelId);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      } catch (e) {
        db.close();
        reject(e);
      }
    });
  } catch (err) {
    console.warn("[3dBimFab DisenosStorage] Error guardando en IndexedDB:", err);
  }
}

/**
 * Carga la colección completa de diseños encapsulados para un modelo desde IndexedDB.
 */
export async function loadDisenosFromIndexedDB(
  modelId: string
): Promise<DisenoEncapsulado3BF[]> {
  if (typeof window === "undefined" || !window.indexedDB || !modelId) return [];

  try {
    const db = await openDisenosDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(modelId);

        req.onsuccess = () => {
          const res = req.result;
          if (Array.isArray(res)) {
            resolve(res);
          } else {
            resolve([]);
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
    console.warn("[3dBimFab DisenosStorage] Error cargando de IndexedDB:", err);
    return [];
  }
}

/**
 * Elimina la caché de diseños de un modelo en IndexedDB.
 */
export async function deleteDisenosFromIndexedDB(modelId: string): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB || !modelId) return;

  try {
    const db = await openDisenosDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(modelId);
    tx.oncomplete = () => db.close();
  } catch (e) {
    console.warn("[3dBimFab DisenosStorage] Error eliminando de IndexedDB:", e);
  }
}

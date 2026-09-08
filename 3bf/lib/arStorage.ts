/**
 * Almacenamiento local ultrarrápido en IndexedDB para modelos GLB de Realidad Aumentada.
 * Permite que dispositivos móviles abran la experiencia AR instantáneamente
 * sin latencia de subida/descarga de red ni dependencias de servidor.
 */

const DB_NAME = "3bf_ar_cache";
const STORE_NAME = "models";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
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

export async function saveLocalARModel(blob: Blob, name: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      
      const record = {
        blob,
        name,
        timestamp: Date.now(),
      };

      const putReq = store.put(record, "current_ar_model");
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
      tx.oncomplete = () => db.close();
    } catch (e) {
      db.close();
      reject(e);
    }
  });
}

export async function getLocalARModel(): Promise<{ blob: Blob; name: string } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get("current_ar_model");

      getReq.onsuccess = () => {
        const res = getReq.result;
        if (!res || !res.blob) {
          resolve(null);
        } else {
          resolve({ blob: res.blob, name: res.name || "Modelo 3dBimFab" });
        }
      };

      getReq.onerror = () => reject(getReq.error);
      tx.oncomplete = () => db.close();
    } catch (e) {
      db.close();
      reject(e);
    }
  });
}

export async function clearLocalARModel(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete("current_ar_model");
    tx.oncomplete = () => db.close();
  } catch (e) {
    console.warn("Error limpiando modelo AR local:", e);
  }
}

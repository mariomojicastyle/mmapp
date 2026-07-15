const MASTER_SALT = "MARIO_MOJICA_3D_DRM_KEY_2026"; // Clave de sal maestra

// Deriva una clave simétrica de 256 bits única para el manual
async function deriveKey(manualId) {
  const enc = new TextEncoder();
  const rawKeyMaterial = enc.encode(MASTER_SALT + manualId);
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    rawKeyMaterial,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(manualId),
      iterations: 1000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Cifra los primeros 4KB del ArrayBuffer con AES-GCM
export async function encryptBuffer(arrayBuffer, manualId) {
  const key = await deriveKey(manualId);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Vector de inicialización de 12 bytes
  const bytesToEncrypt = Math.min(4096, arrayBuffer.byteLength);
  
  const chunkToEncrypt = arrayBuffer.slice(0, bytesToEncrypt);
  const remainingChunk = arrayBuffer.slice(bytesToEncrypt);
  
  const encryptedChunk = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    chunkToEncrypt
  );
  
  // Estructura final: [IV (12 bytes)] + [Chunk Cifrado (incluye tag de 16 bytes)] + [Resto del archivo]
  const finalSize = iv.byteLength + encryptedChunk.byteLength + remainingChunk.byteLength;
  const finalBuffer = new Uint8Array(finalSize);
  
  finalBuffer.set(iv, 0);
  finalBuffer.set(new Uint8Array(encryptedChunk), iv.byteLength);
  finalBuffer.set(new Uint8Array(remainingChunk), iv.byteLength + encryptedChunk.byteLength);
  
  return finalBuffer.buffer;
}

// Descifra los primeros 4KB del ArrayBuffer con AES-GCM
export async function decryptBuffer(arrayBuffer, manualId) {
  const key = await deriveKey(manualId);
  const view = new Uint8Array(arrayBuffer);
  
  const iv = view.slice(0, 12);
  // En AES-GCM, el chunk cifrado creció 16 bytes debido al tag de autenticación GCM
  const encryptedChunkSize = Math.min(4096 + 16, arrayBuffer.byteLength - 12);
  const encryptedChunk = view.slice(12, 12 + encryptedChunkSize);
  const remainingChunk = view.slice(12 + encryptedChunkSize);
  
  const decryptedChunk = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedChunk
  );
  
  const finalSize = decryptedChunk.byteLength + remainingChunk.byteLength;
  const finalBuffer = new Uint8Array(finalSize);
  
  finalBuffer.set(new Uint8Array(decryptedChunk), 0);
  finalBuffer.set(new Uint8Array(remainingChunk), decryptedChunk.byteLength);
  
  return finalBuffer.buffer;
}

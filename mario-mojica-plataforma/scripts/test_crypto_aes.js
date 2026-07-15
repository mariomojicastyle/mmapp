const crypto = require('crypto');

const MASTER_SALT = "MARIO_MOJICA_3D_DRM_KEY_2026";
const manualId = "M00001";

function deriveKeyNode(manualId) {
  return crypto.pbkdf2Sync(MASTER_SALT + manualId, manualId, 1000, 32, 'sha256');
}

function encryptBufferNode(buffer, manualId) {
  const key = deriveKeyNode(manualId);
  const iv = crypto.randomBytes(12);
  
  const bytesToEncrypt = Math.min(4096, buffer.length);
  const chunkToEncrypt = buffer.slice(0, bytesToEncrypt);
  const remainingChunk = buffer.slice(bytesToEncrypt);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encryptedChunk = Buffer.concat([cipher.update(chunkToEncrypt), cipher.final()]);
  const tag = cipher.getAuthTag(); 
  
  return Buffer.concat([iv, encryptedChunk, tag, remainingChunk]);
}

function decryptBufferNode(buffer, manualId) {
  const key = deriveKeyNode(manualId);
  const iv = buffer.slice(0, 12);
  
  // Tag de 16 bytes al final del bloque cifrado de 4096 + 16
  const encryptedChunkSize = Math.min(4096, buffer.length - 12 - 16);
  const encryptedChunk = buffer.slice(12, 12 + encryptedChunkSize);
  const tag = buffer.slice(12 + encryptedChunkSize, 12 + encryptedChunkSize + 16);
  const remainingChunk = buffer.slice(12 + encryptedChunkSize + 16);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decryptedChunk = Buffer.concat([decipher.update(encryptedChunk), decipher.final()]);
  
  return Buffer.concat([decryptedChunk, remainingChunk]);
}

// TEST
const originalText = "glTF-binary-large-simulation-file-content-to-test-aes-encryption-strength";
const originalBuffer = Buffer.from(originalText);

console.log("Original text length:", originalText.length);
console.log("Original text header:", originalBuffer.toString('ascii', 0, 4));

// Encrypt
const encryptedBuffer = encryptBufferNode(originalBuffer, manualId);
console.log("\nEncrypted buffer size:", encryptedBuffer.length);
console.log("Encrypted header (hex):", encryptedBuffer.slice(0, 12).toString('hex')); // Mostrar el IV aleatorio
console.log("Encrypted magic should NOT be glTF:", encryptedBuffer.toString('ascii', 0, 4) === 'glTF' ? "FAIL" : "PASS");

// Decrypt
const decryptedBuffer = decryptBufferNode(encryptedBuffer, manualId);
const decryptedText = decryptedBuffer.toString('ascii');

console.log("\nDecrypted text header:", decryptedBuffer.toString('ascii', 0, 4));

if (decryptedText === originalText) {
  console.log("\n[✅ SUCCESS] La encriptación y desencriptación AES-256-GCM es 100% reversible y simétrica.");
} else {
  console.error("\n[❌ ERROR] Fallo al restaurar los datos.");
}

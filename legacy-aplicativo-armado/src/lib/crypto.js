/**
 * Aplica o remueve un enmascaramiento XOR a los primeros 1024 bytes de un ArrayBuffer.
 * Esta función es simétrica y reversible.
 */
export function obfuscateBuffer(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const key = [0xAA, 0x55, 0x1F, 0x2E]; // Clave de enmascaramiento binario
  const bytesToProcess = Math.min(1024, arrayBuffer.byteLength);
  
  for (let i = 0; i < bytesToProcess; i++) {
    const byte = view.getUint8(i);
    view.setUint8(i, byte ^ key[i % key.length]);
  }
  return arrayBuffer;
}

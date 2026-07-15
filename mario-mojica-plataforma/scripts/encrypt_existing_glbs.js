const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// 1. Cargar variables de entorno desde .env.local de forma manual
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error("No se encontró el archivo .env.local en la plataforma.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan las credenciales NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env.local.");
  process.exit(1);
}

console.log("Conectando a Supabase:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MASTER_SALT = "MARIO_MOJICA_3D_DRM_KEY_2026"; // Clave de sal maestra

// Deriva una clave simétrica de 256 bits única para el manual (Node.js compatible con Web Crypto)
function deriveKeyNode(manualId) {
  return crypto.pbkdf2Sync(MASTER_SALT + manualId, manualId, 1000, 32, 'sha256');
}

// Cifra los primeros 4KB del Buffer con AES-256-GCM
function encryptBufferNode(buffer, manualId) {
  const key = deriveKeyNode(manualId);
  const iv = crypto.randomBytes(12); // Vector de inicialización de 12 bytes
  
  const bytesToEncrypt = Math.min(4096, buffer.length);
  const chunkToEncrypt = buffer.slice(0, bytesToEncrypt);
  const remainingChunk = buffer.slice(bytesToEncrypt);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encryptedChunk = Buffer.concat([cipher.update(chunkToEncrypt), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes tag de autenticación
  
  // Estructura final compatible: [IV (12 bytes)] + [Chunk Cifrado] + [Tag (16 bytes)] + [Resto del archivo]
  return Buffer.concat([iv, encryptedChunk, tag, remainingChunk]);
}

// Descifra los primeros 4KB con AES-256-GCM (para verificar o revertir de ser necesario)
function decryptBufferNode(buffer, manualId) {
  const key = deriveKeyNode(manualId);
  const iv = buffer.slice(0, 12);
  
  const encryptedChunkSize = Math.min(4096, buffer.length - 12 - 16);
  const encryptedChunk = buffer.slice(12, 12 + encryptedChunkSize);
  const tag = buffer.slice(12 + encryptedChunkSize, 12 + encryptedChunkSize + 16);
  const remainingChunk = buffer.slice(12 + encryptedChunkSize + 16);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decryptedChunk = Buffer.concat([decipher.update(encryptedChunk), decipher.final()]);
  
  return Buffer.concat([decryptedChunk, remainingChunk]);
}

async function runMigration() {
  try {
    console.log("=== INICIANDO MIGRACIÓN DE ARCHIVOS GLB A AES-256 ===");
    
    // 2. Listar carpetas raíces en el bucket 'insumos_manuales'
    const { data: rootItems, error: listError } = await supabase.storage
      .from('insumos_manuales')
      .list('', { limit: 100 });
      
    if (listError) throw listError;
    
    // Filtrar sólo carpetas
    const manuals = rootItems.filter(item => item.id === null || !item.metadata); 
    console.log(`Se detectaron ${manuals.length} carpetas de manuales.`);
    
    for (const manual of manuals) {
      const folderName = manual.name;
      console.log(`\n--------------------------------------------`);
      console.log(`Procesando carpeta de manual: ${folderName}`);
      
      // 3. Listar archivos GLB en la subcarpeta 'models'
      const modelsPath = `${folderName}/models`;
      const { data: modelFiles, error: modelsError } = await supabase.storage
        .from('insumos_manuales')
        .list(modelsPath, { limit: 100 });
        
      if (modelsError) {
        console.warn(`No se pudo listar la carpeta /models en ${folderName}. Puede estar vacía.`);
        continue;
      }
      
      const glbFiles = modelFiles.filter(file => file.name.endsWith('.glb'));
      console.log(`Encontrados ${glbFiles.length} archivos GLB en ${modelsPath}`);
      
      for (const glbFile of glbFiles) {
        const filePath = `${modelsPath}/${glbFile.name}`;
        console.log(`Analizando: ${filePath} (${(glbFile.metadata?.size / 1024 / 1024).toFixed(2)} MB)`);
        
        // 4. Descargar el archivo
        const { data: blob, error: downloadError } = await supabase.storage
          .from('insumos_manuales')
          .download(filePath);
          
        if (downloadError) {
          console.error(`Error al descargar ${filePath}:`, downloadError.message);
          continue;
        }
        
        // Convertir blob a Buffer de Node
        const arrayBuffer = await blob.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        
        // 5. Validar cabecera binaria y aplicar encriptación AES
        const magic = buffer.toString('ascii', 0, 4);
        
        // Si el archivo está en formato original sin encriptar, o está en formato XOR antiguo, lo encriptamos
        let needsEncryption = false;
        
        if (magic === 'glTF') {
          console.log(`   [?] El archivo está en formato GLB estándar. Cifrando con AES-256...`);
          needsEncryption = true;
        } else if (buffer[0] === 0xCD && buffer[1] === 0x39 && buffer[2] === 0x4B && buffer[3] === 0x68) {
          console.log(`   [?] Detectado formato XOR antiguo. Re-descifrando y cifrando con AES-256...`);
          
          // Revertir XOR primero para obtener el GLB limpio
          const keyXOR = [0xAA, 0x55, 0x1F, 0x2E];
          const bytesToProcess = Math.min(1024, buffer.length);
          for (let i = 0; i < bytesToProcess; i++) {
            buffer[i] = buffer[i] ^ keyXOR[i % keyXOR.length];
          }
          
          needsEncryption = true;
        }
        
        if (needsEncryption) {
          // Aplicar cifrado AES-256 en caliente
          const encryptedBuffer = encryptBufferNode(buffer, folderName);
          
          // 6. Subir el archivo encriptado (sobreescribiendo con upsert)
          const { error: uploadError } = await supabase.storage
            .from('insumos_manuales')
            .upload(filePath, encryptedBuffer, {
              upsert: true,
              contentType: 'model/gltf-binary'
            });
            
          if (uploadError) {
            console.error(`   [❌] Error al subir el archivo cifrado con AES:`, uploadError.message);
          } else {
            console.log(`   [✅] Archivo cifrado con AES-256 y subido con éxito.`);
          }
        } else {
          // Validar si ya está cifrado con AES-256 (no empieza con glTF ni XOR)
          console.log(`   [🛡️] El archivo ya se encuentra protegido con AES-256 (o tiene un formato externo).`);
        }
      }
    }
    
    console.log("\n=============================================");
    console.log("=== MIGRACIÓN FINALIZADA CON ÉXITO ===");
    console.log("=============================================");
  } catch (err) {
    console.error("Error crítico en la migración:", err);
  }
}

runMigration();

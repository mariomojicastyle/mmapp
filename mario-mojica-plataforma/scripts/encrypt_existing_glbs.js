const fs = require('fs');
const path = require('path');
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

// Utilidad de enmascaramiento binario XOR
function obfuscateBuffer(buffer) {
  const key = [0xAA, 0x55, 0x1F, 0x2E];
  const bytesToProcess = Math.min(1024, buffer.length);
  for (let i = 0; i < bytesToProcess; i++) {
    buffer[i] = buffer[i] ^ key[i % key.length];
  }
}

async function runMigration() {
  try {
    console.log("=== INICIANDO MIGRACIÓN DE ARCHIVOS GLB ===");
    
    // 2. Listar carpetas raíces en el bucket 'insumos_manuales'
    const { data: rootItems, error: listError } = await supabase.storage
      .from('insumos_manuales')
      .list('', { limit: 100 });
      
    if (listError) throw listError;
    
    // Filtrar sólo carpetas (los archivos de configuración se guardan en carpetas con códigos de manual)
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
        const buffer = Buffer.from(arrayBuffer);
        
        // 5. Validar cabecera binaria
        // El formato GLB normal tiene el número mágico 'glTF' en ASCII en los primeros 4 bytes (0x46546C67)
        const magic = buffer.toString('ascii', 0, 4);
        
        if (magic === 'glTF') {
          console.log(`   [?] El archivo no está protegido. Aplicando ofuscación XOR...`);
          
          // Aplicar la ofuscación XOR
          obfuscateBuffer(buffer);
          
          // 6. Subir el archivo encriptado (sobreescribiendo con upsert)
          const { error: uploadError } = await supabase.storage
            .from('insumos_manuales')
            .upload(filePath, buffer, {
              upsert: true,
              contentType: 'model/gltf-binary'
            });
            
          if (uploadError) {
            console.error(`   [❌] Error al subir el archivo protegido:`, uploadError.message);
          } else {
            console.log(`   [✅] Archivo protegido y subido con éxito.`);
          }
        } else {
          // Verificar si ya tiene nuestra firma XOR aplicada
          // El primer byte de 'glTF' es 'g' (0x67). Encriptado con 0xAA da 0xCD (205)
          if (buffer[0] === 0xCD && buffer[1] === 0x39 && buffer[2] === 0x4B && buffer[3] === 0x68) {
            console.log(`   [🛡️] El archivo ya está protegido correctamente.`);
          } else {
            console.log(`   [⚠️] Cabecera desconocida (${buffer.slice(0, 4).toString('hex')}). Omitiendo para seguridad.`);
          }
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

const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: baserowUrl,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      options.headers['Authorization'] = `JWT ${token}`;
    }

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody ? JSON.parse(responseBody) : {});
        } else {
          reject(new Error(`Request ${method} ${path} failed with status ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function deleteTableRows(tableId, tableName, token) {
  console.log(`\n--- Limpiando Tabla "${tableName}" (ID: ${tableId}) ---`);
  
  // Obtener filas
  const response = await request('GET', `/api/database/rows/table/${tableId}/?size=200`, null, token);
  const rows = response.results || [];
  console.log(`Se encontraron ${rows.length} filas.`);

  if (rows.length === 0) {
    console.log(`La tabla "${tableName}" ya está vacía.`);
    return;
  }

  // Eliminar filas
  const batchSize = 10;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    console.log(`Eliminando bloque ${i / batchSize + 1}...`);
    await Promise.all(batch.map(async (row) => {
      try {
        await request('DELETE', `/api/database/rows/table/${tableId}/${row.id}/`, null, token);
        console.log(`   Eliminada fila ID ${row.id}`);
      } catch (err) {
        console.error(`   Error al eliminar fila ID ${row.id}:`, err.message);
      }
    }));
  }
  console.log(`¡Limpieza de "${tableName}" finalizada!`);
}

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    // 1. Limpiar Interacciones (988) - Relacionado a Leads
    await deleteTableRows(988, 'Interacciones', token);

    // 2. Limpiar Leads / Contactos (600) - Relacionado a Empresas
    await deleteTableRows(600, 'Leads', token);

    // 3. Limpiar Empresas (989)
    await deleteTableRows(989, 'Empresas', token);

    console.log('\n¡Pizarra limpia! Todas las tablas han sido vaciadas con éxito.');
  } catch (error) {
    console.error('Error durante la ejecución:', error.message);
  }
}

run();

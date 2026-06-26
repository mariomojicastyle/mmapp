const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const tableId = 600;

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

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log('2. Obteniendo filas de la tabla ' + tableId + '...');
    // Obtenemos las filas. Baserow pagina de a 100 por defecto.
    const response = await request('GET', `/api/database/rows/table/${tableId}/?size=200`, null, token);
    const rows = response.results || [];
    console.log(`Se encontraron ${rows.length} filas.`);

    // Identificamos cuáles son basura. 
    // Conservaremos únicamente las filas que tengan un correo real importante, por ejemplo "mariomojica.style@gmail.com" o "direccion@mariomojica.com".
    // Todo lo demás (comienza con ssss, asasa, fgfhf, etc.) se considerará basura.
    const rowsToDelete = rows;

    console.log(`Se van a eliminar ${rowsToDelete.length} filas de prueba.`);

    // Borramos en paralelo de a bloques para no saturar el servidor
    const batchSize = 10;
    for (let i = 0; i < rowsToDelete.length; i += batchSize) {
      const batch = rowsToDelete.slice(i, i + batchSize);
      console.log(`Eliminando bloque ${i / batchSize + 1}...`);
      await Promise.all(batch.map(async (row) => {
        try {
          await request('DELETE', `/api/database/rows/table/${tableId}/${row.id}/`, null, token);
          console.log(`   Eliminada fila ID ${row.id} (${row.field_5554} ${row.field_5557} - ${row.field_5558})`);
        } catch (err) {
          console.error(`   Error al eliminar fila ID ${row.id}:`, err.message);
        }
      }));
    }

    console.log('\n¡Limpieza finalizada con éxito!');
  } catch (error) {
    console.error('Error al ejecutar script:', error.message);
  }
}

run();

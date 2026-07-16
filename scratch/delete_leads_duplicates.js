const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const leadsTableId = 994;

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

// IDs de las filas duplicadas que se inyectaron por duplicado (IDs 11 al 18)
const duplicateIds = [11, 12, 13, 14, 15, 16, 17, 18];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Eliminando ${duplicateIds.length} filas duplicadas de la tabla ${leadsTableId}...`);
    for (const id of duplicateIds) {
      try {
        await request('DELETE', `/api/database/rows/table/${leadsTableId}/${id}/`, null, token);
        console.log(`   Fila ID ${id} eliminada con éxito.`);
      } catch (err) {
        console.error(`   Error al eliminar Fila ID ${id}:`, err.message);
      }
    }
    console.log('\n¡Limpieza de duplicados completada con éxito!');
  } catch (error) {
    console.error('Error general durante la ejecución:', error.message);
  }
}

run();

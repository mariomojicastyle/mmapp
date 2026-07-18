const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

const empresasTableId = 991;
const contactosTableId = 994;

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

    // 2. Re-vincular los contactos Cesar (31) y Ana (32) a la Empresa correcta (ID: 32)
    console.log('2. Re-vinculando contactos a la Empresa Mobler Moveis correcta (ID: 32)...');
    
    // Cesar Moresca (ID: 31)
    await request('PATCH', `/api/database/rows/table/${contactosTableId}/31/?user_field_names=true`, {
      "Empresa Vinculada": [32]
    }, token);
    console.log('   Cesar Moresca (ID 31) re-vinculado con éxito a la empresa ID 32.');

    // Ana Cláudia Rocha (ID: 32)
    await request('PATCH', `/api/database/rows/table/${contactosTableId}/32/?user_field_names=true`, {
      "Empresa Vinculada": [32]
    }, token);
    console.log('   Ana Cláudia Rocha (ID 32) re-vinculada con éxito a la empresa ID 32.');

    // 3. Eliminar filas 33, 34 y 35 en la tabla 991
    console.log('3. Eliminando filas duplicadas/vacías (IDs: 33, 34, 35) de la tabla de Empresas (991)...');
    
    for (const rowId of [33, 34, 35]) {
      try {
        await request('DELETE', `/api/database/rows/table/${empresasTableId}/${rowId}/`, null, token);
        console.log(`   Fila ID ${rowId} eliminada con éxito.`);
      } catch (err) {
        console.error(`   Error al eliminar fila ID ${rowId}:`, err.message);
      }
    }

    console.log('\n¡Limpieza completada!');
  } catch (error) {
    console.error('Error durante la ejecución:', error.message);
  }
}

run();

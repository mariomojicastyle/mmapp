const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
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

    // 2. Actualizar Cesar (31) y Ana (32) en tabla de Leads (994)
    console.log('2. Completando Empresa, Pais y Status en tabla de Leads (994)...');
    
    const payload = {
      "Empresa": "Möbler Móveis",
      "Pais": "Brasil",
      "Status": 4017 // Nuevo
    };

    // Cesar Moresca (ID: 31)
    await request('PATCH', `/api/database/rows/table/${contactosTableId}/31/?user_field_names=true`, payload, token);
    console.log('   Cesar Moresca (ID 31) actualizado con éxito.');

    // Ana Cláudia Rocha (ID: 32)
    await request('PATCH', `/api/database/rows/table/${contactosTableId}/32/?user_field_names=true`, payload, token);
    console.log('   Ana Cláudia Rocha (ID 32) actualizada con éxito.');

    console.log('\n¡Campos completados en la vista grid de Leads!');
  } catch (error) {
    console.error('Error durante la ejecución:', error.message);
  }
}

run();

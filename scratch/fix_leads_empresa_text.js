const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const leadsTableId = 600;

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

const leadsUpdates = [
  { id: 114, empresa: "Colibri Móveis" },
  { id: 115, empresa: "Colibri Móveis" },
  { id: 116, empresa: "Móveis Notável" },
  { id: 117, empresa: "BRV Móveis" },
  { id: 118, empresa: "Tecno Mobili" },
  { id: 119, empresa: "Ditália Móveis" }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log('2. Actualizando el campo de texto "Empresa" para visibilidad inmediata...');
    for (const update of leadsUpdates) {
      try {
        await request('PATCH', `/api/database/rows/table/${leadsTableId}/${update.id}/?user_field_names=true`, {
          "Empresa": update.empresa
        }, token);
        console.log(`   Fila ID ${update.id} actualizada con Empresa: "${update.empresa}"`);
      } catch (err) {
        console.error(`   Error al actualizar fila ${update.id}:`, err.message);
      }
    }
    console.log('\n¡Campos de texto "Empresa" actualizados con éxito!');
  } catch (error) {
    console.error('Error general:', error.message);
  }
}

run();

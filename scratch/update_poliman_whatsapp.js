const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const empresasTableId = 991;

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

    console.log('2. Actualizando Poliman Móveis (ID: 14) con su WhatsApp y Canal Preferido...');
    const payload = {
      "WhatsApp": "https://api.whatsapp.com/send?phone=554133713500&text=Ol%C3%A1",
      "Facebook": "",
      "Instagram": "",
      "Canal Preferido": 4036, // Opción: WhatsApp
      "Actividad en Redes": 4033 // Opción: Muy Activo
    };

    await request('PATCH', `/api/database/rows/table/${empresasTableId}/14/?user_field_names=true`, payload, token);
    console.log('Poliman Móveis actualizado con éxito en Baserow.');

  } catch (error) {
    console.error('Error al actualizar Poliman Móveis:', error.message);
  }
}

run();

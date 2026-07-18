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

    // 2. Actualizar Cesar Moresca (ID: 31)
    console.log('2. Actualizando detalles completos para Cesar Moresca (ID: 31)...');
    const cesarPayload = {
      "Notas": "FI",
      "Activo": false,
      "Email": "cesar.moresca@mobler.ind.br",
      "Telefono": "+55 43 3242-8800",
      "Origen": "Prospección Activa",
      "Descripcion de la idea": "Gerente General de Möbler Móveis en Bela Vista do Paraíso (PR). Decisor estratégico clave para la adopción de manuales de armado 3D interactivos en fábrica.",
      "Facebook": "https://www.facebook.com/search/people/?q=Cesar%20Moresca%20M%C3%B6bler%20M%C3%B3veis",
      "Instagram": "https://www.google.com/search?q=site%3Ainstagram.com%20%22Cesar%20Moresca%22%20%22M%C3%B6bler%20M%C3%B3veis%22",
      "WhatsApp": "https://wa.me/5543999346415",
      "Canal Preferido": 4037, // LinkedIn
      "Actividad en Redes": 4045 // Inactivo
    };
    await request('PATCH', `/api/database/rows/table/${contactosTableId}/31/?user_field_names=true`, cesarPayload, token);
    console.log('   Cesar Moresca actualizado.');

    // 3. Actualizar Ana Cláudia Rocha (ID: 32)
    console.log('3. Actualizando detalles completos para Ana Cláudia Rocha (ID: 32)...');
    const anaPayload = {
      "Notas": "FI",
      "Activo": false,
      "Email": "ana.rocha@mobler.ind.br",
      "Telefono": "+55 43 3242-8800",
      "Origen": "Prospección Activa",
      "Descripcion de la idea": "Consultora comercial de Möbler Móveis. Directamente involucrada en el equipo de ventas, potencial promotora interna de la solución 3D interactiva para mejorar el CX.",
      "Facebook": "https://www.facebook.com/search/people/?q=Ana%20Cl%C3%A1udia%20Rocha%20M%C3%B6bler%20M%C3%B3veis",
      "Instagram": "https://www.google.com/search?q=site%3Ainstagram.com%20%22Ana%20Cl%C3%A1udia%20Rocha%22%20%22M%C3%B6bler%20M%C3%B3veis%22",
      "WhatsApp": "https://wa.me/5543999346415",
      "Canal Preferido": 4037, // LinkedIn
      "Actividad en Redes": 4045 // Inactivo
    };
    await request('PATCH', `/api/database/rows/table/${contactosTableId}/32/?user_field_names=true`, anaPayload, token);
    console.log('   Ana Cláudia Rocha actualizada.');

    console.log('\n¡Detalles completados en el CRM!');
  } catch (error) {
    console.error('Error durante la ejecución:', error.message);
  }
}

run();

const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const tableId = 991;
const canalPreferidoFieldId = 9549;

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

    console.log('2. Agregando "WhatsApp" a las opciones de "Canal Preferido"...');
    const updateSelectPayload = {
      name: "Canal Preferido",
      select_options: [
        { id: 4029, value: "LinkedIn", color: "blue" },
        { id: 4030, value: "Instagram", color: "pink" },
        { id: 4031, value: "Facebook", color: "light-blue" },
        { id: 4032, value: "Sitio Web / Formulario", color: "light-gray" },
        { value: "WhatsApp", color: "green" }
      ]
    };
    await request('PATCH', `/api/database/fields/${canalPreferidoFieldId}/`, updateSelectPayload, token);
    console.log('Opciones de "Canal Preferido" actualizadas.');

    console.log('3. Creando nueva columna "WhatsApp" (tipo URL)...');
    const newFieldResponse = await request('POST', `/api/database/fields/table/${tableId}/`, {
      name: 'WhatsApp',
      type: 'url'
    }, token);
    console.log('Columna "WhatsApp" creada con éxito. ID:', newFieldResponse.id);

    console.log('4. Consultando los campos de la tabla para obtener la estructura actualizada...');
    const fields = await request('GET', `/api/database/fields/table/${tableId}/`, null, token);
    console.log('Estructura de campos consultada con éxito.');
    
    // Buscar la nueva opción de WhatsApp en Canal Preferido para ver su ID
    const canalField = fields.find(f => f.id === canalPreferidoFieldId);
    console.log('Opciones de Canal Preferido actualizadas en Baserow:', JSON.stringify(canalField.select_options, null, 2));

  } catch (error) {
    console.error('Error durante la ejecución:', error.message);
  }
}

run();

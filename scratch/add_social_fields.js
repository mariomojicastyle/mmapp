const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const tableId = 991;

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

    console.log('2. Creando columna "Facebook" (tipo URL)...');
    await request('POST', `/api/database/fields/table/${tableId}/`, {
      name: 'Facebook',
      type: 'url'
    }, token);
    console.log('Columna "Facebook" creada con éxito.');

    console.log('3. Creando columna "Instagram" (tipo URL)...');
    await request('POST', `/api/database/fields/table/${tableId}/`, {
      name: 'Instagram',
      type: 'url'
    }, token);
    console.log('Columna "Instagram" creada con éxito.');

    console.log('4. Creando columna "Canal Preferido" (tipo Selección Única)...');
    await request('POST', `/api/database/fields/table/${tableId}/`, {
      name: 'Canal Preferido',
      type: 'single_select',
      select_options: [
        { value: 'LinkedIn', color: 'blue' },
        { value: 'Instagram', color: 'pink' },
        { value: 'Facebook', color: 'light-blue' },
        { value: 'Sitio Web / Formulario', color: 'light-gray' }
      ]
    }, token);
    console.log('Columna "Canal Preferido" creada con éxito.');

    console.log('5. Creando columna "Actividad en Redes" (tipo Selección Única)...');
    await request('POST', `/api/database/fields/table/${tableId}/`, {
      name: 'Actividad en Redes',
      type: 'single_select',
      select_options: [
        { value: 'Muy Activo', color: 'green' },
        { value: 'Moderado', color: 'orange' },
        { value: 'Inactivo', color: 'red' }
      ]
    }, token);
    console.log('Columna "Actividad en Redes" creada con éxito.');

    console.log('\n¡Todas las columnas nuevas han sido creadas con éxito en Baserow!');
  } catch (error) {
    console.error('Error al crear columnas:', error.message);
  }
}

run();

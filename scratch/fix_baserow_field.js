const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const tableId = 600;
const oldFieldId = 9456;

function request(path, method, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const options = {
      hostname: baserowUrl,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
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
          resolve(responseBody ? JSON.parse(responseBody) : { success: true });
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('/api/user/token-auth/', 'POST', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log('2. Eliminando campo multiple_select viejo (' + oldFieldId + ')...');
    try {
      await request(`/api/database/fields/${oldFieldId}/`, 'DELETE', null, token);
      console.log('Campo viejo eliminado.');
    } catch (e) {
      console.log('No se pudo eliminar o ya no existe:', e.message);
    }

    console.log('3. Creando campo "Estado CRM" como single_select...');
    const fieldData = {
      name: 'Estado CRM',
      type: 'single_select', // Single select correcto
      select_options: [
        { value: 'Prospecto', color: 'light-blue' },
        { value: 'Primer Contacto', color: 'blue' },
        { value: 'Demo Agendada', color: 'orange' },
        { value: 'Negociación', color: 'purple' },
        { value: 'Cerrado Ganado', color: 'green' },
        { value: 'Cerrado Perdido', color: 'red' }
      ]
    };

    const fieldResponse = await request(`/api/database/fields/table/${tableId}/`, 'POST', fieldData, token);
    console.log('Campo single_select creado con éxito:', fieldResponse);
  } catch (error) {
    console.error('Error al ejecutar script:', error.message);
  }
}

run();

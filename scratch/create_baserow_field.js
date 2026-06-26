const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const tableId = 600;

function post(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: baserowUrl,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    if (token) {
      options.headers['Authorization'] = `JWT ${token}`;
    }

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseBody));
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await post('/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log('2. Creando campo "Estado CRM" en la tabla ' + tableId + '...');
    const fieldData = {
      name: 'Estado CRM',
      type: 'multiple_select',
      select_options: [
        { value: 'Prospecto', color: 'light-blue' },
        { value: 'Primer Contacto', color: 'blue' },
        { value: 'Demo Agendada', color: 'orange' },
        { value: 'Negociación', color: 'purple' },
        { value: 'Cerrado Ganado', color: 'green' },
        { value: 'Cerrado Perdido', color: 'red' }
      ]
    };

    const fieldResponse = await post(`/api/database/fields/table/${tableId}/`, fieldData, token);
    console.log('Campo creado con éxito en Baserow:', fieldResponse);
  } catch (error) {
    console.error('Error al ejecutar script:', error.message);
  }
}

run();

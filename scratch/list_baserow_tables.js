const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const databaseId = 144;

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: baserowUrl,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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
    req.end();
  });
}

function post(path, data) {
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

    console.log('2. Obteniendo tablas para la base de datos ' + databaseId + '...');
    const tables = await get(`/api/database/tables/database/${databaseId}/`, token);
    console.log('Tablas encontradas:', JSON.stringify(tables, null, 2));
  } catch (error) {
    console.error('Error al ejecutar script:', error.message);
  }
}

run();

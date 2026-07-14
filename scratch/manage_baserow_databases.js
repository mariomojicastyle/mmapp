const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

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

    console.log('2. Eliminando base de datos "Compañía de Mario" (ID: 100)...');
    try {
      await request('DELETE', '/api/applications/100/', null, token);
      console.log('Base de datos 100 eliminada.');
    } catch (err) {
      console.error('Error al eliminar base de datos 100:', err.message);
    }

    console.log('3. Eliminando base de datos "B2B Demo" (ID: 101)...');
    try {
      await request('DELETE', '/api/applications/101/', null, token);
      console.log('Base de datos 101 eliminada.');
    } catch (err) {
      console.error('Error al eliminar base de datos 101:', err.message);
    }

    console.log('4. Renombrando la base de datos "Portafolio" (ID: 144) a "CRM B2B"...');
    try {
      const updateResponse = await request('PATCH', '/api/applications/144/', { name: 'CRM B2B' }, token);
      console.log('Base de datos 144 renombrada a:', updateResponse.name);
    } catch (err) {
      console.error('Error al renombrar base de datos 144:', err.message);
    }

    console.log('\n¡Operación completada con éxito!');
  } catch (error) {
    console.error('Error general de ejecución:', error.message);
  }
}

run();

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

    console.log(`2. Actualizando únicamente el perfil de Móveis Notável (ID: 2) en la tabla ${empresasTableId}...`);
    
    await request('PATCH', `/api/database/rows/table/${empresasTableId}/2/?user_field_names=true`, {
      "LinkedIn Corporativo": "https://www.linkedin.com/company/not%C3%A1vel-design-m%C3%B3veis/"
    }, token);
    
    console.log('   Móveis Notável (ID 2) actualizado a: "https://www.linkedin.com/company/not%C3%A1vel-design-m%C3%B3veis/"');
    console.log('\n¡Base de datos de Baserow actualizada con éxito!');
  } catch (error) {
    console.error('Error general durante la ejecución:', error.message);
  }
}

run();

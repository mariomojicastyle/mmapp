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

    console.log('2. Consultando filas de la tabla de Empresas (ID 991)...');
    const response = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, null, token);
    const rows = response.results;
    
    console.log('\n--- VERIFICACIÓN DEL CRM (Empresas) ---');
    rows.forEach(row => {
      console.log(`\nID: ${row.id} - ${row["Nombre de la Empresa"]}`);
      console.log(`   Sitio Web:         ${row["Sitio Web"]}`);
      console.log(`   LinkedIn Orig:     ${row["LinkedIn Corporativo"]}`);
      console.log(`   Facebook:          ${row["Facebook"]}`);
      console.log(`   Instagram:         ${row["Instagram"]}`);
      console.log(`   Canal Preferido:   ${row["Canal Preferido"] ? row["Canal Preferido"].value : 'No definido'}`);
      console.log(`   Actividad:         ${row["Actividad en Redes"] ? row["Actividad en Redes"].value : 'No definido'}`);
    });
  } catch (error) {
    console.error('Error general durante la ejecución:', error.message);
  }
}

run();

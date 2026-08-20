const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const tableId = 994;

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
  const query = process.argv[2] || 'Andrey';
  console.log(`Buscando "${query}" en la tabla de Leads (994)...`);
  try {
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    
    // We search across all rows
    const response = await request('GET', `/api/database/rows/table/${tableId}/?user_field_names=true&search=${encodeURIComponent(query)}`, null, token);
    
    console.log(`Resultados encontrados (${response.results.length}):`);
    response.results.forEach(row => {
      console.log(`- ID: ${row.id} | Nombre: ${row.Nombre} ${row.Apellido} | Empresa: ${row.Empresa} | Rol: ${row.Rol} | Status: ${row.Status?.value || row.Status} | Estado CRM: ${row['Estado CRM']?.value || row['Estado CRM']} | LinkedIn: ${row.LinkedIn}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();

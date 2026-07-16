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

// Configuración de actualizaciones según la validación
// Dj Móveis (ID 4) tiene un link real válido.
// Los demás que no funcionan se dejan en blanco.
const updates = [
  { id: 1, url: "" },  // Colibri Móveis
  { id: 2, url: "" },  // Móveis Notável
  { id: 3, url: "" },  // Móveis Rufato
  { id: 4, url: "https://www.linkedin.com/company/djmoveis/" }, // Dj Móveis (Válido)
  { id: 5, url: "" },  // Telasul
  { id: 6, url: "" },  // Ditália Móveis
  { id: 7, url: "" },  // Móveis Albatroz
  { id: 8, url: "" },  // BRV Móveis
  { id: 9, url: "" },  // Tecno Mobili
  { id: 10, url: "" }, // Artely
  { id: 11, url: "" }, // Móveis Bechara
  { id: 12, url: "" }, // Zanzini Móveis
  { id: 13, url: "" }, // Permóbili
  { id: 14, url: "" }, // Poliman Móveis
  { id: 15, url: "" }  // Imcal Móveis
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Actualizando LinkedIn Corporativo en la tabla ${empresasTableId}...`);
    for (const update of updates) {
      try {
        await request('PATCH', `/api/database/rows/table/${empresasTableId}/${update.id}/?user_field_names=true`, {
          "LinkedIn Corporativo": update.url
        }, token);
        console.log(`   Empresa ID ${update.id} ➔ LinkedIn actualizado a: "${update.url}"`);
      } catch (err) {
        console.error(`   Error al actualizar Empresa ID ${update.id}:`, err.message);
      }
    }
    console.log('\n¡Base de datos de Baserow actualizada con éxito!');
  } catch (error) {
    console.error('Error general en la ejecución:', error.message);
  }
}

run();

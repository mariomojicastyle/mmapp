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

const linkedinUpdates = [
  { id: 1, url: "https://www.linkedin.com/company/colibri-moveis/" },
  { id: 2, url: "https://www.linkedin.com/company/notavelmoveis/" },
  { id: 3, url: "https://www.linkedin.com/company/moveis-rufato/" },
  { id: 4, url: "https://www.linkedin.com/company/djmoveis/" },
  { id: 5, url: "https://www.linkedin.com/company/telasul/" },
  { id: 6, url: "https://www.linkedin.com/company/ditalia-moveis/" },
  { id: 7, url: "https://www.linkedin.com/company/moveis-albatroz/" },
  { id: 8, url: "https://www.linkedin.com/company/brv-moveis/" },
  { id: 9, url: "https://www.linkedin.com/company/tecno-mobili/" },
  { id: 10, url: "https://www.linkedin.com/company/artely/" },
  { id: 11, url: "https://www.linkedin.com/company/moveisbechara/" },
  { id: 12, url: "https://www.linkedin.com/company/zanzini-moveis/" },
  { id: 13, url: "https://www.linkedin.com/company/permobili-moveis/" },
  { id: 14, url: "https://www.linkedin.com/company/poliman-moveis/" },
  { id: 15, url: "https://www.linkedin.com/company/imcal-moveis/" }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Actualizando LinkedIn Corporativo para las 15 empresas (ID: ${empresasTableId})...`);
    for (const update of linkedinUpdates) {
      try {
        await request('PATCH', `/api/database/rows/table/${empresasTableId}/${update.id}/?user_field_names=true`, {
          "LinkedIn Corporativo": update.url
        }, token);
        console.log(`   Empresa ID ${update.id} ➔ LinkedIn actualizado: ${update.url}`);
      } catch (err) {
        console.error(`   Error al actualizar Empresa ID ${update.id}:`, err.message);
      }
    }
    console.log('\n¡Enlaces de LinkedIn corporativos actualizados con éxito!');
  } catch (error) {
    console.error('Error general:', error.message);
  }
}

run();

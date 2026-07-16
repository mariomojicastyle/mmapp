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

const finalLinkedInUpdates = [
  { id: 1, url: "https://www.linkedin.com/company/colibrimoveis/" },
  { id: 2, url: "https://www.linkedin.com/company/moveis-notavel/" },
  { id: 3, url: "https://www.linkedin.com/company/moveisrufato/" },
  { id: 4, url: "https://www.linkedin.com/company/djmoveis/" },
  { id: 5, url: "https://www.linkedin.com/company/telasul/" },
  { id: 6, url: "https://www.linkedin.com/company/ditaliamoveis/" },
  { id: 7, url: "https://www.linkedin.com/company/moveis-albatroz/" },
  { id: 8, url: "https://www.linkedin.com/company/brv-moveis/" },
  { id: 9, url: "https://www.linkedin.com/company/tecnomobili/" },
  { id: 10, url: "https://www.linkedin.com/company/artely/" },
  { id: 11, url: "https://www.linkedin.com/company/móveis-bechara/" },
  { id: 12, url: "https://www.linkedin.com/company/zanzini-móveis/" },
  { id: 13, url: "https://www.linkedin.com/company/permóbili-móveis/" },
  { id: 14, url: "https://www.linkedin.com/company/moveispoliman/" },
  { id: 15, url: "" } // Imcal Móveis se deja en blanco
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Actualizando perfiles validados de LinkedIn en la tabla ${empresasTableId}...`);
    for (const update of finalLinkedInUpdates) {
      try {
        await request('PATCH', `/api/database/rows/table/${empresasTableId}/${update.id}/?user_field_names=true`, {
          "LinkedIn Corporativo": update.url
        }, token);
        console.log(`   Empresa ID ${update.id} ➔ LinkedIn actualizado a: "${update.url}"`);
      } catch (err) {
        console.error(`   Error al actualizar Empresa ID ${update.id}:`, err.message);
      }
    }
    console.log('\n¡Todos los enlaces de LinkedIn validados se han actualizado en Baserow con éxito!');
  } catch (error) {
    console.error('Error general durante la ejecución:', error.message);
  }
}

run();

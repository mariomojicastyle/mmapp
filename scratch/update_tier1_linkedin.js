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

const tier1LinkedInUpdates = [
  { id: 16, url: "https://www.linkedin.com/company/bartira/" },
  { id: 17, url: "https://www.linkedin.com/company/grupo-k1/" },
  { id: 18, url: "https://www.linkedin.com/company/itatiaia/" },
  { id: 19, url: "https://www.linkedin.com/company/hennmoveis/" },
  { id: 20, url: "https://www.linkedin.com/company/madesa/" },
  { id: 21, url: "https://www.linkedin.com/company/demobilemoveis/" },
  { id: 22, url: "https://www.linkedin.com/company/moval/" },
  { id: 23, url: "" }, // Móveis Lopas no tiene página oficial de empresa en LinkedIn
  { id: 24, url: "https://www.linkedin.com/company/caemmun/" },
  { id: 25, url: "https://www.linkedin.com/company/santos-andira/" },
  { id: 26, url: "https://www.linkedin.com/company/multimoveis/" },
  { id: 27, url: "https://www.linkedin.com/company/bertolini/" },
  { id: 28, url: "https://www.linkedin.com/company/araplac/" },
  { id: 29, url: "https://www.linkedin.com/company/politorno/" },
  { id: 30, url: "https://www.linkedin.com/company/lineabrasilmoveis/" }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Actualizando URLs validadas de LinkedIn para el Tier 1 en la tabla ${empresasTableId}...`);
    for (const update of tier1LinkedInUpdates) {
      try {
        await request('PATCH', `/api/database/rows/table/${empresasTableId}/${update.id}/?user_field_names=true`, {
          "LinkedIn Corporativo": update.url
        }, token);
        console.log(`   Empresa ID ${update.id} ➔ LinkedIn actualizado a: "${update.url}"`);
      } catch (err) {
        console.error(`   Error al actualizar Empresa ID ${update.id}:`, err.message);
      }
    }
    console.log('\n¡Base de datos de Baserow para Tier 1 actualizada con éxito con URLs validadas!');
  } catch (error) {
    console.error('Error general de ejecución:', error.message);
  }
}

run();

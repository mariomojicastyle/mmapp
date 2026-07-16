const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const viewId = 4352;

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

    console.log(`2. Reordenando las columnas en la vista ${viewId}...`);
    
    // Definimos el orden secuencial de 0 a 14 de las columnas
    const payload = {
      field_options: {
        "9489": { "order": 0 },  // Nombre de la Empresa
        "9490": { "order": 1 },  // Notas
        "9491": { "order": 2 },  // Activo
        "9492": { "order": 3 },  // Sitio Web
        "9493": { "order": 4 },  // LinkedIn Corporativo
        "9547": { "order": 5 },  // Facebook (Nuevo, queda junto tras LinkedIn)
        "9548": { "order": 6 },  // Instagram (Nuevo)
        "9549": { "order": 7 },  // Canal Preferido (Nuevo)
        "9550": { "order": 8 },  // Actividad en Redes (Nuevo)
        "9494": { "order": 9 },  // Pais
        "9495": { "order": 10 }, // Nicho / Segmento
        "9496": { "order": 11 }, // Dolor Principal
        "9497": { "order": 12 }, // Estado Comercial
        "9498": { "order": 13 }, // Notas del Target
        "9546": { "order": 14 }  // Leads
      }
    };

    await request('PATCH', `/api/database/views/${viewId}/field-options/`, payload, token);
    console.log('¡Las columnas se han reordenado visualmente con éxito!');
  } catch (error) {
    console.error('Error al reordenar columnas:', error.message);
  }
}

run();

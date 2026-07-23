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
      headers: { 'Content-Type': 'application/json' }
    };
    if (postData) options.headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) options.headers['Authorization'] = `JWT ${token}`;

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody ? JSON.parse(responseBody) : {});
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseBody}`));
        }
      });
    });
    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    const rowIds = [187, 188, 189, 190, 191];
    const beforeId = 125; // Move before Sabrina Leitão (ID 125)

    for (const rowId of rowIds) {
      console.log(`Intentando mover fila ${rowId} antes de ${beforeId}...`);
      try {
        // Probamos PATCH /move/?before_id=125
        const res = await request('PATCH', `/api/database/rows/table/994/${rowId}/move/?before_id=${beforeId}`, null, token);
        console.log(`Mover ${rowId} OK con before_id param:`, res);
      } catch (e1) {
        console.log(`Error con params, probando body o before endpoint:`, e1.message);
        try {
          const res2 = await request('POST', `/api/database/rows/table/994/${rowId}/move/`, { before_id: beforeId }, token);
          console.log(`Mover ${rowId} OK con POST body:`, res2);
        } catch (e2) {
          console.log(`Error en POST body:`, e2.message);
        }
      }
    }
  } catch (e) {
    console.error('Error general:', e.message);
  }
}

run();

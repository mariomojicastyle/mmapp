const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const contactosTableId = 994;

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
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    const row28 = await request('GET', `/api/database/rows/table/${contactosTableId}/28/?user_field_names=true`, null, token);
    const row29 = await request('GET', `/api/database/rows/table/${contactosTableId}/29/?user_field_names=true`, null, token);
    console.log('Row 28:', JSON.stringify(row28, null, 2));
    console.log('Row 29:', JSON.stringify(row29, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();

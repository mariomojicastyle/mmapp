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
          reject(new Error(`Request failed: ${responseBody}`));
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

    console.log('FIELDS FOR LEADS (ID: 994):');
    const leadsFields = await request('GET', '/api/database/fields/table/994/', null, token);
    leadsFields.forEach(f => {
      console.log(`- ${f.name} (ID: ${f.id}, Type: ${f.type})`);
    });

    console.log('\nFIELDS FOR INTERACCIONES (ID: 995):');
    const intFields = await request('GET', '/api/database/fields/table/995/', null, token);
    intFields.forEach(f => {
      console.log(`- ${f.name} (ID: ${f.id}, Type: ${f.type})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();

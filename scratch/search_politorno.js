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

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body ? JSON.parse(body) : {}));
    });
    req.on('error', e => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  const auth = await request('POST', '/api/user/token-auth/', { username, password });
  const token = auth.token;
  const res = await request('GET', '/api/database/rows/table/991/?user_field_names=true&search=Politorno', null, token);
  console.log('Politorno Company Search Result:');
  res.results.forEach(r => {
    console.log(`ID: ${r.id} | Name: ${r["Nombre de la Empresa"]} | Web: ${r["Sitio Web"]} | Phone: ${r["WhatsApp"]}`);
  });
}
main();

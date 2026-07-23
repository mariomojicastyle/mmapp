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
    
    // Buscar todos los leads (994)
    const res = await request('GET', '/api/database/rows/table/994/?user_field_names=true&size=200', null, token);
    
    // Filtrar los que están vinculados a empresas con ID entre 39 y 66
    const badLinked = res.results.filter(r => {
      if (r["Empresa Vinculada"] && r["Empresa Vinculada"].length > 0) {
        const coId = r["Empresa Vinculada"][0].id;
        return coId >= 39 && coId <= 66;
      }
      return false;
    });

    console.log(`Leads vinculados a las empresas duplicadas (39-66): ${badLinked.length}`);
    badLinked.forEach(lead => {
      console.log(`Lead ID ${lead.id}: ${lead.Nombre} ${lead.Apellido} -> Empresa Vinculada: ${lead["Empresa Vinculada"][0].id} (${lead["Empresa Vinculada"][0].value})`);
    });

  } catch(e) {
    console.error(e.message);
  }
}
run();

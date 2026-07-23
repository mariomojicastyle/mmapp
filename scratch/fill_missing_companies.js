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

const updates = [
  {
    id: 48,
    data: {
      "Sitio Web": "https://www.unicasamoveis.com.br/",
      "LinkedIn Corporativo": "https://www.linkedin.com/company/unicasa-moveis-s-a/",
      "Facebook": "https://www.facebook.com/unicasamoveis",
      "Instagram": "https://www.instagram.com/unicasamoveis"
    }
  },
  {
    id: 58,
    data: {
      "Sitio Web": "https://www.tuboarte.com.br",
      "LinkedIn Corporativo": "https://www.linkedin.com/company/tuboarte/",
      "Facebook": "https://www.facebook.com/tuboartemoveis/",
      "Instagram": "https://www.instagram.com/tuboartemoveis/"
    }
  },
  {
    id: 67,
    data: {
      "Sitio Web": "https://www.delucci.com.br",
      "Facebook": "https://www.facebook.com/deluccimoveis/",
      "Instagram": "https://www.instagram.com/deluccimoveis/"
    }
  }
];

async function run() {
  try {
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;
    
    for (const update of updates) {
      console.log(`Actualizando empresa ID ${update.id}...`);
      await request('PATCH', `/api/database/rows/table/991/${update.id}/?user_field_names=true`, update.data, token);
      console.log(`Empresa ID ${update.id} actualizada con éxito.`);
    }

    console.log('¡Todas las empresas fueron actualizadas!');
  } catch(e) {
    console.error(e.message);
  }
}
run();

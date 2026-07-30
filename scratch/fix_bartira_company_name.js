const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

const empresasTableId = 991;
const leadsTableId = 994;

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
    
    // 1. Search for Bartira in table 991
    const empresasRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    let bartiraRow = empresasRes.results.find(row => row['Nombre de la Empresa'] && row['Nombre de la Empresa'].toLowerCase().includes('bartira'));
    
    let bartiraId;
    const officialName = 'Indústria de Móveis Bartira Ltda';

    if (bartiraRow) {
      bartiraId = bartiraRow.id;
      console.log(`Found Bartira in table 991 (ID: ${bartiraId}). Renaming to "${officialName}"...`);
      await request('PATCH', `/api/database/rows/table/${empresasTableId}/${bartiraId}/?user_field_names=true`, {
        'Nombre de la Empresa': officialName,
        'Tier': 'Tier 1'
      }, token);
    } else {
      console.log(`Creating "${officialName}" in table 991...`);
      const newComp = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, {
        'Nombre de la Empresa': officialName,
        'Sitio Web': 'https://www.moveisbartira.com.br',
        'LinkedIn Corporativo': 'https://www.linkedin.com/company/industria-de-m%C3%B3veis-bartira-ltda/',
        'Pais': 'Brasil',
        'Nicho / Segmento': 'Mobiliario RTA',
        'Tier': 'Tier 1',
        'Canal Preferido': 4029,
        'Actividad en Redes': 4034,
        'Estado Comercial': 'En Contacto'
      }, token);
      bartiraId = newComp.id;
    }

    // 2. Update Lead Denis Roveri (Row ID 257) in table 994
    console.log(`Updating Lead Denis Roveri (ID: 257) with company name "${officialName}" and linked ID ${bartiraId}...`);
    await request('PATCH', `/api/database/rows/table/${leadsTableId}/257/?user_field_names=true`, {
      'Empresa': officialName,
      'Empresa Vinculada': [bartiraId]
    }, token);

    console.log('🎉 Successfully updated company and lead in Baserow!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();

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

// List of Tier 3 companies from ranking_empresas_rta_brasil.md
const tier3Companies = [
  {
    nombre: 'Móveis Videira',
    web: 'https://www.moveisvideira.com.br',
    linkedin: 'https://www.linkedin.com/company/moveis-videira/',
    descripcion: 'Empresa matriz de Tecno Mobili. Facturación est. R$ 55M. Especialistas en home office.'
  },
  {
    nombre: 'Art In Móveis',
    web: 'https://www.artinmoveis.com.br',
    linkedin: 'https://www.linkedin.com/company/art-in-moveis/',
    descripcion: 'Camas multifuncionales y muebles infantiles RTA en Bento Gonçalves, RS. Facturación est. R$ 50M.'
  },
  {
    nombre: 'Completa Móveis',
    web: 'https://www.completamoveis.com.br',
    linkedin: 'https://www.linkedin.com/company/completa-moveis/',
    descripcion: 'Organizadores infantiles y muebles auxiliares RTA en Bento Gonçalves, RS. Facturación est. R$ 48M.'
  },
  {
    nombre: 'Fellicci Móveis',
    web: 'https://www.fellicci.com.br',
    linkedin: 'https://www.linkedin.com/company/fellicci-moveis/',
    descripcion: 'Cocinas compactas y lavanderías RTA en Bento Gonçalves, RS. Facturación est. R$ 45M.'
  },
  {
    nombre: 'J&A Móveis',
    web: 'https://www.jamoveis.com.br',
    linkedin: 'https://www.linkedin.com/company/j&a-moveis/',
    descripcion: 'Camas y cómodas RTA de alto volumen en Ubá, MG. Facturación est. R$ 42M.'
  },
  {
    nombre: 'Rodial Móveis',
    web: 'https://www.rodial.com.br',
    linkedin: 'https://www.linkedin.com/company/rodial-moveis/',
    descripcion: 'Armarios modulares y roperos de alta rotación en Ubá, MG. Facturación est. R$ 40M.'
  },
  {
    nombre: 'Sallêto Móveis',
    web: 'https://www.salleto.com.br',
    linkedin: 'https://www.linkedin.com/company/salleto-moveis/',
    descripcion: 'Roperos y cómodas RTA para el mercado del Sudeste en Ubá, MG. Facturación est. R$ 38M.'
  },
  {
    nombre: 'Valdemóveis',
    web: 'https://www.valdemoveis.com.br',
    linkedin: 'https://www.linkedin.com/company/valdemoveis/',
    descripcion: 'Racks, estanterías y paneles de TV populares RTA en Ubá, MG. Facturación est. R$ 36M.'
  },
  {
    nombre: 'Bechara Móveis',
    web: 'https://www.moveisbechara.com.br',
    linkedin: 'https://www.linkedin.com/company/moveisbechara/',
    descripcion: 'Auxiliares de oficina y hogar RTA en Tanabi, SP. Facturación est. R$ 35M.'
  },
  {
    nombre: 'Olivar Móveis',
    web: 'https://www.olivarmoveis.com.br',
    linkedin: 'https://www.linkedin.com/company/olivar-moveis/',
    descripcion: 'Racks, mesas de centro y auxiliares de estilo retro RTA en Ubá, MG. Facturación est. R$ 32M.'
  }
];

async function run() {
  try {
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    
    // Fetch all existing rows in table 991
    const empresasRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    const existingRows = empresasRes.results;

    console.log(`Checking ${tier3Companies.length} Tier 3 companies against existing ${existingRows.length} rows...`);

    for (const comp of tier3Companies) {
      const compClean = comp.nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = existingRows.find(r => {
        const nameClean = (r['Nombre de la Empresa'] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return nameClean.includes(compClean) || compClean.includes(nameClean);
      });

      if (found) {
        console.log(`ℹ️ Company "${comp.nombre}" already exists (ID: ${found.id}). Updating Tier to "Tier 3"...`);
        await request('PATCH', `/api/database/rows/table/${empresasTableId}/${found.id}/?user_field_names=true`, {
          'Tier': 'Tier 3',
          'Notas': comp.descripcion
        }, token);
        console.log(`✅ Updated ID ${found.id} to Tier 3`);
      } else {
        console.log(`Creating new company "${comp.nombre}" in Tier 3...`);
        const created = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, {
          'Nombre de la Empresa': comp.nombre,
          'Sitio Web': comp.web,
          'LinkedIn Corporativo': comp.linkedin,
          'Pais': 'Brasil',
          'Nicho / Segmento': 'Mobiliario RTA',
          'Canal Preferido': 4029, // LinkedIn
          'Actividad en Redes': 4034, // Moderado
          'Estado Comercial': 'Prospecto',
          'Tier': 'Tier 3',
          'Notas': comp.descripcion
        }, token);
        console.log(`✅ Created Tier 3 Company: ${comp.nombre} (ID: ${created.id})`);
      }
    }

    console.log('🎉 All 10 Tier 3 companies successfully injected/updated in Baserow CRM!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();

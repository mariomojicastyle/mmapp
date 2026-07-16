const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
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

function makeLinkedInSearch(name, company) {
  const query = encodeURIComponent(`${name} ${company}`);
  return `https://www.linkedin.com/search/results/people/?keywords=${query}`;
}

function makeFacebookSearch(name, company) {
  const query = encodeURIComponent(`${name} ${company}`);
  return `https://www.facebook.com/search/people/?q=${query}`;
}

function makeInstagramSearch(name, company) {
  const query = encodeURIComponent(`site:instagram.com "${name}" "${company}"`);
  return `https://www.google.com/search?q=${query}`;
}

const humanSocialUpdates = [
  {
    id: 26, // Jamylle Duarte
    name: "Jamylle Duarte",
    company: "Kits Paraná",
    whatsapp: "" // Fijo corporativo
  },
  {
    id: 27, // Edson Stocki
    name: "Edson Stocki",
    company: "Kits Paraná",
    whatsapp: ""
  },
  {
    id: 28, // Ricardo Carandina
    name: "Ricardo Carandina",
    company: "Möbler Móveis",
    whatsapp: ""
  },
  {
    id: 29, // Diogenys Marcelo Carandina
    name: "Diogenys Marcelo Carandina",
    company: "Möbler Móveis",
    whatsapp: ""
  },
  {
    id: 30, // Evaldo Luís Arruda
    name: "Evaldo Luís Arruda",
    company: "Kits Paraná",
    whatsapp: ""
  }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log('2. Generando y actualizando enlaces de búsqueda de redes para los 5 leads de humanos...');
    for (const update of humanSocialUpdates) {
      try {
        const payload = {
          "LinkedIn": makeLinkedInSearch(update.name, update.company),
          "Facebook": makeFacebookSearch(update.name, update.company),
          "Instagram": makeInstagramSearch(update.name, update.company),
          "WhatsApp": update.whatsapp
        };
        await request('PATCH', `/api/database/rows/table/${leadsTableId}/${update.id}/?user_field_names=true`, payload, token);
        console.log(`   Lead ID ${update.id} (${update.name}) ➔ Redes de búsqueda configuradas con éxito.`);
      } catch (err) {
        console.error(`   Error al configurar redes para Lead ID ${update.id}:`, err.message);
      }
    }
    console.log('\n¡Proceso de inyección de enlaces de redes sociales para humanos completado con éxito!');
  } catch (error) {
    console.error('Error general de ejecución:', error.message);
  }
}

run();

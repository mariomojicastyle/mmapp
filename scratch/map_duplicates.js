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

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
  try {
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;
    
    // 1. Obtener todas las empresas
    const resEmpresas = await request('GET', '/api/database/rows/table/991/?user_field_names=true&size=200', null, token);
    const originals = resEmpresas.results.filter(c => c.id <= 38 && c.id !== 11); // 1-38 son los buenos
    const duplicates = resEmpresas.results.filter(c => c.id >= 39 && c.id <= 66); // 39-66 son los malos vacíos

    const duplicateToOriginalMap = {};
    for (let dup of duplicates) {
      const dupNorm = normalize(dup["Nombre de la Empresa"]);
      // Buscar el original que mejor coincida
      let orig = originals.find(o => normalize(o["Nombre de la Empresa"]) === dupNorm);
      if (!orig) {
        // match parcial
        orig = originals.find(o => dupNorm.includes(normalize(o["Nombre de la Empresa"])) || normalize(o["Nombre de la Empresa"]).includes(dupNorm));
      }
      if (orig) {
        duplicateToOriginalMap[dup.id] = orig.id;
        console.log(`Mapeo: [${dup.id}] ${dup["Nombre de la Empresa"]} -> [${orig.id}] ${orig["Nombre de la Empresa"]}`);
      } else {
        console.log(`No se encontró original para: [${dup.id}] ${dup["Nombre de la Empresa"]}`);
      }
    }

    // Manual mappings for exactitude based on output
    duplicateToOriginalMap[48] = 48; // wait, unicasa
    duplicateToOriginalMap[49] = 16; // Industria De Móveis Bartira Ltda -> Móveis Bartira
    duplicateToOriginalMap[50] = 17; // GRUPO K1 S.A. -> Kappesberg (Grupo K1)
    duplicateToOriginalMap[51] = 18; // Itatiaia -> Cozinhas Itatiaia
    duplicateToOriginalMap[58] = 35; // Tuboarte -> Assuming 35 or something, we need to find it.

    // Let's print out all originals to check
    console.log("Originales disponibles:");
    originals.forEach(o => console.log(`[${o.id}] ${o["Nombre de la Empresa"]}`));

  } catch(e) {
    console.error(e.message);
  }
}
run();

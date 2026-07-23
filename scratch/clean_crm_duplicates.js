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

const map = {
  39: 7, 
  40: 8, 
  41: 9, 
  42: 10, 
  43: 12, 
  44: 13, 
  45: 14, 
  46: 15, 
  47: 1, 
  // 48 Unicasa - keep
  49: 16, 
  50: 17, 
  51: 18, 
  52: 19, 
  53: 20, 
  54: 21, 
  55: 22, 
  56: 23, 
  57: 24, 
  // 58 Tuboarte - keep
  59: 25, 
  60: 26, 
  61: 27, 
  62: 31, 
  63: 29, 
  64: 30, 
  65: 31, 
  66: 32 
};

async function run() {
  try {
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Obtener todos los leads (994)
    const resLeads = await request('GET', '/api/database/rows/table/994/?user_field_names=true&size=200', null, token);
    const allLeads = resLeads.results;

    console.log(`Leads totales a evaluar: ${allLeads.length}`);
    
    // Para cada lead, si su Empresa Vinculada está en el map, actualizarlo
    for (const lead of allLeads) {
      if (lead["Empresa Vinculada"] && lead["Empresa Vinculada"].length > 0) {
        const oldCoId = lead["Empresa Vinculada"][0].id;
        if (map[oldCoId]) {
          const newCoId = map[oldCoId];
          console.log(`Migrando lead [${lead.id}] ${lead.Nombre} de la empresa ${oldCoId} a la original ${newCoId}...`);
          await request('PATCH', `/api/database/rows/table/994/${lead.id}/?user_field_names=true`, {
            "Empresa Vinculada": [newCoId]
          }, token);
        }
      }
    }

    console.log('Migración de leads completada. Procediendo a eliminar empresas duplicadas y vacías...');

    // Ahora borrar las empresas duplicadas (ID 39 a 66 excepto 48 y 58)
    const toDelete = Object.keys(map);
    for (const id of toDelete) {
      console.log(`Eliminando empresa duplicada ID: ${id}`);
      try {
        await request('DELETE', `/api/database/rows/table/991/${id}/`, null, token);
      } catch (err) {
        console.log(`Error eliminando ${id}: ${err.message}`);
      }
    }

    console.log('¡Limpieza del CRM completada con éxito!');
  } catch(e) {
    console.error(e.message);
  }
}
run();

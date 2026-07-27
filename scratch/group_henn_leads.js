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
    console.log('1. Autenticando...');
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    const companyId = 19; // Móveis Henn

    // Buscar todos los leads
    console.log('2. Obteniendo leads...');
    const resLeads = await request('GET', '/api/database/rows/table/994/?user_field_names=true&size=200', null, token);
    const allLeads = resLeads.results;

    // Obtener los de Henn
    const hennLeads = allLeads.filter(l => l["Empresa Vinculada"] && l["Empresa Vinculada"].some(c => c.id === companyId));
    console.log(`Total leads de Henn: ${hennLeads.length}`);
    hennLeads.forEach(l => console.log(`- [ID ${l.id}] ${l.Nombre} ${l.Apellido}`));

    // Queremos que TODOS los de Henn estén juntos después de Daniela Ebert (ID 108) y antes de Ernani André (ID 109).
    // Queremos mover: 158 (Marisa), 195 (Édio), 196 (Rudgeri) antes de ID 109.
    const beforeId = 109; // Fila justo después de Daniela Ebert (ID 108)
    const toMove = [158, 195, 196];

    console.log(`3. Moviendo filas ${toMove.join(', ')} antes de ID ${beforeId}...`);
    for (const rowId of toMove) {
      await request('PATCH', `/api/database/rows/table/994/${rowId}/move/?before_id=${beforeId}`, null, token);
      console.log(`   [ID ${rowId}] Movido antes de ID ${beforeId}.`);
    }

    console.log('4. Verificando nuevo orden...');
    const resLeadsNew = await request('GET', '/api/database/rows/table/994/?user_field_names=true&size=200', null, token);
    const allLeadsNew = resLeadsNew.results;
    const hennLeadsNew = allLeadsNew.filter(l => l["Empresa Vinculada"] && l["Empresa Vinculada"].some(c => c.id === companyId));
    console.log('Leads de Henn reordenados:');
    hennLeadsNew.forEach(l => console.log(`   - [ID ${l.id}] ${l.Nombre} ${l.Apellido}`));

    console.log('¡Proceso completado exitosamente!');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

run();

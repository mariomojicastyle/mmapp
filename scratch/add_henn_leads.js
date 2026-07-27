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

    // Buscar la empresa Móveis Henn en la tabla 991
    console.log('2. Buscando empresa Móveis Henn...');
    const coRes = await request('GET', '/api/database/rows/table/991/?user_field_names=true&search=Henn', null, token);
    let companyId = 19;
    if (coRes.results && coRes.results.length > 0) {
      companyId = coRes.results[0].id;
      console.log(`   Móveis Henn encontrada con ID: ${companyId}`);
    } else {
      console.log(`   Usando ID por defecto: ${companyId}`);
    }

    // Buscar leads existentes de Móveis Henn para saber dónde posicionar los nuevos
    console.log('3. Buscando leads existentes de Móveis Henn...');
    const resLeads = await request('GET', '/api/database/rows/table/994/?user_field_names=true&size=200', null, token);
    const allLeads = resLeads.results;

    const hennLeads = allLeads.filter(l => l["Empresa Vinculada"] && l["Empresa Vinculada"].some(c => c.id === companyId));
    console.log(`   Leads encontrados de Henn: ${hennLeads.length}`);
    hennLeads.forEach(l => console.log(`   - [ID ${l.id}] ${l.Nombre} ${l.Apellido} (Order: ${l.order})`));

    // El último lead del grupo de Henn
    let targetBeforeId = null;
    if (hennLeads.length > 0) {
      const lastHenn = hennLeads[hennLeads.length - 1];
      // Buscar la fila que sigue inmediatamente a la última de Henn
      const lastIndex = allLeads.findIndex(l => l.id === lastHenn.id);
      if (lastIndex !== -1 && lastIndex + 1 < allLeads.length) {
        targetBeforeId = allLeads[lastIndex + 1].id;
        console.log(`   Se posicionarán antes de la fila ID ${targetBeforeId} (${allLeads[lastIndex + 1].Nombre} ${allLeads[lastIndex + 1].Apellido})`);
      }
    }

    const newLeads = [
      {
        "Nombre": "Édio",
        "Apellido": "Grassi",
        "Empresa": "Móveis Henn",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Diretor Administrativo",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/édio-grassi-0aa87633/",
        "Facebook": "https://www.facebook.com/search/top/?q=Édio%20Grassi%20Henn",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Édio%20Grassi%20Henn",
        "Canal Preferido": 4037,
        "Actividad en Redes": 4045,
        "Origen": "Prospección Activa",
        "Email": "edio.grassi@henn.com.br"
      },
      {
        "Nombre": "Rudgeri",
        "Apellido": "Henkel",
        "Empresa": "Móveis Henn",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Gerente de Planejamento e Materiais",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/rudgeri-henkel-22723011a/",
        "Facebook": "https://www.facebook.com/search/top/?q=Rudgeri%20Henkel%20Henn",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Rudgeri%20Henkel%20Henn",
        "Canal Preferido": 4037,
        "Actividad en Redes": 4045,
        "Origen": "Prospección Activa",
        "Email": "rudgeri.henkel@henn.com.br"
      }
    ];

    console.log('4. Inyectando y posicionando nuevos leads de Henn...');
    for (const lead of newLeads) {
      const created = await request('POST', '/api/database/rows/table/994/?user_field_names=true', lead, token);
      console.log(`   [ID ${created.id}] ${lead.Nombre} ${lead.Apellido} (${lead.Rol}) insertado.`);

      if (targetBeforeId) {
        await request('PATCH', `/api/database/rows/table/994/${created.id}/move/?before_id=${targetBeforeId}`, null, token);
        console.log(`   [ID ${created.id}] Movido exitosamente antes de la fila ID ${targetBeforeId}.`);
      }
    }

    console.log('¡Proceso completado con éxito!');

  } catch (e) {
    console.error('Error:', e.message);
  }
}

run();

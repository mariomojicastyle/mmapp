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

    // Buscar la empresa Moval Móveis en la tabla 991
    console.log('2. Buscando empresa Moval Móveis...');
    const coRes = await request('GET', '/api/database/rows/table/991/?user_field_names=true&search=Moval', null, token);
    let companyId = 22;
    if (coRes.results && coRes.results.length > 0) {
      companyId = coRes.results[0].id;
      console.log(`   Moval Móveis encontrada con ID: ${companyId}`);
    } else {
      console.log(`   Usando ID por defecto: ${companyId}`);
    }

    const movalLeads = [
      {
        "Nombre": "Heitor",
        "Apellido": "Levinski",
        "Empresa": "Moval Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Marketing, Design e Product Management",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/heitor-levinski/",
        "Facebook": "https://www.facebook.com/search/top/?q=Heitor%20Levinski%20Moval",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Heitor%20Levinski%20Moval",
        "Canal Preferido": 4037,
        "Actividad en Redes": 4045,
        "Origen": "Prospección Activa",
        "Email": "heitor.levinski@moval.com.br"
      },
      {
        "Nombre": "Stefani H.",
        "Apellido": "Vieira",
        "Empresa": "Moval Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Assistente de Desenvolvimento Humano (R&S)",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/stefanihvieira/",
        "Facebook": "https://www.facebook.com/search/top/?q=Stefani%20Vieira%20Moval",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Stefani%20Vieira%20Moval",
        "Canal Preferido": 4037,
        "Actividad en Redes": 4045,
        "Origen": "Prospección Activa",
        "Email": "stefani.vieira@moval.com.br"
      },
      {
        "Nombre": "Jaqueline Cuerda",
        "Apellido": "Monzani",
        "Empresa": "Moval Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Gerente de Comércio Exterior",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/jaqueline-cuerda-monzani-a955253a/",
        "Facebook": "https://www.facebook.com/search/top/?q=Jaqueline%20Monzani%20Moval",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Jaqueline%20Monzani%20Moval",
        "Canal Preferido": 4037,
        "Actividad en Redes": 4045,
        "Origen": "Prospección Activa",
        "Email": "jaqueline.monzani@moval.com.br"
      },
      {
        "Nombre": "Eronil",
        "Apellido": "Barbosa",
        "Empresa": "Moval Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Gerente de Logística",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/eronil-barbosa-08686440/",
        "Facebook": "https://www.facebook.com/search/top/?q=Eronil%20Barbosa%20Moval",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Eronil%20Barbosa%20Moval",
        "Canal Preferido": 4037,
        "Actividad en Redes": 4045,
        "Origen": "Prospección Activa",
        "Email": "eronil.barbosa@moval.com.br"
      },
      {
        "Nombre": "Kamile",
        "Apellido": "Rinaldo",
        "Empresa": "Moval Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Engenheira de Segurança do Trabalho e Civil",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/kamile-rinaldo-776a4559/",
        "Facebook": "https://www.facebook.com/search/top/?q=Kamile%20Rinaldo%20Moval",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Kamile%20Rinaldo%20Moval",
        "Canal Preferido": 4037,
        "Actividad en Redes": 4045,
        "Origen": "Prospección Activa",
        "Email": "kamile.rinaldo@moval.com.br"
      }
    ];

    console.log('3. Inyectando leads secuencialmente al final de la tabla...');
    for (const lead of movalLeads) {
      const created = await request('POST', '/api/database/rows/table/994/?user_field_names=true', lead, token);
      console.log(`   [ID ${created.id}] ${lead.Nombre} ${lead.Apellido} (${lead.Rol}) insertado con éxito.`);
    }

    console.log('¡Proceso completado exitosamente!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}

run();

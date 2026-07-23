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

    const companyId = 22; // Moval Móveis
    const beforeId = 125; // Sabrina Leitão (Grupo Lopas)

    const movalLeads = [
      {
        "Nombre": "Adilson",
        "Apellido": "Rodrigues",
        "Empresa": "Moval Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Diretor Adjunto",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/adilson-rodrigues-3a19a334/",
        "Facebook": "https://www.facebook.com/search/top/?q=Adilson%20Rodrigues%20Moval",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Adilson%20Rodrigues%20Moval",
        "Canal Preferido": 4037,
        "Actividad en Redes": 4045,
        "Origen": "Prospección Activa",
        "Email": "adilson.rodrigues@moval.com.br"
      },
      {
        "Nombre": "Marcos",
        "Apellido": "Nascimento",
        "Empresa": "Moval Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Coordenador de Marketing",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/marcos-nascimento-a118a8a0/",
        "Facebook": "https://www.facebook.com/search/top/?q=Marcos%20Nascimento%20Moval",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Marcos%20Nascimento%20Moval",
        "Canal Preferido": 4037,
        "Actividad en Redes": 4045,
        "Origen": "Prospección Activa",
        "Email": "marcos.nascimento@moval.com.br"
      },
      {
        "Nombre": "Lucas Capitanio",
        "Apellido": "de Oliveira",
        "Empresa": "Moval Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": "Técnico de Segurança do Trabalho",
        "Status": 4017,
        "Estado CRM": 4021,
        "LinkedIn": "https://www.linkedin.com/in/lucas-capitanio-de-oliveira/",
        "Facebook": "https://www.facebook.com/search/top/?q=Lucas%20Capitanio%20de%20Oliveira%20Moval",
        "Instagram": "https://www.instagram.com/explore/search/keyword/?q=Lucas%20Capitanio%20de%20Oliveira%20Moval",
        "Canal Preferido": 4037,
        "Actividad en Redes": 4045,
        "Origen": "Prospección Activa",
        "Email": "lucas.oliveira@moval.com.br"
      }
    ];

    console.log('2. Inyectando y posicionando nuevos leads junto al bloque de Moval...');
    for (const lead of movalLeads) {
      const created = await request('POST', '/api/database/rows/table/994/?user_field_names=true', lead, token);
      console.log(`   [ID ${created.id}] ${lead.Nombre} ${lead.Apellido} creado.`);
      
      // Mover la fila para que quede antes de Sabrina Leitão (ID 125)
      await request('PATCH', `/api/database/rows/table/994/${created.id}/move/?before_id=${beforeId}`, null, token);
      console.log(`   [ID ${created.id}] Posicionado antes de la fila ${beforeId}.`);
    }

    console.log('¡Proceso completado exitosamente!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}

run();

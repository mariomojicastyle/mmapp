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
      path: encodeURI(path),
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (postData) options.headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) options.headers['Authorization'] = `JWT ${token}`;

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          console.error("Error parsing response body:", body);
          resolve({});
        }
      });
    });
    req.on('error', e => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    const companyId = 68; // GenialFlex Móveis
    const companyPhone = "+55 54 3454-7000";
    const companyWhatsApp = "https://wa.me/555434547000";

    // 1. Update Company details in Table 991
    const companyUpdate = {
      "Sitio Web": "https://www.genialflex.com.br",
      "LinkedIn Corporativo": "https://www.linkedin.com/company/genialflexmoveis/",
      "Notas del Target": "Parque fabril de 12 mil m² em Garibaldi (RS). Produção de cozinhas, guarda-roupas, racks e complementos RTA. Mais de 20 anos de mercado."
    };
    await request('PATCH', `/api/database/rows/table/991/${companyId}/?user_field_names=true`, companyUpdate, token);
    console.log(`✅ Datos de Empresa GenialFlex (ID 68) mejoarados en Tabla 991.`);

    // 2. Inject Lead "Genialflex (GenialFlex) Móveis" into Table 994
    const leadName = "Genialflex (GenialFlex)";
    const leadSurname = "Móveis";
    const linkedinUrl = "https://www.linkedin.com/in/genialflex-m%C3%B3veis-5732532aa/";
    const role = "Perfil Institucional / Conta Oficial";

    const nameStr = encodeURIComponent(`${leadName} ${leadSurname}`);
    const companyStr = encodeURIComponent("GenialFlex Móveis");
    const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
    const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

    const newLeadPayload = {
      "Nombre": leadName,
      "Apellido": leadSurname,
      "Empresa": "GenialFlex Móveis",
      "Empresa Vinculada": [companyId],
      "Pais": "Brasil",
      "Rol": role,
      "LinkedIn": linkedinUrl,
      "Origen": "Prospección Activa",
      "Notas": "Perfil Institucional em LinkedIn da fábrica GenialFlex Móveis em Garibaldi, RS.",
      "Email": "contato@genialflex.com.br",
      "Telefono": companyPhone,
      "WhatsApp": companyWhatsApp,
      "Descripcion de la idea": "Perfil corporativo e conta oficial da GenialFlex Móveis.",
      "Facebook": facebookUrl,
      "Instagram": instagramUrl,
      "Status": 4017,          // Nuevo
      "Estado CRM": 4021,      // Prospecto
      "Canal Preferido": 4037,  // LinkedIn
      "Actividad en Redes": 4045// Inactivo
    };

    const result = await request('POST', '/api/database/rows/table/994/?user_field_names=true', newLeadPayload, token);
    console.log(`✅ Lead corporativo ${leadName} ${leadSurname} inyectado con éxito. ID Baserow: ${result.id}`);

  } catch (err) {
    console.error("Error actualizando e inyectando GenialFlex:", err);
  }
}

run();

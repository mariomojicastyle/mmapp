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

    // 1. Search for Bartira in Table 991 (Empresas)
    let companyRes = await request('GET', '/api/database/rows/table/991/?user_field_names=true&search=Bartira', null, token);

    let companyId;
    let companyPhone = "+55 11 4547-9000";
    let companyWhatsApp = "https://wa.me/551145479000";

    if (companyRes.results && companyRes.results.length > 0) {
      companyId = companyRes.results[0].id;
      console.log(`Empresa Indústria de Móveis Bartira Ltda encontrada en ID: ${companyId}`);
      if (companyRes.results[0].Telefono) companyPhone = companyRes.results[0].Telefono;
      if (companyRes.results[0].WhatsApp) companyWhatsApp = companyRes.results[0].WhatsApp;
    } else {
      console.log("Creando empresa Indústria de Móveis Bartira Ltda en Tabla 991...");
      const newCompany = {
        "Nombre de la Empresa": "Indústria de Móveis Bartira Ltda",
        "Sitio Web": "https://www.moveisbartira.com.br",
        "LinkedIn Corporativo": "https://www.linkedin.com/company/industria-de-moveis-bartira-ltda/",
        "Pais": "Brasil",
        "Canal Preferido": 4029, // LinkedIn
        "Actividad en Redes": 4033, // Muy Activo
        "Notas del Target": "Maior fábrica de móveis RTA da América Latina em Mauá (SP), pertencente ao Grupo Casas Bahia (Via)."
      };
      const createdCompany = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany, token);
      companyId = createdCompany.id;
      console.log(`Empresa creada con ID: ${companyId}`);
    }

    const leads = [
      {
        firstName: "Eduardo Alex",
        lastName: "Caparroz",
        role: "Gerente Industrial / Plant Manager",
        linkedinUrl: "https://www.linkedin.com/in/eduardo-alex-caparroz/"
      },
      {
        firstName: "José Carlos",
        lastName: "de Oliveira",
        role: "Coordenador de Engenharia",
        linkedinUrl: "https://www.linkedin.com/in/jose-carlos-de-oliveira-bartira/"
      },
      {
        firstName: "Caetano",
        lastName: "Ottati",
        role: "Gerente de Manutenção",
        linkedinUrl: "https://www.linkedin.com/in/caetano-ottati/"
      },
      {
        firstName: "Luiz",
        lastName: "Henrique",
        role: "Supervisor de Produção",
        linkedinUrl: "https://www.linkedin.com/in/luiz-henrique-bartira/"
      },
      {
        firstName: "Hermes Rodrigues",
        lastName: "de Oliveira",
        role: "Tecnólogo em Logística / Operações",
        linkedinUrl: "https://www.linkedin.com/in/hermes-rodrigues-de-oliveira/"
      }
    ];

    for (const lead of leads) {
      const cleanName = lead.firstName.toLowerCase().split(" ")[0];
      const cleanSurname = lead.lastName.toLowerCase().split(" ")[0];
      const inferredEmail = `${cleanName}.${cleanSurname}@moveisbartira.com.br`;

      const nameStr = encodeURIComponent(`${lead.firstName} ${lead.lastName}`);
      const companyStr = encodeURIComponent("Indústria de Móveis Bartira Ltda");
      const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
      const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

      const newLeadPayload = {
        "Nombre": lead.firstName,
        "Apellido": lead.lastName,
        "Empresa": "Indústria de Móveis Bartira Ltda",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": lead.role,
        "LinkedIn": lead.linkedinUrl,
        "Origen": "Prospección Activa",
        "Notas": "",
        "Email": inferredEmail,
        "Telefono": companyPhone,
        "WhatsApp": companyWhatsApp,
        "Descripcion de la idea": `${lead.role} na Indústria de Móveis Bartira (Grupo Casas Bahia).`,
        "Facebook": facebookUrl,
        "Instagram": instagramUrl,
        "Status": 4017,          // Nuevo
        "Estado CRM": 4021,      // Prospecto
        "Canal Preferido": 4037,  // LinkedIn
        "Actividad en Redes": 4045// Inactivo
      };

      const result = await request('POST', '/api/database/rows/table/994/?user_field_names=true', newLeadPayload, token);
      console.log(`✅ Lead ${lead.firstName} ${lead.lastName} inyectado con éxito. ID Baserow: ${result.id}`);
    }

    console.log("🚀 Inyección de Móveis Bartira completada exitosamente.");
  } catch (err) {
    console.error("Error procesando leads Bartira:", err);
  }
}

run();

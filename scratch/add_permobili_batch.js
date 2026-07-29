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

    // 1. Search for Permobili in Table 991 (Empresas)
    let companyRes = await request('GET', '/api/database/rows/table/991/?user_field_names=true&search=Permobili', null, token);
    let companyId;
    let companyPhone = "+55 27 3373-7700";
    let companyWhatsApp = "https://wa.me/552733737700";

    if (companyRes.results && companyRes.results.length > 0) {
      companyId = companyRes.results[0].id;
      console.log(`Empresa Permóbili encontrada en ID: ${companyId}`);
      if (companyRes.results[0].Telefono) companyPhone = companyRes.results[0].Telefono;
      if (companyRes.results[0].WhatsApp) companyWhatsApp = companyRes.results[0].WhatsApp;
    } else {
      console.log("Creando empresa Permóbili Móveis en Tabla 991...");
      const newCompany = {
        "Nombre de la Empresa": "Permóbili Móveis",
        "Sitio Web": "https://www.permobili.com.br",
        "LinkedIn Corporativo": "https://www.linkedin.com/company/permobili-moveis/",
        "Pais": "Brasil",
        "Canal Preferido": 4029, // LinkedIn
        "Actividad en Redes": 4033, // Muy Activo
        "Notas del Target": "Fabricante de muebles RTA (dormitorios, salas) en Linhares, Espírito Santo."
      };
      const createdCompany = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany, token);
      companyId = createdCompany.id;
      console.log(`Empresa creada con ID: ${companyId}`);
    }

    const leads = [
      {
        firstName: "Lorena",
        lastName: "Lopes Dos Santos",
        role: "Auxiliar de Produção",
        linkedinUrl: "https://www.linkedin.com/in/lorena-lopes-dos-sanos-78b612333/"
      },
      {
        firstName: "Flaviana",
        lastName: "Batista Sena",
        role: "Assistente Administrativo",
        linkedinUrl: "https://www.linkedin.com/in/flaviana-batista-sena-139a7017a/"
      },
      {
        firstName: "Kelen",
        lastName: "Matias",
        role: "Técnico em Segurança do Trabalho",
        linkedinUrl: "https://www.linkedin.com/in/kelen-matias/"
      },
      {
        firstName: "Edilana",
        lastName: "Almeida Lima",
        role: "Analista de Logística e Transporte",
        linkedinUrl: "https://www.linkedin.com/in/edilana-almeida-lima-5ab5b6147/"
      },
      {
        firstName: "Edivan",
        lastName: "Inacio",
        role: "Operador de Maquinário",
        linkedinUrl: "https://www.linkedin.com/in/edivan-inacio-91938133b/"
      }
    ];

    for (const lead of leads) {
      const cleanName = lead.firstName.toLowerCase().split(" ")[0];
      const cleanSurname = lead.lastName.toLowerCase().split(" ")[0];
      const inferredEmail = `${cleanName}.${cleanSurname}@permobili.com.br`;

      const nameStr = encodeURIComponent(`${lead.firstName} ${lead.lastName}`);
      const companyStr = encodeURIComponent("Permóbili Móveis");
      const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
      const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

      const newLeadPayload = {
        "Nombre": lead.firstName,
        "Apellido": lead.lastName,
        "Empresa": "Permóbili Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": lead.role,
        "LinkedIn": lead.linkedinUrl,
        "Origen": "Prospección Activa",
        "Notas": "",
        "Email": inferredEmail,
        "Telefono": companyPhone,
        "WhatsApp": companyWhatsApp,
        "Descripcion de la idea": `${lead.role} na Permóbili Móveis.`,
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

    console.log("🚀 Inyección de Permóbili Móveis completada exitosamente.");
  } catch (err) {
    console.error("Error procesando leads Permóbili:", err);
  }
}

run();

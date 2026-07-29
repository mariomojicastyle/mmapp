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
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (postData) options.headers['Content-Length'] = Buffer.byteLength(postData);
    if (token) options.headers['Authorization'] = `JWT ${token}`;

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body ? JSON.parse(body) : {}));
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

    // 1. Search for Unicasa in Table 991 (Empresas)
    let companyRes = await request('GET', '/api/database/rows/table/991/?user_field_names=true&search=Unicasa', null, token);
    let companyId;
    let companyPhone = "+55 54 3455-1100";
    let companyWhatsApp = "https://wa.me/555434551100";

    if (companyRes.results && companyRes.results.length > 0) {
      companyId = companyRes.results[0].id;
      console.log(`Empresa Unicasa encontrada en ID: ${companyId}`);
      if (companyRes.results[0].Telefono) companyPhone = companyRes.results[0].Telefono;
      if (companyRes.results[0].WhatsApp) companyWhatsApp = companyRes.results[0].WhatsApp;
    } else {
      console.log("Creando empresa Unicasa Indústria de Móveis S.A. en Tabla 991...");
      const newCompany = {
        "Nombre de la Empresa": "Unicasa Indústria de Móveis S.A.",
        "Sitio Web": "https://www.unicasamoveis.com.br",
        "LinkedIn Corporativo": "https://www.linkedin.com/company/unicasamoveis/",
        "Pais": "Brasil",
        "Canal Preferido": 4029, // LinkedIn
        "Actividad en Redes": 4033, // Muy Activo
        "Notas del Target": "Fabricante cotizado en bolsa (UCAS3) marcas Dell Anno, Favorita, New, Casa Brasileira."
      };
      const createdCompany = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany, token);
      companyId = createdCompany.id;
      console.log(`Empresa creada con ID: ${companyId}`);
    }

    const leads = [
      {
        firstName: "Suzane",
        lastName: "Gonçalves",
        role: "Analista de Marketing / Mídias Sociais",
        linkedinUrl: "https://www.linkedin.com/in/suzane-gon%C3%A7alves-b492371a3/"
      },
      {
        firstName: "Marcos Paulo",
        lastName: "Pelegrini Baptista",
        role: "Especialista em Engenharia de Produto",
        linkedinUrl: "https://www.linkedin.com/in/marcos-paulo-pelegrini-baptista-16a070156/"
      },
      {
        firstName: "Paulo R.",
        lastName: "Bellenzier Jr.",
        role: "Gerente Comercial Mercado Latam, USA e Brasil",
        linkedinUrl: "https://www.linkedin.com/in/paulo-r-bellenzier-jr-52513a100/"
      },
      {
        firstName: "Rodrigo",
        lastName: "Arante",
        role: "Gerente Nacional Comercial Casa Brasileira",
        linkedinUrl: "https://www.linkedin.com/in/rodrigo-arante-06146b3b/"
      },
      {
        firstName: "Vanessa",
        lastName: "Tatim Pasini",
        role: "Assistente de Exportação",
        linkedinUrl: "https://www.linkedin.com/in/vanessa-tatim-pasini-58391b248/"
      }
    ];

    for (const lead of leads) {
      const cleanName = lead.firstName.toLowerCase().split(" ")[0];
      const cleanSurname = lead.lastName.toLowerCase().split(" ")[0];
      const inferredEmail = `${cleanName}.${cleanSurname}@unicasa.com.br`;

      const nameStr = encodeURIComponent(`${lead.firstName} ${lead.lastName}`);
      const companyStr = encodeURIComponent("Unicasa Indústria de Móveis S.A.");
      const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
      const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

      const newLeadPayload = {
        "Nombre": lead.firstName,
        "Apellido": lead.lastName,
        "Empresa": "Unicasa Indústria de Móveis S.A.",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": lead.role,
        "LinkedIn": lead.linkedinUrl,
        "Origen": "Prospección Activa",
        "Notas": "",
        "Email": inferredEmail,
        "Telefono": companyPhone,
        "WhatsApp": companyWhatsApp,
        "Descripcion de la idea": `${lead.role} na Unicasa Indústria de Móveis S.A.`,
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

    console.log("🚀 Inyección completada exitosamente.");
  } catch (err) {
    console.error("Error procesando leads:", err);
  }
}

run();

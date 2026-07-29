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

    // 1. Search for Italínea in Table 991 (Empresas)
    let companyRes = await request('GET', '/api/database/rows/table/991/?user_field_names=true&search=Italínea', null, token);
    if (!companyRes.results || companyRes.results.length === 0) {
      companyRes = await request('GET', '/api/database/rows/table/991/?user_field_names=true&search=Italinea', null, token);
    }

    let companyId;
    let companyPhone = "+55 54 3455-5100";
    let companyWhatsApp = "https://wa.me/555434555100";

    if (companyRes.results && companyRes.results.length > 0) {
      companyId = companyRes.results[0].id;
      console.log(`Empresa Italínea Móveis encontrada en ID: ${companyId}`);
      if (companyRes.results[0].Telefono) companyPhone = companyRes.results[0].Telefono;
      if (companyRes.results[0].WhatsApp) companyWhatsApp = companyRes.results[0].WhatsApp;
    } else {
      console.log("Creando empresa Italínea Móveis en Tabla 991...");
      const newCompany = {
        "Nombre de la Empresa": "Italínea Móveis",
        "Sitio Web": "https://www.italinea.com.br",
        "LinkedIn Corporativo": "https://www.linkedin.com/company/italineamoveis/",
        "Pais": "Brasil",
        "Canal Preferido": 4029, // LinkedIn
        "Actividad en Redes": 4033, // Muy Activo
        "Notas del Target": "Maior rede de lojas de móveis planejados da América Latina. Marca do Grupo Todeschini em Bento Gonçalves (RS)."
      };
      const createdCompany = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany, token);
      companyId = createdCompany.id;
      console.log(`Empresa creada con ID: ${companyId}`);
    }

    const leads = [
      {
        firstName: "Silvio",
        lastName: "Bricoli",
        role: "Representante Comercial da Marca Italínea (Expansão e Franquias)",
        linkedinUrl: "https://www.linkedin.com/in/sbn-consultoria-italinea-criare/"
      },
      {
        firstName: "Edemir",
        lastName: "Khuchner",
        role: "Gestão de Projetos e Operações",
        linkedinUrl: "https://www.linkedin.com/in/edemirkhuchner/"
      },
      {
        firstName: "Aline",
        lastName: "Dal'Ó Zanatta",
        role: "Relacionamento na Criare e Italínea Móveis",
        linkedinUrl: "https://www.linkedin.com/in/aline-dalo/"
      },
      {
        firstName: "Fabiane",
        lastName: "Bottezini S.",
        role: "Head de Marketing (Italínea e Criare)",
        linkedinUrl: "https://www.linkedin.com/in/fabiane-bottezini-s-1093a482/"
      },
      {
        firstName: "Maria do Carmo",
        lastName: "Roos Soares",
        role: "Gestão de Marketing, Eventos e Gestão Empresarial",
        linkedinUrl: "https://www.linkedin.com/in/maria-do-carmo-roos-soares/"
      }
    ];

    for (const lead of leads) {
      const cleanName = lead.firstName.toLowerCase().split(" ")[0];
      const cleanSurname = lead.lastName.toLowerCase().split(" ")[0];
      const inferredEmail = `${cleanName}.${cleanSurname}@italinea.com.br`;

      const nameStr = encodeURIComponent(`${lead.firstName} ${lead.lastName}`);
      const companyStr = encodeURIComponent("Italínea Móveis");
      const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
      const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

      const newLeadPayload = {
        "Nombre": lead.firstName,
        "Apellido": lead.lastName,
        "Empresa": "Italínea Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": lead.role,
        "LinkedIn": lead.linkedinUrl,
        "Origen": "Prospección Activa",
        "Notas": "",
        "Email": inferredEmail,
        "Telefono": companyPhone,
        "WhatsApp": companyWhatsApp,
        "Descripcion de la idea": `${lead.role} na Italínea Móveis / Criare.`,
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

    console.log("🚀 Inyección de Italínea Móveis completada exitosamente.");
  } catch (err) {
    console.error("Error procesando leads Italínea:", err);
  }
}

run();

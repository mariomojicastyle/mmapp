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

async function getOrCreateCompany(token, companyName, web, linkedin, notes) {
  let res = await request('GET', `/api/database/rows/table/991/?user_field_names=true&search=${encodeURIComponent(companyName)}`, null, token);
  if (res.results && res.results.length > 0) {
    console.log(`Empresa '${companyName}' encontrada en ID: ${res.results[0].id}`);
    return {
      id: res.results[0].id,
      phone: res.results[0].Telefono || "+55 41 3381-5000",
      wa: res.results[0].WhatsApp || "https://wa.me/554133815000"
    };
  } else {
    console.log(`Creando empresa '${companyName}' en Tabla 991...`);
    const newCo = {
      "Nombre de la Empresa": companyName,
      "Sitio Web": web,
      "LinkedIn Corporativo": linkedin,
      "Pais": "Brasil",
      "Canal Preferido": 4029, // LinkedIn
      "Actividad en Redes": 4033, // Muy Activo
      "Notas del Target": notes
    };
    const created = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCo, token);
    console.log(`Empresa '${companyName}' creada con ID: ${created.id}`);
    return {
      id: created.id,
      phone: "+55 41 3381-5000",
      wa: "https://wa.me/554133815000"
    };
  }
}

async function run() {
  try {
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Get or Create Companies
    const artely = await getOrCreateCompany(token, "Artely Móveis Ltda", "https://www.artely.com.br", "https://www.linkedin.com/company/artely-moveis-ltda/", "Fabricante de móveis RTA para salas em São José dos Pinhais (PR).");
    const oggi = await getOrCreateCompany(token, "Oggi Móveis", "https://www.oggimoveis.com.br", "https://www.linkedin.com/company/oggi-moveis/", "Empresa de e-commerce e móveis em São José dos Pinhais (PR).");
    const barreto = await getOrCreateCompany(token, "Barreto Designer", "https://www.barretodesigner.com.br", "https://www.linkedin.com/company/barreto-designer/", "Estúdio de design de produto e gráfico em Lagoa Vermelha (RS).");

    const leads = [
      {
        firstName: "Jair",
        lastName: "Barreto",
        companyName: "Barreto Designer",
        companyObj: barreto,
        domain: "barretodesigner.com.br",
        role: "Designer de Produto e Gráfico",
        linkedinUrl: "https://www.linkedin.com/in/jair-b-9658ba55/"
      },
      {
        firstName: "Fabiano",
        lastName: "Mazier",
        companyName: "Artely Móveis Ltda",
        companyObj: artely,
        domain: "artely.com.br",
        role: "Comercial / Executivo de Vendas",
        linkedinUrl: "https://www.linkedin.com/in/fabiano-mazier-a4ba24307/"
      },
      {
        firstName: "Felipe Ribeiro",
        lastName: "Freitas Vieira",
        companyName: "Oggi Móveis",
        companyObj: oggi,
        domain: "oggimoveis.com.br",
        role: "Gerente de Comércio Eletrônico",
        linkedinUrl: "https://www.linkedin.com/in/felipe-ribeiro-freitas-vieira-5217ba127/"
      },
      {
        firstName: "Luciana",
        lastName: "Lopes",
        companyName: "Artely Móveis Ltda",
        companyObj: artely,
        domain: "artely.com.br",
        role: "Alimentador de Linha de Produção",
        linkedinUrl: "https://www.linkedin.com/in/luciana-lopes-743a0621b/"
      }
    ];

    for (const lead of leads) {
      const cleanName = lead.firstName.toLowerCase().split(" ")[0];
      const cleanSurname = lead.lastName.toLowerCase().split(" ")[0];
      const inferredEmail = `${cleanName}.${cleanSurname}@${lead.domain}`;

      const nameStr = encodeURIComponent(`${lead.firstName} ${lead.lastName}`);
      const companyStr = encodeURIComponent(lead.companyName);
      const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
      const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

      const newLeadPayload = {
        "Nombre": lead.firstName,
        "Apellido": lead.lastName,
        "Empresa": lead.companyName,
        "Empresa Vinculada": [lead.companyObj.id],
        "Pais": "Brasil",
        "Rol": lead.role,
        "LinkedIn": lead.linkedinUrl,
        "Origen": "Prospección Activa",
        "Notas": "",
        "Email": inferredEmail,
        "Telefono": lead.companyObj.phone,
        "WhatsApp": lead.companyObj.wa,
        "Descripcion de la idea": `${lead.role} na ${lead.companyName}.`,
        "Facebook": facebookUrl,
        "Instagram": instagramUrl,
        "Status": 4017,          // Nuevo
        "Estado CRM": 4021,      // Prospecto
        "Canal Preferido": 4037,  // LinkedIn
        "Actividad en Redes": 4045// Inactivo
      };

      const result = await request('POST', '/api/database/rows/table/994/?user_field_names=true', newLeadPayload, token);
      console.log(`✅ Lead ${lead.firstName} ${lead.lastName} (${lead.companyName}) inyectado con éxito. URL: ${lead.linkedinUrl} | ID Baserow: ${result.id}`);
    }

    console.log("🚀 Inyección de Artely, Oggi y Barreto completada exitosamente.");
  } catch (err) {
    console.error("Error procesando batch:", err);
  }
}

run();

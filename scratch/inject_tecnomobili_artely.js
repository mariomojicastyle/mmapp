const https = require('https');
const { insertLead } = require('./insert_lead_factory.js');

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
    console.log("Autenticando...");
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Crear Empresa 1: Tecno Mobili
    console.log("Creando empresa 'Tecno Mobili'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Tecno Mobili",
      "Pais": "Brasil",
      "Estado Comercial": 3999 // Prospecto
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const tecnoId = companyRes1.id;
    console.log("Tecno Mobili creada con ID:", tecnoId);

    // Crear Empresa 2: Artely Móveis
    console.log("Creando empresa 'Artely Móveis'...");
    const newCompany2 = {
      "Nombre de la Empresa": "Artely Móveis",
      "Pais": "Brasil",
      "Estado Comercial": 3999 // Prospecto
    };
    const companyRes2 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany2, token);
    const artelyId = companyRes2.id;
    console.log("Artely Móveis creada con ID:", artelyId);

    const leads = [
      {
        firstName: "Rodrigo",
        lastName: "Borsato",
        role: "supervisor Comercial",
        linkedinUrl: "https://www.linkedin.com/in/rodrigo-borsato-828003a1/",
        companyName: "Tecno Mobili",
        companyId: tecnoId,
        companyDomain: "tecnomobili.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Matilde",
        lastName: "Conrado da Silva",
        role: "Designer gráfico",
        linkedinUrl: "https://www.linkedin.com/in/matilde-conrado-da-silva/",
        companyName: "Artely Móveis",
        companyId: artelyId,
        companyDomain: "artely.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Ana",
        lastName: "Guedes",
        role: "Gerente comercial",
        linkedinUrl: "https://www.linkedin.com/in/ana-guedes-a11792208/",
        companyName: "Artely Móveis",
        companyId: artelyId,
        companyDomain: "artely.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Patrick",
        lastName: "Antonowicz",
        role: "Assistente de exportação",
        linkedinUrl: "https://www.linkedin.com/in/patrick-antonowicz-953244284/",
        companyName: "Artely Móveis",
        companyId: artelyId,
        companyDomain: "artely.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      }
    ];

    for (const lead of leads) {
      console.log(`Inyectando lead ${lead.firstName} ${lead.lastName}...`);
      await insertLead(lead);
      // Wait slightly to avoid API rate limits
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log("¡Proceso completado!");
  } catch (e) {
    console.error("Error:", e);
  }
}

run();

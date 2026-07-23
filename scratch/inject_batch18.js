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

const multimoveisId = 60; // Existing company

async function run() {
  try {
    console.log("Autenticando...");
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Crear Empresa: Bertolini Móveis
    console.log("Creando empresa 'Bertolini Móveis'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Bertolini Móveis",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const bertoliniId = companyRes1.id;
    console.log("Bertolini Móveis creada con ID:", bertoliniId);

    const leads = [
      {
        firstName: "Renan",
        lastName: "Stroeher",
        role: "Supervisor Comercial de Marketplace",
        linkedinUrl: "https://www.linkedin.com/in/renan-stroeher-6a7a01182/",
        companyName: "Multimóveis Indústria de Móveis Ltda",
        companyId: multimoveisId,
        companyDomain: "multimoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Roberto Vigo",
        lastName: "Coser",
        role: "Analista de TI",
        linkedinUrl: "https://www.linkedin.com/in/roberto-vigo-coser/",
        companyName: "Multimóveis Indústria de Móveis Ltda",
        companyId: multimoveisId,
        companyDomain: "multimoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Marcelle",
        lastName: "Lorandi",
        role: "Assistente de marketing",
        linkedinUrl: "https://www.linkedin.com/in/marcelle-lorandi-346b24293/",
        companyName: "Multimóveis Indústria de Móveis Ltda",
        companyId: multimoveisId,
        companyDomain: "multimoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Monserrat",
        lastName: "González",
        role: "Analista Marketplace",
        linkedinUrl: "https://www.linkedin.com/in/monserrat-gonzález-aa96a4258/",
        companyName: "Bertolini Móveis",
        companyId: bertoliniId,
        companyDomain: "bertolini.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "México"
      },
      {
        firstName: "Renata",
        lastName: "Ractz",
        role: "Supervisora de Marketing",
        linkedinUrl: "https://www.linkedin.com/in/renataractz/",
        companyName: "Bertolini Móveis",
        companyId: bertoliniId,
        companyDomain: "bertolini.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      }
    ];

    for (const lead of leads) {
      console.log(`Inyectando lead ${lead.firstName} ${lead.lastName}...`);
      await insertLead(lead);
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log("¡Proceso completado!");
  } catch (e) {
    console.error("Error:", e);
  }
}

run();

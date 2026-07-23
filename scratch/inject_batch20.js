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

const araplacId = 52; // Existing company

async function run() {
  try {
    console.log("Autenticando...");
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Crear Empresa: Politorno Móveis
    console.log("Creando empresa 'Politorno Móveis'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Politorno Móveis",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const politornoId = companyRes1.id;
    console.log("Politorno Móveis creada con ID:", politornoId);

    const leads = [
      {
        firstName: "Marisa",
        lastName: "Duarte",
        role: "Gestor da Qualidade",
        linkedinUrl: "https://www.linkedin.com/in/marisa-duarte-205904126/",
        companyName: "Araplac Móveis",
        companyId: araplacId,
        companyDomain: "araplac.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Jucimar",
        lastName: "Reginatto",
        role: "Almoxarife",
        linkedinUrl: "https://www.linkedin.com/in/jucimar-reginatto-8420a049/",
        companyName: "Politorno Móveis",
        companyId: politornoId,
        companyDomain: "politorno.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Ricardo",
        lastName: "Zaffari",
        role: "Desenvolvimento de produtos",
        linkedinUrl: "https://www.linkedin.com/in/ricardo-zaffari-63a81661/",
        companyName: "Politorno Móveis",
        companyId: politornoId,
        companyDomain: "politorno.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "RH",
        lastName: "Politorno Móveis",
        role: "Recursos Humanos",
        linkedinUrl: "https://www.linkedin.com/in/rh-politorno-móveis-270918244/",
        companyName: "Politorno Móveis",
        companyId: politornoId,
        companyDomain: "politorno.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Fernando",
        lastName: "Assumpção",
        role: "Coordenador de Marketing",
        linkedinUrl: "https://www.linkedin.com/in/ferassump/",
        companyName: "Politorno Móveis",
        companyId: politornoId,
        companyDomain: "politorno.com.br",
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

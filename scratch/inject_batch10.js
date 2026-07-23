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

const madesaId = 53; // Existing company

async function run() {
  try {
    console.log("Autenticando...");
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Crear Empresa: Demóbile Indústria de Móveis
    console.log("Creando empresa 'Demóbile Indústria de Móveis'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Demóbile Indústria de Móveis",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const demobileId = companyRes1.id;
    console.log("Demóbile Indústria de Móveis creada con ID:", demobileId);

    const leads = [
      {
        firstName: "Douglas",
        lastName: "Guth",
        role: "Líder de equipes",
        linkedinUrl: "https://www.linkedin.com/in/douglas-guth/",
        companyName: "Madesa Móveis",
        companyId: madesaId,
        companyDomain: "madesa.com",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Michele",
        lastName: "Vogel",
        role: "Analista de Engenharia do Produto Senior",
        linkedinUrl: "https://www.linkedin.com/in/michele-vogel-481750305/",
        companyName: "Madesa Móveis",
        companyId: madesaId,
        companyDomain: "madesa.com",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Darlene Vanessa",
        lastName: "Lopes",
        role: "E-commerce Manager Marketplace",
        linkedinUrl: "https://www.linkedin.com/in/darlene-vanessa-lopes-551606199/",
        companyName: "Madesa Móveis",
        companyId: madesaId,
        companyDomain: "madesa.com",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Eduardo (EDUARDO STEFFEN)",
        lastName: "Steffen",
        role: "Supervisor de TI",
        linkedinUrl: "https://www.linkedin.com/in/eduardo-steffen/",
        companyName: "Madesa Móveis",
        companyId: madesaId,
        companyDomain: "madesa.com",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Fabiano José Raduan",
        lastName: "Vieira",
        role: "Gerente de Engenharia",
        linkedinUrl: "https://www.linkedin.com/in/fabiano-josé-raduan-vieira-83877a14b/",
        companyName: "Demóbile Indústria de Móveis",
        companyId: demobileId,
        companyDomain: "demobile.com.br",
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

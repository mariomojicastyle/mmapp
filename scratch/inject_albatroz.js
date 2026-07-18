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

    console.log("Creando empresa 'Móveis Albatroz'...");
    const newCompany = {
      "Nombre de la Empresa": "Móveis Albatroz",
      "Pais": "Brasil",
      "Estado Comercial": 3999 // Prospecto
    };
    const companyRes = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany, token);
    const companyId = companyRes.id;
    console.log("Empresa creada con ID:", companyId);

    const leads = [
      {
        firstName: "Eduardo",
        lastName: "Mileski",
        role: "Analista de marketing",
        linkedinUrl: "https://www.linkedin.com/in/eduardo-mileski-49690b1a2/",
        companyName: "Móveis Albatroz",
        companyId: companyId,
        companyDomain: "moveisalbatroz.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Rodrigo",
        lastName: "Apolonio",
        role: "Analista de engenharia",
        linkedinUrl: "https://www.linkedin.com/in/rodrigo-apolonio-45b1081b7/",
        companyName: "Móveis Albatroz",
        companyId: companyId,
        companyDomain: "moveisalbatroz.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Eduardo",
        lastName: "Marcilio",
        role: "Gerente Comercial",
        linkedinUrl: "https://www.linkedin.com/in/eduardo-marcilio-064420127/",
        companyName: "Móveis Albatroz",
        companyId: companyId,
        companyDomain: "moveisalbatroz.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      }
    ];

    for (const lead of leads) {
      console.log(`Inyectando lead ${lead.firstName} ${lead.lastName}...`);
      await insertLead(lead);
    }

    console.log("¡Proceso completado!");
  } catch (e) {
    console.error("Error:", e);
  }
}

run();

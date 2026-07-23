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

const andiraId = 59; // Existing company

async function run() {
  try {
    console.log("Autenticando...");
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Crear Empresa: Multimóveis
    console.log("Creando empresa 'Multimóveis Indústria de Móveis Ltda'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Multimóveis Indústria de Móveis Ltda",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const multimoveisId = companyRes1.id;
    console.log("Multimóveis creada con ID:", multimoveisId);

    const leads = [
      {
        firstName: "Nelson Henrique",
        lastName: "Farinha",
        role: "Gerente de Exportação",
        linkedinUrl: "https://www.linkedin.com/in/nelson-henrique-farinha-4383a8152/",
        companyName: "Santos Andirá Industria de Moveis Ltda",
        companyId: andiraId,
        companyDomain: "santosandira.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Leandra",
        lastName: "Piccin",
        role: "Export Manager",
        linkedinUrl: "https://www.linkedin.com/in/leandra-piccin-3aa28b24/",
        companyName: "Multimóveis Indústria de Móveis Ltda",
        companyId: multimoveisId,
        companyDomain: "multimoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Amanda",
        lastName: "Pizzatto",
        role: "Analista Júnior | Logística",
        linkedinUrl: "https://www.linkedin.com/in/amanda-pizzatto-927b85236/",
        companyName: "Multimóveis Indústria de Móveis Ltda",
        companyId: multimoveisId,
        companyDomain: "multimoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Débora",
        lastName: "Deon",
        role: "Analista de Exportação",
        linkedinUrl: "https://www.linkedin.com/in/débora-deon-78ab6b145/",
        companyName: "Multimóveis Indústria de Móveis Ltda",
        companyId: multimoveisId,
        companyDomain: "multimoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Jeniffer",
        lastName: "Santos",
        role: "Analista de atendimento",
        linkedinUrl: "https://www.linkedin.com/in/jeniffer-santos-6023a9247/",
        companyName: "Multimóveis Indústria de Móveis Ltda",
        companyId: multimoveisId,
        companyDomain: "multimoveis.com.br",
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

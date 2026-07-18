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

    console.log("Creando empresa 'BRV Móveis'...");
    const newCompany = {
      "Nombre de la Empresa": "BRV Móveis",
      "Pais": "Brasil",
      "Estado Comercial": 3999 // Prospecto
    };
    const companyRes = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany, token);
    const companyId = companyRes.id;
    console.log("Empresa creada con ID:", companyId);

    const leads = [
      {
        firstName: "Vinicius",
        lastName: "Benini",
        role: "Diretor Comercial",
        linkedinUrl: "https://www.linkedin.com/in/vinicius-benini-3b5063147/",
        companyName: "BRV Móveis",
        companyId: companyId,
        companyDomain: "brvmoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Carine",
        lastName: "Rossoni",
        role: "Supervisora de Vendas",
        linkedinUrl: "https://www.linkedin.com/in/carine-rossoni-6a0899203/",
        companyName: "BRV Móveis",
        companyId: companyId,
        companyDomain: "brvmoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Marciano",
        lastName: "Silva",
        role: "Gerente Industrial e Compras",
        linkedinUrl: "https://www.linkedin.com/in/marciano-silva-1637642ab/",
        companyName: "BRV Móveis",
        companyId: companyId,
        companyDomain: "brvmoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Dionísio",
        lastName: "De Bortoli",
        role: "Arquiteto e Design",
        linkedinUrl: "https://www.linkedin.com/in/dionisio-de-bortoli-932b0b75/",
        companyName: "BRV Móveis",
        companyId: companyId,
        companyDomain: "brvmoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Rodrigo",
        lastName: "Benini",
        role: "General Manager International",
        linkedinUrl: "https://www.linkedin.com/in/rodrigo-benini-100a18b2/",
        companyName: "BRV Móveis",
        companyId: companyId,
        companyDomain: "brvmoveis.com.br",
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

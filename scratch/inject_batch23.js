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

const lineaId = 64; // Existing company

async function run() {
  try {
    console.log("Autenticando...");
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Crear Empresa: Kit's Paraná
    console.log("Creando empresa 'Kit's Paraná'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Kit's Paraná",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const kitsId = companyRes1.id;
    console.log("Kit's Paraná creada con ID:", kitsId);

    const leads = [
      {
        firstName: "Tamires",
        lastName: "Santos",
        role: "Analista comercial Jr.",
        linkedinUrl: "https://www.linkedin.com/in/tamires-santos-87510a176/",
        companyName: "Linea Brasil",
        companyId: lineaId,
        companyDomain: "lineabrasil.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Felipe",
        lastName: "Ronca",
        role: "Assistente de marketing",
        linkedinUrl: "https://www.linkedin.com/in/feliperonca/",
        companyName: "Linea Brasil",
        companyId: lineaId,
        companyDomain: "lineabrasil.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Giovani",
        lastName: "Novaes",
        role: "Técnico em segurança",
        linkedinUrl: "https://www.linkedin.com/in/giovani-novaes-186b29180/",
        companyName: "Kit's Paraná",
        companyId: kitsId,
        companyDomain: "kitsparana.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Andre Luis",
        lastName: "de Melo Levinski",
        role: "Analista de comércio exterior",
        linkedinUrl: "https://www.linkedin.com/in/andre-levinski/",
        companyName: "Kit's Paraná",
        companyId: kitsId,
        companyDomain: "kitsparana.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Márcia",
        lastName: "Matias",
        role: "Gerente de RH",
        linkedinUrl: "https://www.linkedin.com/in/márcia-matias-4617b012a/",
        companyName: "Kit's Paraná",
        companyId: kitsId,
        companyDomain: "kitsparana.com.br",
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

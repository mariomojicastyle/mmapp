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

const hennId = 52; // Existing company

async function run() {
  try {
    console.log("Autenticando...");
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Crear Empresa: Madesa Móveis
    console.log("Creando empresa 'Madesa Móveis'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Madesa Móveis",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const madesaId = companyRes1.id;
    console.log("Madesa Móveis creada con ID:", madesaId);

    const leads = [
      {
        firstName: "Ingo",
        lastName: "Lorenzen",
        role: "Diretor Tributário",
        linkedinUrl: "https://www.linkedin.com/in/ingo-lorenzen-517913115/",
        companyName: "Móveis Henn",
        companyId: hennId,
        companyDomain: "henn.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Letícia",
        lastName: "Sandrin",
        role: "Consultor de Desenvolvimento Humano e Organizacional (DHO)",
        linkedinUrl: "https://www.linkedin.com/in/leticiasandrin-gestaodepessoas/",
        companyName: "Móveis Henn",
        companyId: hennId,
        companyDomain: "henn.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Daniela",
        lastName: "Ebert",
        role: "Assistente administrativo",
        linkedinUrl: "https://www.linkedin.com/in/daniela-ebert-a95644203/",
        companyName: "Móveis Henn",
        companyId: hennId,
        companyDomain: "henn.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Ernani André",
        lastName: "Zimmer",
        role: "Gerente de Novos Negócios e Exportação",
        linkedinUrl: "https://www.linkedin.com/in/ernani-andré-zimmer-040997115/",
        companyName: "Madesa Móveis",
        companyId: madesaId,
        companyDomain: "madesa.com",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Martina",
        lastName: "Schmidt Klein",
        role: "Analista de DHO Jr.",
        linkedinUrl: "https://www.linkedin.com/in/martina-schmidt-klein-b50a61293/",
        companyName: "Madesa Móveis",
        companyId: madesaId,
        companyDomain: "madesa.com",
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

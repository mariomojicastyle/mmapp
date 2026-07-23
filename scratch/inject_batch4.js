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

    // Crear Empresa: Móveis Imcal
    console.log("Creando empresa 'Móveis Imcal'...");
    const newCompany = {
      "Nombre de la Empresa": "Móveis Imcal",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany, token);
    const imcalId = companyRes.id;
    console.log("Móveis Imcal creada con ID:", imcalId);

    // Poliman ya existe con ID 45
    const polimanId = 45;

    const leads = [
      {
        firstName: "Glaifton",
        lastName: "Amorim",
        role: "Líder de equipe de produção",
        linkedinUrl: "https://www.linkedin.com/in/glaifton-amorim-778140239/",
        companyName: "Móveis Imcal",
        companyId: imcalId,
        companyDomain: "imcal.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Elcio",
        lastName: "Caneira",
        role: "Diretor Industrial",
        linkedinUrl: "https://www.linkedin.com/in/elcio-caneira-46236a48/",
        companyName: "Móveis Imcal",
        companyId: imcalId,
        companyDomain: "imcal.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Dino",
        lastName: "Aguiar",
        role: "Coordenador de vendas",
        linkedinUrl: "https://www.linkedin.com/in/dino-aguiar-5b6816385/",
        companyName: "Móveis Imcal",
        companyId: imcalId,
        companyDomain: "imcal.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Brenda",
        lastName: "Carvalho",
        role: "Analista de Departamento Pessoal",
        linkedinUrl: "https://www.linkedin.com/in/brenda-carvalho-1a82a822b/",
        companyName: "Móveis Imcal",
        companyId: imcalId,
        companyDomain: "imcal.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Giovani",
        lastName: "Capucho",
        role: "Gerente de vendas regional",
        linkedinUrl: "https://www.linkedin.com/in/giovani-capucho-082b99253/",
        companyName: "Poliman Móveis",
        companyId: polimanId,
        companyDomain: "poliman.com.br",
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

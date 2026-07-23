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

const movalId = 55; // Existing company

async function run() {
  try {
    console.log("Autenticando...");
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Crear Empresa: Grupo Lopas
    console.log("Creando empresa 'Grupo Lopas'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Grupo Lopas",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const lopasId = companyRes1.id;
    console.log("Grupo Lopas creada con ID:", lopasId);

    const leads = [
      {
        firstName: "Renan",
        lastName: "Souza",
        role: "Coordenador de Custos",
        linkedinUrl: "https://www.linkedin.com/in/renancjsouza/",
        companyName: "Moval",
        companyId: movalId,
        companyDomain: "moval.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Sabrina",
        lastName: "Leitão",
        role: "Diretora Comercial",
        linkedinUrl: "https://www.linkedin.com/in/sabrinaleitao/",
        companyName: "Grupo Lopas",
        companyId: lopasId,
        companyDomain: "grupolopas.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Renato",
        lastName: "Magaton",
        role: "Export & Import Supervisor",
        linkedinUrl: "https://www.linkedin.com/in/renatomagaton/",
        companyName: "Grupo Lopas",
        companyId: lopasId,
        companyDomain: "grupolopas.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Beatriz",
        lastName: "Crovato",
        role: "Designer | Especialista em Marketing Digital",
        linkedinUrl: "https://www.linkedin.com/in/beatriz-crovato-a8a313228/",
        companyName: "Grupo Lopas",
        companyId: lopasId,
        companyDomain: "grupolopas.com.br",
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

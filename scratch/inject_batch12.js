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

const demobileId = 54; // Existing company

async function run() {
  try {
    console.log("Autenticando...");
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Crear Empresa: Moval
    console.log("Creando empresa 'Moval'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Moval",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const movalId = companyRes1.id;
    console.log("Moval creada con ID:", movalId);

    const leads = [
      {
        firstName: "Neto",
        lastName: "Passos",
        role: "Gerente Regional de Vendas",
        linkedinUrl: "https://www.linkedin.com/in/neto-passos-4609389b/",
        companyName: "Demóbile Indústria de Móveis",
        companyId: demobileId,
        companyDomain: "demobile.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Tiago",
        lastName: "Moreira",
        role: "Supervisor de Produção",
        linkedinUrl: "https://www.linkedin.com/in/tiago-moreira-1a2546238/",
        companyName: "Demóbile Indústria de Móveis",
        companyId: demobileId,
        companyDomain: "demobile.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Vagner",
        lastName: "Leite",
        role: "Líder de produção",
        linkedinUrl: "https://www.linkedin.com/in/vagner-leite-0a65592b2/",
        companyName: "Demóbile Indústria de Móveis",
        companyId: demobileId,
        companyDomain: "demobile.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Ivan",
        lastName: "oliveira",
        role: "diretor comercial",
        linkedinUrl: "https://www.linkedin.com/in/ivan-oliveira-2b0a0a3b/",
        companyName: "Moval",
        companyId: movalId,
        companyDomain: "moval.com.br",
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

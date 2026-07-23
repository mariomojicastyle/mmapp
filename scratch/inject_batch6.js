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

    // Crear Empresa: Itatiaia
    console.log("Creando empresa 'Itatiaia'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Itatiaia",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const itatiaiaId = companyRes1.id;
    console.log("Itatiaia creada con ID:", itatiaiaId);

    // K1 ya existe con ID 50
    const k1Id = 50;

    const leads = [
      {
        firstName: "Julio",
        lastName: "santos",
        role: "Especialista em IA Aplicada & Automação",
        linkedinUrl: "https://www.linkedin.com/in/julio-santos-9178a1221/",
        companyName: "GRUPO K1 S.A.",
        companyId: k1Id,
        companyDomain: "grupok1.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Daniel",
        lastName: "Segalin",
        role: "Diretor Internacional",
        linkedinUrl: "https://www.linkedin.com/in/daniel-segalin-537a4124/",
        companyName: "GRUPO K1 S.A.",
        companyId: k1Id,
        companyDomain: "grupok1.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Carlos",
        lastName: "Sost",
        role: "CEO",
        linkedinUrl: "https://www.linkedin.com/in/carlos-sost-722730235/",
        companyName: "GRUPO K1 S.A.",
        companyId: k1Id,
        companyDomain: "grupok1.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Izabela",
        lastName: "Maderi",
        role: "Analista de RH",
        linkedinUrl: "https://www.linkedin.com/in/izabelamaderi/",
        companyName: "Itatiaia",
        companyId: itatiaiaId,
        companyDomain: "itatiaia.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Janety Christiny",
        lastName: "Moura",
        role: "Analista de Trade Marketing Júnior",
        linkedinUrl: "https://www.linkedin.com/in/janetychristinymoura/",
        companyName: "Itatiaia",
        companyId: itatiaiaId,
        companyDomain: "itatiaia.com.br",
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

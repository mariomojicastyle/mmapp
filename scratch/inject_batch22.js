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

    // Crear Empresa: Linea Brasil
    console.log("Creando empresa 'Linea Brasil'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Linea Brasil",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const lineaId = companyRes1.id;
    console.log("Linea Brasil creada con ID:", lineaId);

    const leads = [
      {
        firstName: "Jacqueline",
        lastName: "Portela",
        role: "Gerente de exportação",
        linkedinUrl: "https://www.linkedin.com/in/jacqueline-portela-732a54104/",
        companyName: "Linea Brasil",
        companyId: lineaId,
        companyDomain: "lineabrasil.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Diego",
        lastName: "Rocha",
        role: "Encarregado de produção",
        linkedinUrl: "https://www.linkedin.com/in/diego-rocha01/",
        companyName: "Linea Brasil",
        companyId: lineaId,
        companyDomain: "lineabrasil.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Vanderson S",
        lastName: "Moura",
        role: "Analista de processos jr",
        linkedinUrl: "https://www.linkedin.com/in/vanderson-s-moura-8a3196242/",
        companyName: "Linea Brasil",
        companyId: lineaId,
        companyDomain: "lineabrasil.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Gilmar",
        lastName: "Carducci",
        role: "Analista de Logística SR",
        linkedinUrl: "https://www.linkedin.com/in/gilmar-carducci-23426a145/",
        companyName: "Linea Brasil",
        companyId: lineaId,
        companyDomain: "lineabrasil.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Mariana Rebeca",
        lastName: "Braga",
        role: "Analista de Marketing Jr",
        linkedinUrl: "https://www.linkedin.com/in/mariana-rebeca-braga-0b8a9b13a/",
        companyName: "Linea Brasil",
        companyId: lineaId,
        companyDomain: "lineabrasil.com.br",
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

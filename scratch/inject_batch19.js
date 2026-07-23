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

const bertoliniId = 61; // Existing company

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
    const kitsParanaId = companyRes1.id;
    console.log("Kit's Paraná creada con ID:", kitsParanaId);

    const leads = [
      {
        firstName: "Aline Maria",
        lastName: "Nunes",
        role: "Assistente de marketing",
        linkedinUrl: "https://www.linkedin.com/in/aline-maria-nunes-a76594305/",
        companyName: "Bertolini Móveis",
        companyId: bertoliniId,
        companyDomain: "bertolini.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Rodrigo",
        lastName: "Chavez Valdez",
        role: "GERENTE DE VENTAS",
        linkedinUrl: "https://www.linkedin.com/in/rodrigo-chavez-valdez-b5a136118/",
        companyName: "Bertolini Móveis",
        companyId: bertoliniId,
        companyDomain: "bertolini.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "México"
      },
      {
        firstName: "Leodemar",
        lastName: "Tfardoski",
        role: "Vendedor",
        linkedinUrl: "https://www.linkedin.com/in/leodemar-tfardoski/",
        companyName: "Bertolini Móveis",
        companyId: bertoliniId,
        companyDomain: "bertolini.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Suelen Tonin",
        lastName: "Thums",
        role: "Analista de Marketplace",
        linkedinUrl: "https://www.linkedin.com/in/suelen-tonin-thums-62a037255/",
        companyName: "Bertolini Móveis",
        companyId: bertoliniId,
        companyDomain: "bertolini.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Wagner",
        lastName: "Amancio Pereira",
        role: "Representante comercial de vendas",
        linkedinUrl: "https://www.linkedin.com/in/wagner-amancio-pereira-9524b4205/",
        companyName: "Kit's Paraná",
        companyId: kitsParanaId,
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

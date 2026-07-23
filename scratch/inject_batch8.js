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

    // Crear Empresa: Móveis Henn
    console.log("Creando empresa 'Móveis Henn'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Móveis Henn",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const hennId = companyRes1.id;
    console.log("Móveis Henn creada con ID:", hennId);

    const leads = [
      {
        firstName: "Douglas",
        lastName: "Bernardi",
        role: "Coordenador Técnico E-commerce",
        linkedinUrl: "https://www.linkedin.com/in/douglas-bernardi-73011783/",
        companyName: "Móveis Henn",
        companyId: hennId,
        companyDomain: "henn.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Mayara",
        lastName: "Cristofoli",
        role: "Gerente de Recursos Humanos",
        linkedinUrl: "https://www.linkedin.com/in/mayara-cristofoli-91a706bb/",
        companyName: "Móveis Henn",
        companyId: hennId,
        companyDomain: "henn.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "William",
        lastName: "Rower",
        role: "Comprador",
        linkedinUrl: "https://www.linkedin.com/in/william-rower-a80b67140/",
        companyName: "Móveis Henn",
        companyId: hennId,
        companyDomain: "henn.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Jonas",
        lastName: "Borck",
        role: "Analista de Engenharia de Produtos",
        linkedinUrl: "https://www.linkedin.com/in/jonas-borck-753619113/",
        companyName: "Móveis Henn",
        companyId: hennId,
        companyDomain: "henn.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Fernanda",
        lastName: "Sehn",
        role: "Psicóloga Clínica",
        linkedinUrl: "https://www.linkedin.com/in/fernanda-sehn-02a619b9/",
        companyName: "Móveis Henn",
        companyId: hennId,
        companyDomain: "henn.com.br",
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

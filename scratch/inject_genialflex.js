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

    console.log("Creando empresa 'Genialflex'...");
    const newCompany = {
      "Nombre de la Empresa": "Genialflex",
      "Pais": "Brasil",
      "Estado Comercial": 3999 // Prospecto
    };
    const companyRes = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany, token);
    const companyId = companyRes.id;
    console.log("Empresa creada con ID:", companyId);

    console.log("Inyectando lead Renato O. Santana Sb...");
    const lead = {
      firstName: "Renato",
      lastName: "Santana", // Simplified name for email generation
      role: "Gerente de exportação",
      linkedinUrl: "https://www.linkedin.com/in/renato-o-santana-sb-a109b022/",
      companyName: "Genialflex",
      companyId: companyId,
      companyDomain: "genialflex.com.br",
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    };

    await insertLead(lead);

    console.log("¡Proceso completado!");
  } catch (e) {
    console.error("Error:", e);
  }
}

run();

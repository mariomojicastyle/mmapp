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

const lopasId = 56; // Existing company

async function run() {
  try {
    console.log("Autenticando...");
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Crear Empresa: Caemmun Movelaria
    console.log("Creando empresa 'Caemmun Movelaria'...");
    const newCompany1 = {
      "Nombre de la Empresa": "Caemmun Movelaria",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes1 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany1, token);
    const caemmunId = companyRes1.id;
    console.log("Caemmun Movelaria creada con ID:", caemmunId);

    // Crear Empresa: Tuboarte Indústria e Comércio Ltda
    console.log("Creando empresa 'Tuboarte Indústria e Comércio Ltda'...");
    const newCompany2 = {
      "Nombre de la Empresa": "Tuboarte Indústria e Comércio Ltda",
      "Pais": "Brasil",
      "Estado Comercial": 3999
    };
    const companyRes2 = await request('POST', '/api/database/rows/table/991/?user_field_names=true', newCompany2, token);
    const tuboarteId = companyRes2.id;
    console.log("Tuboarte Indústria e Comércio Ltda creada con ID:", tuboarteId);

    const leads = [
      {
        firstName: "Caio",
        lastName: "Vidal",
        role: "Coordenador de E-commerce",
        linkedinUrl: "https://www.linkedin.com/in/caio-vidal-073a69238/",
        companyName: "Grupo Lopas",
        companyId: lopasId,
        companyDomain: "grupolopas.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Josemberg Meneses",
        lastName: "Machado",
        role: "Apontador de Produção (PCP)",
        linkedinUrl: "https://www.linkedin.com/in/josembergmenesesmachado/",
        companyName: "Grupo Lopas",
        companyId: lopasId,
        companyDomain: "grupolopas.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Débora",
        lastName: "Otoni",
        role: "Analista de exportação",
        linkedinUrl: "https://www.linkedin.com/in/débora-otoni-0833a4285/",
        companyName: "Caemmun Movelaria",
        companyId: caemmunId,
        companyDomain: "caemmun.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Gustavo",
        lastName: "Cavalcante",
        role: "Desenvolvimento de produtos",
        linkedinUrl: "https://www.linkedin.com/in/gustavo-cavalcante-b58a20297/",
        companyName: "Caemmun Movelaria",
        companyId: caemmunId,
        companyDomain: "caemmun.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Ailton",
        lastName: "Ribeiro",
        role: "Gerente industrial",
        linkedinUrl: "https://www.linkedin.com/in/ailton-ribeiro-583297248/",
        companyName: "Tuboarte Indústria e Comércio Ltda",
        companyId: tuboarteId,
        companyDomain: "tuboarte.com.br",
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

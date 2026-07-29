const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: baserowUrl,
      port: 443,
      path: encodeURI(path),
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
      res.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          console.error("Error parsing response body:", body);
          resolve({});
        }
      });
    });
    req.on('error', e => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    const companyId = 69; // Italínea Móveis
    const companyPhone = "+55 54 3455-5100";
    const companyWhatsApp = "https://wa.me/555434555100";

    const lead = {
      firstName: "Aline",
      lastName: "Dal'Ó Zanatta",
      role: "Relacionamento na Criare e Italínea Móveis",
      linkedinUrl: "https://www.linkedin.com/in/aline-dalo/"
    };

    const cleanName = "aline";
    const cleanSurname = "dalo";
    const inferredEmail = "aline.dalo@italinea.com.br";

    const nameStr = encodeURIComponent("Aline Dal'Ó Zanatta");
    const companyStr = encodeURIComponent("Italínea Móveis");
    const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
    const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

    const newLeadPayload = {
      "Nombre": lead.firstName,
      "Apellido": lead.lastName,
      "Empresa": "Italínea Móveis",
      "Empresa Vinculada": [companyId],
      "Pais": "Brasil",
      "Rol": lead.role,
      "LinkedIn": lead.linkedinUrl,
      "Origen": "Prospección Activa",
      "Notas": "",
      "Email": inferredEmail,
      "Telefono": companyPhone,
      "WhatsApp": companyWhatsApp,
      "Descripcion de la idea": `${lead.role} na Italínea Móveis / Criare.`,
      "Facebook": facebookUrl,
      "Instagram": instagramUrl,
      "Status": 4017,          // Nuevo
      "Estado CRM": 4021,      // Prospecto
      "Canal Preferido": 4037,  // LinkedIn
      "Actividad en Redes": 4045// Inactivo
    };

    const result = await request('POST', '/api/database/rows/table/994/?user_field_names=true', newLeadPayload, token);
    console.log(`✅ Lead ${lead.firstName} ${lead.lastName} verificado/inyectado con ID Baserow: ${result.id}`);

  } catch (err) {
    console.error("Error arreglando Aline:", err);
  }
}

run();

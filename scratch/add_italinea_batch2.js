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

    const leads = [
      {
        firstName: "Rogério Rigol",
        lastName: "da Silva",
        role: "Gerente Nacional de Vendas",
        linkedinUrl: "https://www.linkedin.com/in/rog%C3%A9rio-rigol-da-silva-7024a573/"
      },
      {
        firstName: "Milene",
        lastName: "Benelli",
        role: "Comercial / Atendimento",
        linkedinUrl: "https://www.linkedin.com/in/milene-benelli-b22b95356/"
      },
      {
        firstName: "Quin",
        lastName: "Nunes",
        role: "Diretor (Italínea Imperial / ex Criare)",
        linkedinUrl: "https://www.linkedin.com/in/quin-nunes-14010a118/"
      },
      {
        firstName: "Natan",
        lastName: "Pellizzer",
        role: "Supervisor de Vendas (Sistemas e TI / +15 anos Todeschini)",
        linkedinUrl: "https://www.linkedin.com/in/natan-pellizzer-21111b141/"
      },
      {
        firstName: "Vítor",
        lastName: "Marsango",
        role: "Analista de P&D (Promob, SketchUp, Arquitetura)",
        linkedinUrl: "https://www.linkedin.com/in/vitormarsango/"
      }
    ];

    for (const lead of leads) {
      const cleanName = lead.firstName.toLowerCase().split(" ")[0];
      const cleanSurname = lead.lastName.toLowerCase().split(" ")[0];
      const inferredEmail = `${cleanName}.${cleanSurname}@italinea.com.br`;

      const nameStr = encodeURIComponent(`${lead.firstName} ${lead.lastName}`);
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
        "Descripcion de la idea": `${lead.role} na Italínea Móveis / Grupo Todeschini.`,
        "Facebook": facebookUrl,
        "Instagram": instagramUrl,
        "Status": 4017,          // Nuevo
        "Estado CRM": 4021,      // Prospecto
        "Canal Preferido": 4037,  // LinkedIn
        "Actividad en Redes": 4045// Inactivo
      };

      const result = await request('POST', '/api/database/rows/table/994/?user_field_names=true', newLeadPayload, token);
      console.log(`✅ Lead ${lead.firstName} ${lead.lastName} inyectado con éxito. ID Baserow: ${result.id}`);
    }

    console.log("🚀 Inyección Batch 2 de Italínea completada exitosamente.");
  } catch (err) {
    console.error("Error procesando leads Batch 2 Italínea:", err);
  }
}

run();

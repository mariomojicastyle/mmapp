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
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    const companyId = 48; // Unicasa Indústria de Móveis S.A.
    const companyPhone = "+55 54 3455-1100";
    const companyWhatsApp = "https://wa.me/555434551100";

    const leads = [
      {
        firstName: "Ivan",
        lastName: "Zardo",
        role: "Analista de P&D de Produto (Design de Produto)",
        linkedinUrl: "https://www.linkedin.com/in/ivanzardo/"
      },
      {
        firstName: "Rodrigo",
        lastName: "Silva",
        role: "Gerente de Marketing",
        linkedinUrl: "https://www.linkedin.com/in/rodrigosilvabg/"
      },
      {
        firstName: "Junior",
        lastName: "Paniz",
        role: "Gerente de Expansão Nacional e América do Norte",
        linkedinUrl: "https://www.linkedin.com/in/junior-paniz/"
      },
      {
        firstName: "Natália",
        lastName: "Friedrich",
        role: "Especialista em Exportação e Comércio Internacional",
        linkedinUrl: "https://www.linkedin.com/in/nat%C3%A1lia-friedrich-879262104/"
      },
      {
        firstName: "Lucas",
        lastName: "Schenatto",
        role: "Especialista em Dados & Operações",
        linkedinUrl: "https://www.linkedin.com/in/lucas-schenatto-190161221/"
      }
    ];

    for (const lead of leads) {
      const cleanName = lead.firstName.toLowerCase().split(" ")[0];
      const cleanSurname = lead.lastName.toLowerCase().split(" ")[0];
      const inferredEmail = `${cleanName}.${cleanSurname}@unicasa.com.br`;

      const nameStr = encodeURIComponent(`${lead.firstName} ${lead.lastName}`);
      const companyStr = encodeURIComponent("Unicasa Indústria de Móveis S.A.");
      const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
      const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

      const newLeadPayload = {
        "Nombre": lead.firstName,
        "Apellido": lead.lastName,
        "Empresa": "Unicasa Indústria de Móveis S.A.",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": lead.role,
        "LinkedIn": lead.linkedinUrl,
        "Origen": "Prospección Activa",
        "Notas": "",
        "Email": inferredEmail,
        "Telefono": companyPhone,
        "WhatsApp": companyWhatsApp,
        "Descripcion de la idea": `${lead.role} na Unicasa Indústria de Móveis S.A.`,
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

    console.log("🚀 Inyección Batch 2 de Unicasa completada exitosamente.");
  } catch (err) {
    console.error("Error procesando leads batch 2:", err);
  }
}

run();

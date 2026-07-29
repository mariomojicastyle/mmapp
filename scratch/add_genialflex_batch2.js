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

    const companyId = 68; // GenialFlex Móveis
    const companyPhone = "+55 54 3454-7000";
    const companyWhatsApp = "https://wa.me/555434547000";

    const leads = [
      {
        firstName: "Sully",
        lastName: "Knóbb",
        role: "Analista Financeiro",
        linkedinUrl: "https://www.linkedin.com/in/sully-kn%C3%B3bb-a1a291172/"
      },
      {
        firstName: "Rodrigo",
        lastName: "da Silva Rodrigues",
        role: "Gestão Executiva Industrial e Operações (Lean Manufacturing)",
        linkedinUrl: "https://www.linkedin.com/in/rodrigosilvarodrigues/"
      },
      {
        firstName: "William",
        lastName: "H. M.",
        role: "Coordenador de Marketplace / E-Commerce",
        linkedinUrl: "https://www.linkedin.com/in/william-h-m-931665b0/"
      },
      {
        firstName: "Jordana",
        lastName: "Alves Giusti",
        role: "Gerente Financeiro",
        linkedinUrl: "https://www.linkedin.com/in/jordana-alves-giusti-3891b51b3/"
      },
      {
        firstName: "Maikon",
        lastName: "Scritori",
        role: "Gerente de Suprimentos (Compras)",
        linkedinUrl: "https://www.linkedin.com/in/maikon-scritori-2145671b3/"
      }
    ];

    for (const lead of leads) {
      const cleanName = lead.firstName.toLowerCase().split(" ")[0];
      const cleanSurname = lead.lastName.toLowerCase().split(" ")[0];
      const inferredEmail = `${cleanName}.${cleanSurname}@genialflex.com.br`;

      const nameStr = encodeURIComponent(`${lead.firstName} ${lead.lastName}`);
      const companyStr = encodeURIComponent("GenialFlex Móveis");
      const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
      const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

      const newLeadPayload = {
        "Nombre": lead.firstName,
        "Apellido": lead.lastName,
        "Empresa": "GenialFlex Móveis",
        "Empresa Vinculada": [companyId],
        "Pais": "Brasil",
        "Rol": lead.role,
        "LinkedIn": lead.linkedinUrl,
        "Origen": "Prospección Activa",
        "Notas": "",
        "Email": inferredEmail,
        "Telefono": companyPhone,
        "WhatsApp": companyWhatsApp,
        "Descripcion de la idea": `${lead.role} na GenialFlex Móveis.`,
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

    console.log("🚀 Inyección Batch 2 de GenialFlex completada exitosamente.");
  } catch (err) {
    console.error("Error procesando leads Batch 2 GenialFlex:", err);
  }
}

run();

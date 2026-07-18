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

/**
 * Inserta un lead aplicando el protocolo de enriquecimiento de "Cero Celdas Vacías".
 * Deduce email, crea URLs sociales, y asocia estado.
 */
async function insertLead(leadInput) {
  try {
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    // Deducciones lógicas
    // 1. Email inferido
    let inferredEmail = "";
    if (leadInput.companyDomain) {
      const cleanName = leadInput.firstName.toLowerCase().split(" ")[0];
      const cleanSurname = leadInput.lastName.toLowerCase().split(" ")[0];
      inferredEmail = `${cleanName}.${cleanSurname}@${leadInput.companyDomain}`;
    }

    // 2. URLs de Redes deduplicadas
    const nameStr = encodeURIComponent(`${leadInput.firstName} ${leadInput.lastName}`);
    const companyStr = encodeURIComponent(leadInput.companyName);
    
    const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
    const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

    const newLead = {
      "Nombre": leadInput.firstName,
      "Apellido": leadInput.lastName,
      "Empresa": leadInput.companyName,
      "Empresa Vinculada": [leadInput.companyId],
      "Pais": leadInput.country || "Brasil",
      "Rol": leadInput.role,
      "LinkedIn": leadInput.linkedinUrl,
      "Origen": "Prospección Activa",
      
      // Enriquecimiento Obligatorio
      "Notas": "", // Siempre vacío al crear un nuevo lead
      "Email": inferredEmail,
      "Telefono": leadInput.companyPhone,
      "WhatsApp": leadInput.companyWhatsApp || "",
      "Descripcion de la idea": `${leadInput.role} de ${leadInput.companyName}.`,
      "Facebook": facebookUrl,
      "Instagram": instagramUrl,
      
      // Estados por Defecto
      "Status": 4017,         // Nuevo
      "Estado CRM": 4021,     // Prospecto
      "Canal Preferido": 4037, // LinkedIn
      "Actividad en Redes": 4045 // Inactivo
    };

    console.log("Inyectando Lead con protocolo estricto:", JSON.stringify(newLead, null, 2));
    
    const response = await request('POST', '/api/database/rows/table/994/?user_field_names=true', newLead, token);
    console.log(`Lead insertado con éxito. ID: ${response.id}`);
  } catch (err) {
    console.error("Error al insertar lead:", err);
  }
}

// Ejemplo de Uso Local (si se llama directamente)
if (require.main === module) {
  console.log("Este script está pensado para ser llamado como módulo o editado temporalmente con los datos del lead.");
  /* 
  insertLead({
    firstName: "Nombre",
    lastName: "Apellido",
    companyName: "Empresa Móveis",
    companyId: 99,
    companyDomain: "empresa.ind.br",
    companyPhone: "+55 00 0000-0000",
    companyWhatsApp: "https://wa.me/55000000000",
    country: "Brasil",
    role: "Director",
    linkedinUrl: "https://linkedin.com/in/..."
  });
  */
}

module.exports = { insertLead };

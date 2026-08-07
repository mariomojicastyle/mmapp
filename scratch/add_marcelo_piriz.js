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
      headers: { 'Content-Type': 'application/json' }
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

async function main() {
  try {
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    const newLead = {
      "Nombre": "Marcelo",
      "Apellido": "Piriz",
      "Empresa": "Politorno Móveis",
      "Empresa Vinculada": [29],
      "Pais": "Brasil",
      "Rol": "Projetista / Designer",
      "LinkedIn": "https://www.linkedin.com/in/marcelo-piriz-bento",
      "Origen": "Prospección Activa",
      
      // Notas y Enriquecimiento Obligatorio
      "Notas": "Contacto suministrado por Atilio (referido por Sr. Pedro de AKEO).",
      "Email": "marcelo.piriz@politorno.com.br",
      "Telefono": "+55 54 2105-0000",
      "WhatsApp": "https://wa.me/555421050000",
      "Descripcion de la idea": "Projetista / Designer en Politorno Móveis. Contacto clave para el Asistente 3D de montagem (Mesa Tijuca). Referido por el Sr. Pedro de AKEO a través de Atilio.",
      "Facebook": "https://www.facebook.com/search/people/?q=Marcelo%20Piriz%20Politorno",
      "Instagram": "https://www.google.com/search?q=site%3Ainstagram.com%20%22Marcelo%20Piriz%22%20%22Politorno%22",
      
      // Estados por Defecto
      "Status": 4017,         // Nuevo
      "Estado CRM": 4021,     // Prospecto
      "Canal Preferido": 4037, // LinkedIn
      "Actividad en Redes": 4045 // Inactivo
    };

    console.log("Inyectando Lead en Baserow (Tabla 994 - Contactos):", JSON.stringify(newLead, null, 2));
    const response = await request('POST', '/api/database/rows/table/994/?user_field_names=true', newLead, token);
    console.log("✅ Lead insertado con éxito en Baserow CRM! ID:", response.id);
  } catch (err) {
    console.error("❌ Error al insertar lead:", err);
  }
}

main();

const https = require('https');
const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

const empresasTableId = 991;
const leadsTableId = 994;

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

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody ? JSON.parse(responseBody) : {});
        } else {
          reject(new Error(`HTTP ${res.statusCode} en ${path}: ${responseBody}`));
        }
      });
    });
    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const auth = await request('POST', '/api/user/token-auth/', { username, password });
    const token = auth.token;

    const companyName = "RTA Design S.A.S.";
    const country = "Colombia";

    // 2. Buscar si la empresa existe en la Tabla 991 (Empresas)
    console.log(`2. Buscando empresa "${companyName}"...`);
    const coRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    
    let companyId = null;
    const cleanInputCompanyName = companyName.toLowerCase().trim();
    
    for (const row of coRes.results) {
      const existingName = row['Nombre de la Empresa'] || "";
      if (existingName.toLowerCase().trim().includes("rta design") || cleanInputCompanyName.includes(existingName.toLowerCase().trim())) {
        companyId = row.id;
        console.log(`   Empresa encontrada en el CRM. ID: ${companyId} - Nombre: "${existingName}"`);
        break;
      }
    }

    if (!companyId) {
      console.log(`   La empresa "${companyName}" no existe. Creando ficha...`);
      const newCompanyData = {
        "Nombre de la Empresa": companyName,
        "Sitio Web": "https://www.rtadesign.com.co",
        "LinkedIn Corporativo": "https://www.linkedin.com/company/rta-design-s-a-s-/",
        "Facebook": "",
        "Instagram": "",
        "WhatsApp": "",
        "Canal Preferido": 4029, // LinkedIn
        "Actividad en Redes": 4035, // Inactivo por defecto
        "Pais": country,
        "Nicho / Segmento": null,
        "Dolor Principal": null,
        "Estado Comercial": null,
        "Notas del Target": "Creado automáticamente mediante add_rta_design_leads.js"
      };

      const createdCompany = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, newCompanyData, token);
      companyId = createdCompany.id;
      console.log(`   Empresa creada con éxito. ID: ${companyId}`);
    }

    // 3. Preparar los leads
    const leadsToRegister = [
      {
        firstName: "Paola Andrea",
        lastName: "Reyes E.",
        role: "Directora de personal y Compensación",
        linkedinUrl: "https://www.linkedin.com/in/paola-reyes1223/"
      },
      {
        firstName: "John Alexander",
        lastName: "Betancourth Valencia",
        role: "Director de producción",
        linkedinUrl: "https://www.linkedin.com/in/john-alexander-betancourth-valencia-76020410a/"
      },
      {
        firstName: "Juan Carlos",
        lastName: "Pérez Londoño",
        role: "Gerente Administrativo y Financiero",
        linkedinUrl: "https://www.linkedin.com/in/juan-carlos-perez-londo%C3%B1o-a7981394/"
      }
    ];

    console.log('3. Inyectando leads en la Tabla 994...');
    for (const lead of leadsToRegister) {
      // Verificar si el lead ya existe en la Tabla 994 por LinkedIn o Nombre
      console.log(`   Verificando si "${lead.firstName} ${lead.lastName}" ya existe...`);
      const searchRes = await request('GET', `/api/database/rows/table/${leadsTableId}/?user_field_names=true&search=${encodeURIComponent(lead.lastName)}`, null, token);
      
      let existingLead = null;
      if (searchRes.results) {
        for (const existing of searchRes.results) {
          const sameLinkedIn = lead.linkedinUrl && existing.LinkedIn && existing.LinkedIn.toLowerCase().trim() === lead.linkedinUrl.toLowerCase().trim();
          const sameName = existing.Nombre && existing.Apellido && 
                           existing.Nombre.toLowerCase().trim() === lead.firstName.toLowerCase().trim() && 
                           existing.Apellido.toLowerCase().trim() === lead.lastName.toLowerCase().trim();
          if (sameLinkedIn || sameName) {
            existingLead = existing;
            break;
          }
        }
      }

      if (existingLead) {
        console.log(`   ⚠️ El lead ya existe en Baserow (ID: ${existingLead.id}). Omitiendo inyección.`);
        continue;
      }

      // Generar enlaces sociales de búsqueda
      const nameStr = encodeURIComponent(`${lead.firstName} ${lead.lastName}`);
      const companyStr = encodeURIComponent(companyName);
      const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
      const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

      const newLead = {
        "Nombre": lead.firstName,
        "Apellido": lead.lastName,
        "Empresa": companyName,
        "Empresa Vinculada": [companyId],
        "Pais": country,
        "Rol": lead.role,
        "LinkedIn": lead.linkedinUrl,
        "Origen": "Prospección Activa",
        "Email": "",
        "Telefono": "",
        "WhatsApp": "",
        "Notas": "",
        "Descripcion de la idea": `${lead.role} de ${companyName}.`,
        "Facebook": facebookUrl,
        "Instagram": instagramUrl,
        
        // Estados por Defecto
        "Status": 4017,         // Nuevo
        "Estado CRM": 4021,     // Prospecto
        "Canal Preferido": 4037, // LinkedIn
        "Actividad en Redes": 4045 // Inactivo
      };

      const createdLead = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, newLead, token);
      console.log(`   🎉 Lead registrado: [ID ${createdLead.id}] ${lead.firstName} ${lead.lastName} - ${lead.role}`);
    }

    console.log('\n========================================');
    console.log('🚀 Proceso de inyección finalizado con éxito!');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  }
}

run();

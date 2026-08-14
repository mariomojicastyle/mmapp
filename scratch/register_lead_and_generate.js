const https = require('https');
const fs = require('fs');
const path = require('path');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

const empresasTableId = 991;
const leadsTableId = 994;

function request(method, urlPath, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: baserowUrl,
      port: 443,
      path: urlPath,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      options.headers['Authorization'] = `JWT ${token}`;
    }

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody ? JSON.parse(responseBody) : {});
        } else {
          reject(new Error(`Request ${method} ${urlPath} failed with status ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  try {
    const inputPath = path.join(__dirname, 'lead_input.json');
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: No se encontró el archivo de entrada ${inputPath}`);
      console.log('Por favor crea un archivo json en scratch/lead_input.json con la siguiente estructura:');
      console.log(JSON.stringify({
        firstName: "Jair",
        lastName: "Boscardin",
        companyName: "Ditália Móveis",
        companyWebsite: "https://www.ditalia.com.br", // Opcional
        companyDomain: "ditalia.com.br",             // Opcional
        companyPhone: "+55 54 3455-6000",             // Opcional
        companyWhatsApp: "https://wa.me/555434556000", // Opcional
        country: "Brasil",
        role: "Engenheiro de Processos",
        linkedinUrl: "https://www.linkedin.com/in/jair-b-9658ba55/"
      }, null, 2));
      process.exit(1);
    }

    const leadInput = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    console.log('Iniciando registro de lead para:', leadInput.firstName, leadInput.lastName);

    // 1. Autenticar
    console.log('Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;

    // 2. Buscar si la empresa existe en la Tabla 991 (Empresas)
    console.log(`Buscando la empresa "${leadInput.companyName}" en el CRM...`);
    const companiesResponse = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    
    let matchedCompany = null;
    const cleanInputCompanyName = leadInput.companyName.toLowerCase().trim();
    
    for (const row of companiesResponse.results) {
      const companyName = row['Nombre de la Empresa'] || "";
      if (companyName.toLowerCase().trim().includes(cleanInputCompanyName) || cleanInputCompanyName.includes(companyName.toLowerCase().trim())) {
        matchedCompany = row;
        break;
      }
    }

    let companyId;
    if (matchedCompany) {
      companyId = matchedCompany.id;
      console.log(`Empresa encontrada en el CRM. ID: ${companyId} - Nombre: "${matchedCompany['Nombre de la Empresa']}"`);
    } else {
      console.log(`La empresa "${leadInput.companyName}" no existe en la Base 991. Creando ficha de empresa...`);
      const newCompanyData = {
        "Nombre de la Empresa": leadInput.companyName,
        "Sitio Web": leadInput.companyWebsite || "",
        "LinkedIn Corporativo": "", // Vacío por defecto para que el usuario o el pipeline lo verifique
        "Facebook": "",
        "Instagram": "",
        "WhatsApp": leadInput.companyWhatsApp || "",
        "Canal Preferido": 4029, // LinkedIn
        "Actividad en Redes": 4035, // Inactivo por defecto
        "Pais": leadInput.country || "Brasil",
        "Nicho / Segmento": null,
        "Dolor Principal": null,
        "Estado Comercial": 3999, // Prospecto
        "Notas del Target": "Creado automáticamente mediante lead_input.json"
      };

      const createdCompany = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, newCompanyData, token);
      companyId = createdCompany.id;
      console.log(`Empresa creada con éxito en la Tabla 991. ID: ${companyId}`);
    }

    // 2.5. Verificar si el lead ya existe en la Tabla 994
    console.log(`Verificando si el lead "${leadInput.firstName} ${leadInput.lastName}" ya existe en el CRM...`);
    const leadsSearchResponse = await request('GET', `/api/database/rows/table/${leadsTableId}/?user_field_names=true&search=${encodeURIComponent(leadInput.lastName)}`, null, token);
    
    let existingLead = null;
    for (const lead of leadsSearchResponse.results) {
      const sameLinkedIn = leadInput.linkedinUrl && lead.LinkedIn && lead.LinkedIn.toLowerCase().trim() === leadInput.linkedinUrl.toLowerCase().trim();
      const sameName = lead.Nombre && lead.Apellido && 
                       lead.Nombre.toLowerCase().trim() === leadInput.firstName.toLowerCase().trim() && 
                       lead.Apellido.toLowerCase().trim() === leadInput.lastName.toLowerCase().trim();
                       
      if (sameLinkedIn || sameName) {
        existingLead = lead;
        break;
      }
    }

    if (existingLead) {
      console.log(`\n========================================`);
      console.log(`⚠️ ATENCIÓN: El lead ya existe en Baserow!`);
      console.log(`ID del Lead Existente: ${existingLead.id}`);
      console.log(`Nombre: ${existingLead.Nombre} ${existingLead.Apellido}`);
      console.log(`Empresa: ${existingLead.Empresa}`);
      console.log(`Rol: ${existingLead.Rol}`);
      console.log(`Status: ${existingLead.Status?.value || existingLead.Status}`);
      console.log(`Estado CRM: ${existingLead['Estado CRM']?.value || existingLead['Estado CRM']}`);
      console.log(`LinkedIn: ${existingLead.LinkedIn}`);
      console.log(`========================================\n`);
      return;
    }

    // 3. Registrar el Lead en la Tabla 994 (Leads) aplicando el protocolo
    console.log('Aplicando protocolo de completado real (sin inferencias)...');
    
    // No inferir correo ni teléfono; se registran únicamente si se proveen
    const email = leadInput.email || "";
    const phone = leadInput.phone || "";
    const whatsApp = leadInput.whatsApp || "";

    // Generar enlaces sociales parametrizados
    const nameStr = encodeURIComponent(`${leadInput.firstName} ${leadInput.lastName}`);
    const companyStr = encodeURIComponent(leadInput.companyName);
    
    const facebookUrl = `https://www.facebook.com/search/people/?q=${nameStr}%20${companyStr}`;
    const instagramUrl = `https://www.google.com/search?q=site%3Ainstagram.com%20%22${nameStr}%22%20%22${companyStr}%22`;

    const newLead = {
      "Nombre": leadInput.firstName,
      "Apellido": leadInput.lastName,
      "Empresa": leadInput.companyName,
      "Empresa Vinculada": [companyId],
      "Pais": leadInput.country || "Brasil",
      "Rol": leadInput.role,
      "LinkedIn": leadInput.linkedinUrl,
      "Origen": "Prospección Activa",
      
      // Enriquecimiento Obligatorio
      "Notas": "", 
      "Email": email,
      "Telefono": phone,
      "WhatsApp": whatsApp,
      "Descripcion de la idea": `${leadInput.role} de ${leadInput.companyName}.`,
      "Facebook": facebookUrl,
      "Instagram": instagramUrl,
      
      // Estados por Defecto
      "Status": 4017,         // Nuevo
      "Estado CRM": 4021,     // Prospecto
      "Canal Preferido": 4037, // LinkedIn
      "Actividad en Redes": 4045 // Inactivo
    };

    console.log("Datos estructurados para inyectar:", JSON.stringify(newLead, null, 2));
    
    const response = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, newLead, token);
    console.log(`\n========================================`);
    console.log(`🎉 Lead registrado con éxito en Baserow!`);
    console.log(`ID del Lead: ${response.id}`);
    console.log(`ID de la Empresa Vinculada: ${companyId}`);
    console.log(`Email Registrado: ${email || "(Vacío - no provisto)"}`);
    console.log(`========================================\n`);

  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
  }
}

run();

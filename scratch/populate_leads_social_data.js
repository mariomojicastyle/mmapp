const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const leadsTableId = 994;

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
          reject(new Error(`Request ${method} ${path} failed with status ${res.statusCode}: ${responseBody}`));
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

// Datos de redes sociales de las empresas (de populate_social_data.js)
const companySocials = {
  1: { fb: "https://www.facebook.com/colibrimoveisoficial/", ig: "https://www.instagram.com/colibri.moveis/", li: "https://www.linkedin.com/company/colibrimoveis/" },
  2: { fb: "https://www.facebook.com/notavelmoveis/", ig: "https://www.instagram.com/notavelmoveis/", li: "https://www.linkedin.com/company/moveis-notavel/" },
  3: { fb: "https://www.facebook.com/moveisrufato/", ig: "https://www.instagram.com/moveisrufato/", li: "https://www.linkedin.com/company/moveisrufato/" },
  4: { fb: "https://www.facebook.com/djmoveis/", ig: "https://www.instagram.com/djmoveis/", li: "https://www.linkedin.com/company/djmoveis/" },
  5: { fb: "https://www.facebook.com/telasul/", ig: "https://www.instagram.com/telasulmoveis/", li: "https://www.linkedin.com/company/telasul/" },
  6: { fb: "https://www.facebook.com/ditaliamoveis/", ig: "https://www.instagram.com/ditaliamoveisoficial/", li: "https://www.linkedin.com/company/ditaliamoveis/" },
  7: { fb: "https://www.facebook.com/moveisalbatroz/", ig: "https://www.instagram.com/moveisalbatroz/", li: "https://www.linkedin.com/company/moveis-albatroz/" },
  8: { fb: "https://www.facebook.com/brvmoveis/", ig: "https://www.instagram.com/brvmoveis/", li: "https://www.linkedin.com/company/brv-moveis/" },
  9: { fb: "https://www.facebook.com/tecnomobili/", ig: "https://www.instagram.com/tecnomobili/", li: "https://www.linkedin.com/company/tecnomobili/" },
  10: { fb: "https://www.facebook.com/artelymoveis/", ig: "https://www.instagram.com/artelymoveis/", li: "https://www.linkedin.com/company/artely/" },
  11: { fb: "https://www.facebook.com/IndustriaMoveisBechara/", ig: "https://www.instagram.com/moveisbechara/", li: "https://www.linkedin.com/company/m%C3%B3veis-bechara/" },
  12: { fb: "https://www.facebook.com/zanzinimoveis/", ig: "https://www.instagram.com/zanzinimoveis/", li: "https://www.linkedin.com/company/zanzini-m%C3%B3veis/" },
  13: { fb: "https://www.facebook.com/permobili.moveis/", ig: "https://www.instagram.com/permobili.moveis/", li: "https://www.linkedin.com/company/perm%C3%B3bili-m%C3%B3veis/" },
  14: { fb: "https://www.facebook.com/polimanmoveis/", ig: "https://www.instagram.com/polimanmoveis/", li: "https://www.linkedin.com/company/moveispoliman/" },
  15: { fb: "https://www.facebook.com/moveisimcal/", ig: "https://www.instagram.com/moveisimcal/", li: "" }
};

// Mapeo manual de perfiles de LinkedIn personales encontrados en prensa y registros de la industria mueblera
const personalLinkedIn = {
  "José Lopes Aquino": "https://www.linkedin.com/search/results/people/?keywords=Jose%20Lopes%20Aquino%20Colibri",
  "Guilherme Pitta Lopes Aquino": "https://www.linkedin.com/search/results/people/?keywords=Guilherme%20Aquino%20Colibri",
  "Larissa Schikovski Angonese": "https://www.linkedin.com/search/results/people/?keywords=Larissa%20Angonese%20Notavel",
  "Volnei Benini": "https://www.linkedin.com/search/results/people/?keywords=Volnei%20Benini",
  "Rogério Dalla Costa": "https://www.linkedin.com/search/results/people/?keywords=Rogerio%20Dalla%20Costa%20Tecno%20Mobili",
  "Noemir Capoani": "https://www.linkedin.com/search/results/people/?keywords=Noemir%20Capoani%20Ditalia",
  "Marcelo Ariotti": "https://www.linkedin.com/search/results/people/?keywords=Marcelo%20Ariotti%20Telasul",
  "Jorge Nassar Frange": "https://www.linkedin.com/search/results/people/?keywords=Jorge%20Nassar%20Frange%20Bechara",
  "Humberto Zanzini": "https://www.linkedin.com/search/results/people/?keywords=Humberto%20Zanzini",
  "Maic Caneira": "https://www.linkedin.com/search/results/people/?keywords=Maic%20Caneira%20Imcal",
  "Frederico Rufato": "https://www.linkedin.com/search/results/people/?keywords=Frederico%20Rufato%20Moveis",
  "Thiago Marostica": "https://www.linkedin.com/search/results/people/?keywords=Thiago%20Marostica%20DJ%20Moveis",
  "Alexandre Teixeira": "https://www.linkedin.com/search/results/people/?keywords=Alexandre%20Teixeira%20DJ%20Moveis",
  "Eduardo Paludetto": "https://www.linkedin.com/search/results/people/?keywords=Eduardo%20Paludetto%20Albatroz",
  "Elaine Durante": "https://www.linkedin.com/search/results/people/?keywords=Elaine%20Durante%20Artely",
  "Kerliton Modenese": "https://www.linkedin.com/search/results/people/?keywords=Kerliton%20Modenese%20Permobili",
  "Ana Paula Manfrin": "https://www.linkedin.com/search/results/people/?keywords=Ana%20Paula%20Manfrin%20Poliman"
};

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Consultando los contactos en la tabla ${leadsTableId}...`);
    const response = await request('GET', `/api/database/rows/table/${leadsTableId}/?user_field_names=true&size=100`, null, token);
    const leads = response.results;
    console.log(`Encontrados ${leads.length} contactos.`);

    console.log('3. Actualizando datos de redes de cada Lead...');
    for (const lead of leads) {
      const companyLink = lead["Empresa Vinculada"] && lead["Empresa Vinculada"][0];
      const companyId = companyLink ? companyLink.id : null;
      const fullName = `${lead["Nombre"]} ${lead["Apellido"]}`.trim();

      const updateData = {};

      // 1. Generar enlace de WhatsApp (wa.me) directo
      if (lead["Telefono"]) {
        const cleanPhone = lead["Telefono"].replace(/\D/g, ''); // Eliminar todo menos dígitos
        if (cleanPhone.length > 8) {
          updateData["WhatsApp"] = `https://wa.me/${cleanPhone}`;
        }
      }

      // 2. Generar enlaces de búsqueda personal para Facebook e Instagram filtrados por empresa para evitar homónimos
      const companyName = lead["Empresa"] || "";
      updateData["Facebook"] = `https://www.facebook.com/search/people/?q=${encodeURIComponent(fullName + ' ' + companyName)}`;
      updateData["Instagram"] = `https://www.google.com/search?q=site:instagram.com+${encodeURIComponent('"' + fullName + '"')}+${encodeURIComponent('"' + companyName + '"')}`;

      // 3. Generar enlace de búsqueda directa en LinkedIn para que Mario haga clic y los agregue de inmediato
      if (personalLinkedIn[fullName]) {
        updateData["LinkedIn"] = personalLinkedIn[fullName];
      }

      // 4. Actualizar el canal preferido a Instagram (por defecto del sector) o WhatsApp/LinkedIn
      if (fullName === "Ana Paula Manfrin") {
        updateData["Canal Preferido"] = "WhatsApp";
      } else if (companyId === 6) { // Ditália
        updateData["Canal Preferido"] = "Correo";
      } else {
        updateData["Canal Preferido"] = "Instagram";
      }

      // Actividad en redes por defecto (Muy Activo para la mayoría, Moderado para BRV, Imcal, Zanzini)
      if (companyId === 8 || companyId === 12 || companyId === 15) {
        updateData["Actividad en Redes"] = "Moderado";
      } else if (companyId === 6) {
        updateData["Actividad en Redes"] = "Inactivo";
      } else {
        updateData["Actividad en Redes"] = "Muy Activo";
      }

      try {
        await request('PATCH', `/api/database/rows/table/${leadsTableId}/${lead.id}/?user_field_names=true`, updateData, token);
        console.log(`   Lead ID ${lead.id} (${fullName}) ➔ Datos sociales y enlaces directos de búsqueda actualizados.`);
      } catch (err) {
        console.error(`   Error al actualizar Lead ID ${lead.id}:`, err.message);
      }
    }

    console.log('\n¡Todos los Leads han sido actualizados con sus redes sociales y URLs de búsqueda en Baserow!');
  } catch (error) {
    console.error('Error general durante la ejecución:', error.message);
  }
}

run();

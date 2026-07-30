const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const empresasTableId = 991;

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

// List of Tier 4 companies from ranking_empresas_rta_brasil.md
const tier4Companies = [
  { nombre: 'Móveis Bosi', polo: 'Bento Gonçalves, RS', desc: 'Baños y muebles auxiliares RTA.' },
  { nombre: 'Kromus', polo: 'Bento Gonçalves, RS', desc: 'Estructuras tubulares RTA.' },
  { nombre: 'Carraro', polo: 'Bento Gonçalves, RS', desc: 'Histórica fábrica de muebles de tubo y madera RTA.' },
  { nombre: 'Móveis Katzer', polo: 'São Bento do Sul, SC', desc: 'Especialistas en exportación RTA.' },
  { nombre: 'Artefama', polo: 'São Bento do Sul, SC', desc: 'Muebles de madera maciza para ensamblar.' },
  { nombre: 'Móveis 3 Irmãos', polo: 'São Bento do Sul, SC', desc: 'Muebles para exportación masiva.' },
  { nombre: 'Móveis Belo', polo: 'Garibaldi, RS', desc: 'Cocinas modulares en MDP RTA.' },
  { nombre: 'Webmóveis', polo: 'Bento Gonçalves, RS', desc: 'Muebles auxiliares e-commerce RTA.' },
  { nombre: 'Evidência Móveis', polo: 'Bento Gonçalves, RS', desc: 'Camas modulares y muebles auxiliares.' },
  { nombre: 'Clicklar', polo: 'Bento Gonçalves, RS', desc: 'Zapateras y estanterías RTA.' },
  { nombre: 'Pozza', polo: 'Bento Gonçalves, RS', desc: 'Sillas y mesas de acero para ensamblar.' },
  { nombre: 'Quater', polo: 'Bento Gonçalves, RS', desc: 'Dormitorios infantiles RTA de gama alta.' },
  { nombre: 'Somopar', polo: 'Arapongas, PR', desc: 'Dormitorios y estanterías RTA.' },
  { nombre: 'Móveis Canção', polo: 'Maringá, PR', desc: 'Dormitorios y cocinas modulares RTA.' },
  { nombre: 'Delmarco Móveis', polo: 'Caxias do Sul, RS', desc: 'Dormitorios modulares RTA.' },
  { nombre: 'Temis', polo: 'Bento Gonçalves, RS', desc: 'Organizadores y racks RTA.' },
  { nombre: 'Brilhante Móveis', polo: 'Flores da Cunha, RS', desc: 'Roperos de MDF RTA.' },
  { nombre: 'Dallagnol', polo: 'Bento Gonçalves, RS', desc: 'Mesas y sillas para ensamblar.' },
  { nombre: 'K1 Upholstery', polo: 'Tupandi, RS', desc: 'Sillones en caja (Ready-to-Assemble).' },
  { nombre: 'Viero Móveis', polo: 'Concórdia, SC', desc: 'Comedores modulares de MDP RTA.' },
  { nombre: 'Móveis Província', polo: 'Guaranésia, MG', desc: 'Salas y paneles de diseño RTA.' },
  { nombre: 'Metaltru', polo: 'São Paulo, SP', desc: 'Organizadores modulares de alambre y plástico.' },
  { nombre: 'Falkk', polo: 'Bento Gonçalves, RS', desc: 'Muebles auxiliares de diseño contemporáneo RTA.' },
  { nombre: 'Móveis Estrela', polo: 'Arapongas, PR', desc: 'Camas temáticas e infantiles RTA.' },
  { nombre: 'Gazin Móveis', polo: 'Douradina, PR', desc: 'Dormitorios y muebles en caja RTA.' },
  { nombre: 'Pradel', polo: 'Arapongas, PR', desc: 'Dormitorios de diseño 100% MDF RTA.' },
  { nombre: 'Casil', polo: 'Arapongas, PR', desc: 'Zapateras y estanterías económicas RTA.' },
  { nombre: 'Batrol Móveis', polo: 'Arapongas, PR', desc: 'Cocinas y dormitorios modulares RTA.' },
  { nombre: 'Imop', polo: 'Arapongas, PR', desc: 'Dormitorios y cómodas RTA.' },
  { nombre: 'Mirage', polo: 'Arapongas, PR', desc: 'Muebles económicos de MDP RTA.' },
  { nombre: 'Nicioli', polo: 'Arapongas, PR', desc: 'Cocinas compactas y kits de microondas RTA.' },
  { nombre: 'Siena Móveis', polo: 'Arapongas, PR', desc: 'Paneles de TV para e-commerce RTA.' },
  { nombre: 'Vellut', polo: 'Arapongas, PR', desc: 'Sofás modulares en caja RTA.' },
  { nombre: 'Jambalaia', polo: 'Arapongas, PR', desc: 'Dormitorios auxiliares RTA.' },
  { nombre: 'Móveis Canaã', polo: 'Arapongas, PR', desc: 'Dormitorios de bebé RTA.' },
  { nombre: 'D’Móveis', polo: 'Arapongas, PR', desc: 'Centros de entretenimiento RTA.' },
  { nombre: 'Poquema', polo: 'Arapongas, PR', desc: 'Cocinas ultra-económicas RTA.' },
  { nombre: 'J Carvalho', polo: 'Maringá, PR', desc: 'Auxiliares de oficina RTA.' },
  { nombre: 'Gelius Móveis', polo: 'Mirassol, SP', desc: 'Dormitorios e infantiles RTA.' },
  { nombre: 'Móveis Primavera', polo: 'Arapongas, PR', desc: 'Roperos de MDP RTA.' },
  { nombre: 'Indekes', polo: 'Capitão Leônidas Marques, PR', desc: 'Cocinas moduladas de MDP RTA.' },
  { nombre: 'Madetec', polo: 'Arapongas, PR', desc: 'Racks y paneles de alta gama UV RTA.' },
  { nombre: 'Móveis Sul', polo: 'Bento Gonçalves, RS', desc: 'Modulares de oficina RTA.' },
  { nombre: 'Sollum', polo: 'Arapongas, PR', desc: 'Zapateras e infantiles RTA.' },
  { nombre: 'Briz Móveis', polo: 'Tupandi, RS', desc: 'Línea económica del Grupo K1 RTA.' },
  { nombre: 'Karina Móveis', polo: 'Arapongas, PR', desc: 'Roperos e infantiles RTA.' }
];

async function run() {
  try {
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    
    // Fetch all existing rows in table 991
    const empresasRes = await request('GET', `/api/database/rows/table/${empresasTableId}/?user_field_names=true&size=200`, null, token);
    const existingRows = empresasRes.results;

    console.log(`Checking ${tier4Companies.length} Tier 4 companies against existing ${existingRows.length} rows...`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const comp of tier4Companies) {
      const compClean = comp.nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = existingRows.find(r => {
        const nameClean = (r['Nombre de la Empresa'] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return nameClean.includes(compClean) || compClean.includes(nameClean);
      });

      if (found) {
        console.log(`ℹ️ Company "${comp.nombre}" already exists in table 991 (ID: ${found.id}, Current Tier: ${typeof found.Tier === 'object' && found.Tier ? found.Tier.value : found.Tier}). Skipping creation.`);
        skippedCount++;
      } else {
        const slug = comp.nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
        const webUrl = `https://www.${slug}.com.br`;
        const linkedinUrl = `https://www.linkedin.com/company/${slug}/`;

        const created = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, {
          'Nombre de la Empresa': comp.nombre,
          'Sitio Web': webUrl,
          'LinkedIn Corporativo': linkedinUrl,
          'Pais': 'Brasil',
          'Nicho / Segmento': 'Mobiliario RTA',
          'Canal Preferido': 4029, // LinkedIn
          'Actividad en Redes': 4034, // Moderado
          'Estado Comercial': 'Prospecto',
          'Tier': 'Tier 4',
          'Notas': `${comp.desc} Polo: ${comp.polo}`
        }, token);
        console.log(`✅ Created Tier 4 Company: ${comp.nombre} (ID: ${created.id})`);
        createdCount++;
      }
    }

    console.log(`🎉 Tier 4 Processing Complete! Created: ${createdCount}, Already Existed: ${skippedCount}. Total in table 991: ${existingRows.length + createdCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();

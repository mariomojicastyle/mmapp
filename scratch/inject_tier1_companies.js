const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const empresasTableId = 991; // ID correcto de la tabla de empresas en el CRM B2B

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

// Mapeos de IDs de opciones para la tabla 991:
// Nicho / Segmento (campo ID 9495): Mobiliario RTA (3990), Oficina (3991), Cocinas (3992), Tapizados (3993), Otro (3994)
// Dolor Principal (campo ID 9496): Devoluciones de herrajes (3995), R&D lento (3996), Falta de WebAR (3997), Ninguno (3998)
// Estado Comercial (campo ID 9497): Prospecto (3999), Contactado (4000), Demo Agendada (4001), Negociación (4002)
// Canal Preferido (campo ID 9549): LinkedIn (4029), Instagram (4030), Facebook (4031), Sitio Web / Formulario (4032), WhatsApp (4036)
// Actividad en Redes (campo ID 9550): Muy Activo (4033), Moderado (4034), Inactivo (4035)

const tier1Companies = [
  {
    "Nombre de la Empresa": "Móveis Bartira",
    "Sitio Web": "https://www.moveisbartira.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/moveis-bartira/",
    "Facebook": "https://www.facebook.com/moveisbartira/",
    "Instagram": "https://www.instagram.com/moveisbartira/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3996, // R&D lento
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4029, // LinkedIn
    "Actividad en Redes": 4033, // Muy Activo
    "Notas del Target": "Fabricante Tier 1 de S. Caetano do Sul (SP). Exclusivo de Casas Bahia (Grupo Via). Mayor fábrica de LatAm por volumen. Faturamento Est. R$ 1.2B - 1.5B, ~2000 empleados."
  },
  {
    "Nombre de la Empresa": "Kappesberg (Grupo K1)",
    "Sitio Web": "https://www.kappesberg.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/grupok1/",
    "Facebook": "https://www.facebook.com/KappesbergOficial/",
    "Instagram": "https://www.instagram.com/kappesberg_oficial/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3997, // Falta de WebAR
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4033, // Muy Activo
    "Notas del Target": "Fabricante Tier 1 de Tupandi (RS). Grupo K1. RTA modular multiambiente, cocinas y salas. Exportador gigante. Faturamento Est. R$ 800M - 1.0B, ~1600 empleados."
  },
  {
    "Nombre de la Empresa": "Cozinhas Itatiaia",
    "Sitio Web": "https://www.cozinhasitatiaia.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/cozinhas-itatiaia/",
    "Facebook": "https://www.facebook.com/cozinhasitatiaia/",
    "Instagram": "https://www.instagram.com/cozinhasitatiaia/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3992, // Cocinas
    "Dolor Principal": 3995, // Devoluciones de herrajes
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4033, // Muy Activo
    "Notas del Target": "Fabricante Tier 1 de Ubá (MG). Líder absoluto en cocinas modulares de acero y madera RTA. Faturamento Est. R$ 700M - 900M, ~1300 empleados."
  },
  {
    "Nombre de la Empresa": "Henn Móveis",
    "Sitio Web": "https://www.henn.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/hennmoveis/",
    "Facebook": "https://www.facebook.com/MoveisHenn/",
    "Instagram": "https://www.instagram.com/moveishenn/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3997, // Falta de WebAR
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4029, // LinkedIn
    "Actividad en Redes": 4033, // Muy Activo
    "Notas del Target": "Fabricante Tier 1 de Mondaí (SC). Muebles modulados de diseño accesible, dormitorios y salas. Faturamento Est. R$ 500M - 600M, ~1100 empleados."
  },
  {
    "Nombre de la Empresa": "Madesa",
    "Sitio Web": "https://www.madesa.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/madesa-moveis/",
    "Facebook": "https://www.facebook.com/madesamoveis/",
    "Instagram": "https://www.instagram.com/madesamoveis/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3998, // Ninguno
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4029, // LinkedIn
    "Actividad en Redes": 4033, // Muy Activo
    "Notas del Target": "Fabricante Tier 1 de Bom Princípio (RS). Líder en e-commerce y D2C de cocinas RTA y home office. Faturamento Est. R$ 450M - 550M, ~1000 empleados."
  },
  {
    "Nombre de la Empresa": "Demóbile",
    "Sitio Web": "https://www.demobile.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/demobile/",
    "Facebook": "https://www.facebook.com/demobilemoveis/",
    "Instagram": "https://www.instagram.com/demobilemoveis/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3995, // Devoluciones de herrajes
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4034, // Moderado
    "Notas del Target": "Fabricante Tier 1 de Arapongas (PR). Dormitorios, closets y cómodas RTA a gran escala. Faturamento Est. R$ 400M - 480M, ~900 empleados."
  },
  {
    "Nombre de la Empresa": "Moval",
    "Sitio Web": "https://www.moval.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/moval/",
    "Facebook": "https://www.facebook.com/movalmoveis/",
    "Instagram": "https://www.instagram.com/movalmoveis/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3996, // R&D lento
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4034, // Moderado
    "Notas del Target": "Fabricante Tier 1 de Arapongas (PR). Uno de los mayores productores de roperos RTA del país. Faturamento Est. R$ 380M - 450M, ~880 empleados."
  },
  {
    "Nombre de la Empresa": "Móveis Lopas",
    "Sitio Web": "https://www.moveislopas.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/moveislopas/",
    "Facebook": "https://www.facebook.com/moveislopas/",
    "Instagram": "https://www.instagram.com/moveislopas/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3997, // Falta de WebAR
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4029, // LinkedIn
    "Actividad en Redes": 4034, // Moderado
    "Notas del Target": "Fabricante Tier 1 de Ubá (MG). Dormitorios y salas RTA de gama media-alta. Faturamento Est. R$ 350M - 420M, ~800 empleados."
  },
  {
    "Nombre de la Empresa": "Caemmun (Grupo Munhoz Caetano)",
    "Sitio Web": "https://www.caemmun.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/caemmun/",
    "Facebook": "https://www.facebook.com/CaemmunMoveis/",
    "Instagram": "https://www.instagram.com/caemmunmoveis/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3997, // Falta de WebAR
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4034, // Moderado
    "Notas del Target": "Fabricante Tier 1 de Arapongas (PR). RTA para salas (paneles, racks) y cocinas (Líder Design). Faturamento Est. R$ 300M - 380M, ~780 empleados."
  },
  {
    "Nombre de la Empresa": "Santos Andirá",
    "Sitio Web": "https://www.santosandira.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/santos-andira/",
    "Facebook": "https://www.facebook.com/santosandiraoficial/",
    "Instagram": "https://www.instagram.com/santosandiraoficial/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3995, // Devoluciones de herrajes
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4029, // LinkedIn
    "Actividad en Redes": 4034, // Moderado
    "Notas del Target": "Fabricante Tier 1 de Andirá (PR). Especialista histórico en roperos y dormitorios infantiles RTA. Faturamento Est. R$ 280M - 350M, ~720 empleados."
  },
  {
    "Nombre de la Empresa": "Multimóveis",
    "Sitio Web": "https://www.multimoveis.com",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/multimoveis/",
    "Facebook": "https://www.facebook.com/multimoveis/",
    "Instagram": "https://www.instagram.com/multimoveis_oficial/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3997, // Falta de WebAR
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4033, // Muy Activo
    "Notas del Target": "Fabricante Tier 1 de Bento Gonçalves (RS). Líder exportador de cocinas e infantiles RTA. Faturamento Est. R$ 260M - 320M, ~680 empleados."
  },
  {
    "Nombre de la Empresa": "Bertolini Móveis",
    "Sitio Web": "https://www.bertolinimoveis.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/moveis-bertolini/",
    "Facebook": "https://www.facebook.com/bertolinimoveis/",
    "Instagram": "https://www.instagram.com/bertolini.moveis/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3992, // Cocinas
    "Dolor Principal": 3996, // R&D lento
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4033, // Muy Activo
    "Notas del Target": "Fabricante Tier 1 de Bento Gonçalves (RS). Cocinas de acero RTA y sistemas de almacenamiento industrial. Faturamento Est. R$ 250M - 300M, ~620 empleados."
  },
  {
    "Nombre de la Empresa": "Araplac",
    "Sitio Web": "https://www.araplac.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/araplac/",
    "Facebook": "https://www.facebook.com/araplacmoveis/",
    "Instagram": "https://www.instagram.com/araplacmoveis/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3995, // Devoluciones de herrajes
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4034, // Moderado
    "Notas del Target": "Fabricante Tier 1 de Arapongas (PR). Closets y dormitorios RTA de alta rotación. Faturamento Est. R$ 240M - 290M, ~580 empleados."
  },
  {
    "Nombre de la Empresa": "Politorno Móveis",
    "Sitio Web": "https://www.politorno.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/politorno/",
    "Facebook": "https://www.facebook.com/politorno/",
    "Instagram": "https://www.instagram.com/politorno/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3998, // Ninguno
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4033, // Muy Activo
    "Notas del Target": "Fabricante Tier 1 de Bento Gonçalves (RS). Referencia de manual técnico. Home office, salas y auxiliares RTA. Faturamento Est. R$ 220M - 270M, ~500 empleados."
  },
  {
    "Nombre de la Empresa": "Linea Brasil",
    "Sitio Web": "https://www.lineabrasil.com.br",
    "LinkedIn Corporativo": "https://www.linkedin.com/company/lineabrasil/",
    "Facebook": "https://www.facebook.com/lineabrasilmoveis/",
    "Instagram": "https://www.instagram.com/lineabrasilmoveis/",
    "Pais": "Brasil",
    "Nicho / Segmento": 3990, // Mobiliario RTA
    "Dolor Principal": 3997, // Falta de WebAR
    "Estado Comercial": 3999, // Prospecto
    "Canal Preferido": 4030, // Instagram
    "Actividad en Redes": 4033, // Muy Activo
    "Notas del Target": "Fabricante Tier 1 de Arapongas (PR). Paneles de TV, centros de entretenimiento y racks RTA. Faturamento Est. R$ 210M - 260M, ~480 empleados."
  }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Inyectando ${tier1Companies.length} empresas del Tier 1 a la tabla ${empresasTableId}...`);

    for (const company of tier1Companies) {
      try {
        const payload = {
          "Nombre de la Empresa": company["Nombre de la Empresa"],
          "Sitio Web": company["Sitio Web"],
          "LinkedIn Corporativo": company["LinkedIn Corporativo"],
          "Facebook": company["Facebook"],
          "Instagram": company["Instagram"],
          "Pais": company["Pais"],
          "Nicho / Segmento": company["Nicho / Segmento"],
          "Dolor Principal": company["Dolor Principal"],
          "Estado Comercial": company["Estado Comercial"],
          "Canal Preferido": company["Canal Preferido"],
          "Actividad en Redes": company["Actividad en Redes"],
          "Notas del Target": company["Notas del Target"]
        };
        const response = await request('POST', `/api/database/rows/table/${empresasTableId}/?user_field_names=true`, payload, token);
        console.log(`   Inyectada con éxito: ${company["Nombre de la Empresa"]} (Fila ID: ${response.id})`);
      } catch (err) {
        console.error(`   Error al inyectar ${company["Nombre de la Empresa"]}:`, err.message);
      }
    }

    console.log('\n¡Proceso finalizado con éxito! Las empresas del Tier 1 han sido cargadas en el CRM.');
  } catch (error) {
    console.error('Error durante la inyección:', error.message);
  }
}

run();

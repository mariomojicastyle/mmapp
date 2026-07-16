const https = require('https');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';
const leadsTableId = 994; // ID correcto de la tabla de leads/contactos

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

// Mapeos de IDs de la Tabla 994:
// Estado CRM (select ID 9537): Prospecto (4021), Primer Contacto (4022), Demo Agendada (4023)
// Status (select ID 9534): Nuevo (4017), Contactado (4018), Agendado (4019), Descartado (4020)
// Canal Preferido (select ID 9556): LinkedIn (4037), Instagram (4038), Facebook (4039), WhatsApp (4040), Correo (4041), Teléfono (4042)
// Actividad en Redes (select ID 9557): Muy Activo (4043), Moderado (4044), Inactivo (4045)
// Origen: "Prospección Activa"
// Empresa Vinculada (link_row ID 9545): [31] para Kits Paraná, [32] para Möbler Móveis

const leadsToInject = [
  {
    "Nombre": "Jamylle",
    "Apellido": "Duarte",
    "Email": "jamylle.duarte@kitsparana.com.br",
    "Rol": "Gerente de Pesquisa e Desenvolvimento (P&D)",
    "Telefono": "+55 43 3275-0500",
    "Status": 4017, // Nuevo
    "Estado CRM": 4021, // Prospecto
    "Origen": "Prospección Activa",
    "Descripcion de la idea": "Gerente de P&D de Kits Paraná. Lidera el 'Kits Lab' (laboratorio de innovación y competitividad). Target caliente para manuales interactivos de armado y WebAR en cocinas compactas.",
    "Empresa Vinculada": [31],
    "LinkedIn": "https://www.linkedin.com/company/kitsparana/", // Enlace corporativo de referencia o vacío si personal no disponible
    "Canal Preferido": 4037, // LinkedIn
    "Actividad en Redes": 4043 // Muy Activo
  },
  {
    "Nombre": "Edson",
    "Apellido": "Stocki",
    "Email": "producao@kitsparana.com.br",
    "Rol": "Gerente de Produção",
    "Telefono": "+55 43 3275-0500",
    "Status": 4017,
    "Estado CRM": 4021,
    "Origen": "Prospección Activa",
    "Descripcion de la idea": "Gerente de Producción de Kits Paraná. Participa en la capacitación de equipos fabriles y mejora continua en Arapongas (PR).",
    "Empresa Vinculada": [31],
    "Canal Preferido": 4041, // Correo
    "Actividad en Redes": 4044 // Moderado
  },
  {
    "Nombre": "Ricardo",
    "Apellido": "Carandina",
    "Email": "ricardo.carandina@mobler.ind.br",
    "Rol": "Sócio-Administrador / Diretor",
    "Telefono": "+55 43 3242-8800",
    "Status": 4017,
    "Estado CRM": 4021,
    "Origen": "Prospección Activa",
    "Descripcion de la idea": "Socio-Administrador clave de Möbler Móveis en Bela Vista do Paraíso (PR). Decisor estratégico para la propuesta B2B de manuales interactivos.",
    "Empresa Vinculada": [32],
    "Canal Preferido": 4041, // Correo
    "Actividad en Redes": 4044 // Moderado
  },
  {
    "Nombre": "Diogenys Marcelo",
    "Apellido": "Carandina",
    "Email": "marcelo.carandina@mobler.ind.br",
    "Rol": "Sócio-Administrador / Diretor",
    "Telefono": "+55 43 3242-8800",
    "Status": 4017,
    "Estado CRM": 4021,
    "Origen": "Prospección Activa",
    "Descripcion de la idea": "Copropietario y socio administrador de Möbler Móveis.",
    "Empresa Vinculada": [32],
    "Canal Preferido": 4042, // Teléfono
    "Actividad en Redes": 4045 // Inactivo
  }
];

async function run() {
  try {
    console.log('1. Autenticando en Baserow...');
    const authResponse = await request('POST', '/api/user/token-auth/', { username, password });
    const token = authResponse.token;
    console.log('Autenticación exitosa.');

    console.log(`2. Inyectando ${leadsToInject.length} leads en la tabla ${leadsTableId}...`);
    for (const lead of leadsToInject) {
      try {
        const response = await request('POST', `/api/database/rows/table/${leadsTableId}/?user_field_names=true`, lead, token);
        console.log(`   Lead inyectado con éxito: ${lead.Nombre} ${lead.Apellido} ➔ Fila ID: ${response.id}`);
      } catch (err) {
        console.error(`   Error al inyectar lead ${lead.Nombre} ${lead.Apellido}:`, err.message);
      }
    }
    console.log('\n¡Proceso finalizado! Todos los leads clave han sido vinculados a sus respectivas empresas.');
  } catch (error) {
    console.error('Error general durante la ejecución:', error.message);
  }
}

run();

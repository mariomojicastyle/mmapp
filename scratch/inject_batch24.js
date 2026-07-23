const https = require('https');
const { insertLead } = require('./insert_lead_factory.js');

const kitsId = 65; // Existing company

async function run() {
  try {
    const leads = [
      {
        firstName: "Wagner Amancio",
        lastName: "Pereira",
        role: "Representante comercial de vendas",
        linkedinUrl: "https://www.linkedin.com/in/wagner-amancio-pereira-9524b4205/",
        companyName: "Kit's Paraná",
        companyId: kitsId,
        companyDomain: "kitsparana.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Evaldo",
        lastName: "Arruda",
        role: "Diretor Presidente",
        linkedinUrl: "https://www.linkedin.com/in/evaldo-arruda-9906a3147/",
        companyName: "Kit's Paraná",
        companyId: kitsId,
        companyDomain: "kitsparana.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "ERICA",
        lastName: "DIAS",
        role: "Gerente Comercial Regional Sul e Sudeste",
        linkedinUrl: "https://www.linkedin.com/in/erica-dias-318868231/",
        companyName: "Kit's Paraná",
        companyId: kitsId,
        companyDomain: "kitsparana.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Eduardo Henrique",
        lastName: "Costa",
        role: "Analista de Sistema & BI",
        linkedinUrl: "https://www.linkedin.com/in/edhcosta/",
        companyName: "Kit's Paraná",
        companyId: kitsId,
        companyDomain: "kitsparana.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Fernando",
        lastName: "D'Agostini",
        role: "Tecnologia da Informação",
        linkedinUrl: "https://www.linkedin.com/in/fernando-d-agostini-0862291b6/",
        companyName: "Kit's Paraná",
        companyId: kitsId,
        companyDomain: "kitsparana.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      }
    ];

    for (const lead of leads) {
      console.log(`Inyectando lead ${lead.firstName} ${lead.lastName}...`);
      await insertLead(lead);
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log("¡Proceso completado!");
  } catch (e) {
    console.error("Error:", e);
  }
}

run();

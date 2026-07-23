const https = require('https');
const { insertLead } = require('./insert_lead_factory.js');

const politornoId = 63; // Existing company

async function run() {
  try {
    const leads = [
      {
        firstName: "Marcieli",
        lastName: "Bueno",
        role: "Departamento comercial",
        linkedinUrl: "https://www.linkedin.com/in/marcieli-bueno/",
        companyName: "Politorno Móveis",
        companyId: politornoId,
        companyDomain: "politorno.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Elíseo",
        lastName: "Franco",
        role: "Jefe Comercial y de Operaciones",
        linkedinUrl: "https://www.linkedin.com/in/elíseo-franco-5372051a2/",
        companyName: "Politorno Móveis",
        companyId: politornoId,
        companyDomain: "politorno.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "El Salvador"
      },
      {
        firstName: "Vitor",
        lastName: "Machado",
        role: "Analista de Engenharia de Produto",
        linkedinUrl: "https://www.linkedin.com/in/vitor-s-machado/",
        companyName: "Politorno Móveis",
        companyId: politornoId,
        companyDomain: "politorno.com.br",
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

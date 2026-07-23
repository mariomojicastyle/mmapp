const https = require('https');
const { insertLead } = require('./insert_lead_factory.js');

const demobileId = 54;

async function run() {
  try {
    const leads = [
      {
        firstName: "Junio César",
        lastName: "Françolin",
        role: "Gerente de produção",
        linkedinUrl: "https://www.linkedin.com/in/junio-césar-françolin-061172267/",
        companyName: "Demóbile Indústria de Móveis",
        companyId: demobileId,
        companyDomain: "demobile.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Stephanie",
        lastName: "Fernandes",
        role: "Supervisora de venda internacional",
        linkedinUrl: "https://www.linkedin.com/in/stephanie-fernandes-970b989a/",
        companyName: "Demóbile Indústria de Móveis",
        companyId: demobileId,
        companyDomain: "demobile.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Anderson",
        lastName: "Gabriel",
        role: "Líder de manutenção",
        linkedinUrl: "https://www.linkedin.com/in/anderson-gabriel-54ba95314/",
        companyName: "Demóbile Indústria de Móveis",
        companyId: demobileId,
        companyDomain: "demobile.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Remerson",
        lastName: "Rodrigues",
        role: "Supervisor Logístico",
        linkedinUrl: "https://www.linkedin.com/in/remerson-rodrigues-963484230/",
        companyName: "Demóbile Indústria de Móveis",
        companyId: demobileId,
        companyDomain: "demobile.com.br",
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

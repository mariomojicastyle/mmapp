const https = require('https');
const { insertLead } = require('./insert_lead_factory.js');

const caemmunId = 57;

async function run() {
  try {
    const leads = [
      {
        firstName: "Claudemir",
        lastName: "M. Moraes",
        role: "Gerente de Manutenção",
        linkedinUrl: "https://www.linkedin.com/in/claudemir-m-moraes-9848597a/",
        companyName: "Caemmun Movelaria",
        companyId: caemmunId,
        companyDomain: "caemmun.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Bruno",
        lastName: "Oliveira",
        role: "Analista de Engenharia Pleno",
        linkedinUrl: "https://www.linkedin.com/in/bruno-oliveira-36bb562b7/",
        companyName: "Caemmun Movelaria",
        companyId: caemmunId,
        companyDomain: "caemmun.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Alessandro",
        lastName: "Ferreira",
        role: "Gerente",
        linkedinUrl: "https://www.linkedin.com/in/alessandro-ferreira-4b8085330/",
        companyName: "Caemmun Movelaria",
        companyId: caemmunId,
        companyDomain: "caemmun.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Ivam",
        lastName: "Matheus",
        role: "Gerente Industrial",
        linkedinUrl: "https://www.linkedin.com/in/ivam-matheus-a6a4a980/",
        companyName: "Caemmun Movelaria",
        companyId: caemmunId,
        companyDomain: "caemmun.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Carlos Henrique",
        lastName: "Gonçalves",
        role: "Técnico eletromecânico",
        linkedinUrl: "https://www.linkedin.com/in/carlos-henrique-gonçalves-4a8019210/",
        companyName: "Caemmun Movelaria",
        companyId: caemmunId,
        companyDomain: "caemmun.com.br",
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

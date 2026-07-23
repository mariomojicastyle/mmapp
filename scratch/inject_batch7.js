const https = require('https');
const { insertLead } = require('./insert_lead_factory.js');

const itatiaiaId = 51;

async function run() {
  try {
    const leads = [
      {
        firstName: "Evandro",
        lastName: "Pinto",
        role: "Diretor Industrial",
        linkedinUrl: "https://www.linkedin.com/in/evandro-pinto-37659883/",
        companyName: "Itatiaia",
        companyId: itatiaiaId,
        companyDomain: "itatiaia.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Richard",
        lastName: "Mura",
        role: "Analista de processos",
        linkedinUrl: "https://www.linkedin.com/in/richard-moura-5174ab302/",
        companyName: "Itatiaia",
        companyId: itatiaiaId,
        companyDomain: "itatiaia.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Wenderson",
        lastName: "Oliveira da Conceição",
        role: "Analista de controle de qualidade pleno",
        linkedinUrl: "https://www.linkedin.com/in/wenderson-oliveira-da-conceição-86618b313/",
        companyName: "Itatiaia",
        companyId: itatiaiaId,
        companyDomain: "itatiaia.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Jaqueline",
        lastName: "Moreira",
        role: "Gerente de vendas regional",
        linkedinUrl: "https://www.linkedin.com/in/jaqueline-moreira-7503081b9/",
        companyName: "Itatiaia",
        companyId: itatiaiaId,
        companyDomain: "itatiaia.com.br",
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

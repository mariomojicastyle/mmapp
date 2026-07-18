const https = require('https');
const { insertLead } = require('./insert_lead_factory.js');

const username = 'mariomojica.style@gmail.com';
const password = 'MarioMojicaBaserow2026!';
const baserowUrl = 'baserow.mariomojica.com';

async function run() {
  try {
    const leads = [
      {
        firstName: "Dionísio",
        lastName: "De Bortoli",
        role: "Arquiteto e Design",
        linkedinUrl: "https://www.linkedin.com/in/dionisio-de-bortoli-932b0b75/",
        companyName: "BRV Móveis",
        companyId: 40,
        companyDomain: "brvmoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      },
      {
        firstName: "Rodrigo",
        lastName: "Benini",
        role: "General Manager International",
        linkedinUrl: "https://www.linkedin.com/in/rodrigo-benini-100a18b2/",
        companyName: "BRV Móveis",
        companyId: 40,
        companyDomain: "brvmoveis.com.br",
        companyPhone: "", 
        companyWhatsApp: "",
        country: "Brasil"
      }
    ];

    for (const lead of leads) {
      console.log(`Inyectando lead ${lead.firstName} ${lead.lastName}...`);
      await insertLead(lead);
      // add a small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log("¡Proceso completado!");
  } catch (e) {
    console.error("Error:", e);
  }
}

run();

const { insertLead } = require('./insert_lead_factory.js');

async function run() {
  console.log("Inyectando 2 contactos nuevos...");

  const leads = [
    {
      firstName: "Rodrigo",
      lastName: "Borsato",
      role: "Supervisor Comercial",
      linkedinUrl: "https://www.linkedin.com/in/rodrigo-borsato-828003a1/",
      companyName: "Tecno Mobili",
      companyId: 9,
      companyDomain: "tecnomobili.ind.br",
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Vitor",
      lastName: "Machado",
      role: "Analista de Engenharia de Produto",
      linkedinUrl: "https://www.linkedin.com/in/vitor-s-machado/",
      companyName: "Politorno Móveis",
      companyId: 29,
      companyDomain: "politorno.com.br",
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    }
  ];

  for (const lead of leads) {
    try {
      await insertLead(lead);
    } catch (e) {
      console.error(`Error inyectando a ${lead.firstName}:`, e);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("¡Proceso completado!");
}

run();

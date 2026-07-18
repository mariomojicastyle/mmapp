const { insertLead } = require('./insert_lead_factory.js');

async function run() {
  console.log("Inyectando 3 contactos nuevos de Móveis Notável...");

  const companyId = 2; // Móveis Notável
  const companyDomain = "notavel.ind.br";
  const companyName = "Móveis Notável";

  const leads = [
    {
      firstName: "Talissa",
      lastName: "Angonese",
      role: "Auxiliar de Comercio Internacional",
      linkedinUrl: "https://www.linkedin.com/in/talissa-angonese/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Tiago Rogério",
      lastName: "Florek",
      role: "Supervisor Comercial",
      linkedinUrl: "https://www.linkedin.com/in/tiago-rogério-florek-1195b1127/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Luis Henrique",
      lastName: "Viana Borges",
      role: "Gerente de Vendas",
      linkedinUrl: "https://www.linkedin.com/in/luis-henrique-viana-borges-a5a727237/",
      companyName,
      companyId,
      companyDomain,
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

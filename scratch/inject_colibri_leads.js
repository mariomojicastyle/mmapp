const { insertLead } = require('./insert_lead_factory.js');

async function run() {
  console.log("Inyectando contactos restantes de Colibri Móveis...");

  const colibriData = {
    companyName: "Colibri Móveis",
    companyId: 1,
    companyDomain: "colibrimoveis.com.br",
    companyPhone: "", 
    companyWhatsApp: "",
    country: "Brasil"
  };

  const leads = [
    {
      firstName: "José Antonio",
      lastName: "Manfrinato",
      role: "Gerente de Recursos Humanos",
      linkedinUrl: "https://www.linkedin.com/search/results/people/?keywords=Jos%C3%A9%20Antonio%20Manfrinato%20Colibri%20M%C3%B3veis"
    },
    {
      firstName: "Cristian",
      lastName: "Martins",
      role: "Supervisor de Vendas",
      linkedinUrl: "https://www.linkedin.com/in/cristian-martins-4b7872191/"
    }
  ];

  for (const lead of leads) {
    const fullLead = { ...colibriData, ...lead };
    try {
      await insertLead(fullLead);
    } catch (e) {
      console.error(`Error inyectando a ${lead.firstName}:`, e);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("¡Proceso completado!");
}

run();

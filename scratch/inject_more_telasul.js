const { insertLead } = require('./insert_lead_factory.js');

async function run() {
  console.log("Inyectando 4 contactos adicionales de Telasul Indústria de Móveis S.A...");

  const companyId = 5; // Telasul
  const companyDomain = "telasul.com.br";
  const companyName = "Telasul Indústria de Móveis S.A";

  const leads = [
    {
      firstName: "Everton",
      lastName: "Savi",
      role: "Analista de infraestrutura de TI",
      linkedinUrl: "https://www.linkedin.com/in/evertonsavi/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Dienifer",
      lastName: "Guerra",
      role: "Consultora de vendas",
      linkedinUrl: "https://www.linkedin.com/in/dienifer-guerra-0b688b26b/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Marcelo",
      lastName: "Corbellini",
      role: "Coordenador de Desenvolvimento de Produtos",
      linkedinUrl: "https://www.linkedin.com/in/marcelo-corbellini-7203087b/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Évilin",
      lastName: "Abreu",
      role: "Gerente Regional de Vendas",
      linkedinUrl: "https://www.linkedin.com/in/évilin-abreu-68b97769/",
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

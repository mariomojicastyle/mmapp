const { insertLead } = require('./insert_lead_factory.js');

async function run() {
  console.log("Inyectando 4 contactos nuevos de Ditália Móveis...");

  const companyId = 6; // Ditália
  const companyDomain = "ditalia.com.br";
  const companyName = "Ditália Móveis";

  const leads = [
    {
      firstName: "Pablo Genrich",
      lastName: "Arroyo",
      role: "Export & International Sales",
      linkedinUrl: "https://www.linkedin.com/in/pablo-genrich-arroyo-380775132/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Renan",
      lastName: "Capoani",
      role: "Marketing and Sales Director",
      linkedinUrl: "https://www.linkedin.com/in/renan-capoani-14511b83/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Luis",
      lastName: "Aiolfi",
      role: "Gerente Engenharia de Processos",
      linkedinUrl: "https://www.linkedin.com/in/luis-aiolfi-b361b8ab/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Luis Fernandes",
      lastName: "Aiolfi",
      role: "Method & Process Manager",
      linkedinUrl: "https://www.linkedin.com/in/luisaiolfi/",
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

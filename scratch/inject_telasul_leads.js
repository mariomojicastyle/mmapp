const { insertLead } = require('./insert_lead_factory.js');

async function run() {
  console.log("Inyectando 5 contactos nuevos de Telasul Indústria de Móveis S.A...");

  const companyId = 5; // Telasul
  const companyDomain = "telasul.com.br";
  const companyName = "Telasul Indústria de Móveis S.A";

  const leads = [
    {
      firstName: "Marcelo",
      lastName: "Ariotti",
      role: "CEO",
      linkedinUrl: "https://www.linkedin.com/in/marcelo-ariotti-70a714237/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Tiago",
      lastName: "Lazzarotto",
      role: "Líder de manutenção",
      linkedinUrl: "https://www.linkedin.com/in/tiago-lazzarotto-421b4a121/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Benhur",
      lastName: "Flores",
      role: "Gerente Comercial",
      linkedinUrl: "https://www.linkedin.com/in/benhur-flores-2b7b4058/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Adriane",
      lastName: "Stepaníenco",
      role: "Analista de e-commerce",
      linkedinUrl: "https://www.linkedin.com/in/adriane-stepanienco-11b6892b/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Mateus",
      lastName: "Amaro Alves",
      role: "Gerente regional",
      linkedinUrl: "https://www.linkedin.com/in/mateus-amaro-alves-81207448/",
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

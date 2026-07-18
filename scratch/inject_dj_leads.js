const { insertLead } = require('./insert_lead_factory.js');

async function run() {
  console.log("Inyectando 4 contactos nuevos de DJ Móveis...");

  const companyId = 4; // DJ Móveis
  const companyDomain = "djmoveis.com.br";
  const companyName = "DJ Móveis";

  const leads = [
    {
      firstName: "Tiago",
      lastName: "Marinho",
      role: "Analista de DP Sênior",
      linkedinUrl: "https://www.linkedin.com/in/tiago-marinho-351b301a2/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Isadora",
      lastName: "Henschel",
      role: "Analista de E-commerce",
      linkedinUrl: "https://www.linkedin.com/in/isadora-henschel-2b21372a4/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Karina",
      lastName: "Rodrigues",
      role: "Analista de RH",
      linkedinUrl: "https://www.linkedin.com/in/karina-pilla/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Itamar",
      lastName: "Fornel",
      role: "Gerente de Produção",
      linkedinUrl: "https://www.linkedin.com/in/itamar-fornel-a8572b21b/",
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

const { insertLead } = require('./insert_lead_factory.js');

async function run() {
  console.log("Inyectando 4 contactos nuevos de Móveis Rufato...");

  const companyId = 3; // Móveis Rufato
  const companyDomain = "moveisrufato.com.br";
  const companyName = "Móveis Rufato";

  const leads = [
    {
      firstName: "Alexandre",
      lastName: "Licazali",
      role: "Analista Comercial",
      linkedinUrl: "https://www.linkedin.com/in/alexandre-licazali-b26a2029a/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Gustavo",
      lastName: "Toledo",
      role: "Gerente de Produção",
      linkedinUrl: "https://www.linkedin.com/in/gustavo-toledo-a13a0235a/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Diego Junio",
      lastName: "Rezende de Barros",
      role: "Supervisor de Produção",
      linkedinUrl: "https://www.linkedin.com/in/diego-junio-rezende-de-barros-1b679049/",
      companyName,
      companyId,
      companyDomain,
      companyPhone: "", 
      companyWhatsApp: "",
      country: "Brasil"
    },
    {
      firstName: "Moisés",
      lastName: "Silva",
      role: "Gerente Administrativo",
      linkedinUrl: "https://www.linkedin.com/in/moisés-silva-48487723/",
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

import { Link } from "@/i18n/navigation";
import { projects } from "./portfolio/data";
import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import ContactForm from "@/components/ContactForm";
import { getTranslations } from "next-intl/server";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Index");
  const tRoot = await getTranslations();

  return (
    <div className="bg-white text-gray-900 font-sans">
      <Header />

      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#0088AA] text-white px-6 pt-20 overflow-hidden">
        {/* Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/videos/Animacion_Banner.mp4" type="video/mp4" />
        </video>

        {/* Brand Overlay */}
        <div className="absolute inset-0 bg-[#0088AA]/80 z-10"></div>

        {/* Texture Overlay (Optional, keeping it subtle) */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-20"></div>

        <div className="relative z-30 max-w-4xl text-center space-y-8">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight uppercase italic">
            {t("Hero.title")}
          </h1>
          <div className="flex flex-col items-center gap-2 pt-4">
            <p className="text-sm md:text-base font-medium opacity-90 uppercase tracking-widest font-bold">
              {t("Hero.scroll")}
            </p>
            <div className="animate-bounce">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
          </div>
        </div>
      </section>

      <section className="portfolio-grid overflow-hidden border-t border-gray-100" id="portfolio">
        {projects.map((project) => (
          <ProjectCard 
            key={project.slug} 
            project={project} 
            translations={{
              duration_15: t("Portfolio.duration_15"),
              this_year: t("Portfolio.this_year"),
              years_ago: t("Portfolio.years_ago", { count: 2026 - parseInt(project.period.split(" ")[0]) }),
              view: t("Portfolio.view"),
              title: tRoot(`Projects.${project.slug}.title`),
            }} 
          />
        ))}
      </section>

      <section className="py-8 bg-white border-b border-gray-100 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex items-center pause-on-hover">
            <span className="shrink-0 text-[#0088AA] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mr-8 z-10 bg-white pr-4">
              {t("Stack.title")}
            </span>
            <div className="flex-1 overflow-hidden relative">
              <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-12 pr-12">
                    <span>Rhino 3D</span>
                    <span>Grasshopper</span>
                    <span>Blender</span>
                    <span>N8N</span>
                    <span>Supabase</span>
                    <span>Antigravity</span>
                    <span>Stitch</span>
                    <span>React</span>
                    <span>Three.js</span>
                    <span>Next.js</span>
                    <span>Baserow</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#FDFCF8]" id="about">
        <div className="container mx-auto max-w-6xl">
          {/* Mobile Version: Interleaved Text and Images */}
          <div className="md:hidden space-y-8 flex flex-col">
            <h2 className="text-3xl font-black leading-tight text-gray-900 uppercase italic">
              {t("About.title")}
            </h2>
            
            <div className="space-y-6 text-gray-600 leading-relaxed text-base text-justify">
              <p>{t("About.p1")}</p>
              <img 
                src="/portfolio/Sobre_mi/03_Grasshopper_chair.webp" 
                alt={t("About.images.parametric")}
                className="w-full h-auto object-cover rounded shadow-sm"
              />
              
              <p>{t("About.p2")}</p>
              <img 
                src="/portfolio/Sobre_mi/02_Despiece.webp" 
                alt={t("About.images.pieces")}
                className="w-full h-auto object-cover rounded shadow-sm"
              />
              
              <p>{t("About.p3")}</p>
              <img 
                src="/portfolio/Sobre_mi/04_N8N.webp" 
                alt={t("About.images.automation")}
                className="w-full h-auto object-cover rounded shadow-sm"
              />
              
              <p>{t("About.p4")}</p>
              <img 
                src="/portfolio/Sobre_mi/05_CNC.webp" 
                alt={t("About.images.cnc")}
                className="w-full h-auto object-cover rounded shadow-sm"
              />
            </div>
          </div>

          {/* Desktop Version: Two Column Layout */}
          <div className="hidden md:grid grid-cols-2 gap-12 md:gap-20 items-start">
            <div className="relative space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <img
                  alt={t("About.images.parametric")}
                  className="w-full h-auto object-cover rounded shadow-sm transition-all duration-700 hover:scale-[1.02]"
                  src="/portfolio/Sobre_mi/03_Grasshopper_chair.webp"
                />
                <img
                  alt={t("About.images.pieces")}
                  className="w-full h-auto object-cover rounded shadow-sm transition-all duration-700 hover:scale-[1.02]"
                  src="/portfolio/Sobre_mi/02_Despiece.webp"
                />
                <img
                  alt={t("About.images.automation")}
                  className="w-full h-auto object-cover rounded shadow-sm transition-all duration-700 hover:scale-[1.02]"
                  src="/portfolio/Sobre_mi/04_N8N.webp"
                />
                <img
                  alt={t("About.images.cnc")}
                  className="w-full h-auto object-cover rounded shadow-sm transition-all duration-700 hover:scale-[1.02]"
                  src="/portfolio/Sobre_mi/05_CNC.webp"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#0088AA] -z-10 opacity-20"></div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-gray-900 uppercase italic">
                {t("About.title")}
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base md:text-lg text-justify">
                <p>{t("About.p1")}</p>
                <p>{t("About.p2")}</p>
                <p>{t("About.p3")}</p>
                <p>{t("About.p4")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContactForm />

      <footer className="bg-white py-12 px-6 border-t border-gray-100">
        <div className="container mx-auto flex flex-col items-center gap-6">
          <div className="flex gap-8 text-gray-900">
            <Link className="hover:text-[#0088AA] transition-colors" href="/Curriculum_Mario_Mojica_Marzo_2026.pdf" target="_blank" download><span className="material-symbols-outlined">description</span></Link>
            <Link className="hover:text-[#0088AA] transition-colors" href="https://www.linkedin.com/in/mario-mojica" target="_blank" rel="noopener noreferrer"><span className="material-symbols-outlined">link</span></Link>
            <Link className="hover:text-[#0088AA] transition-colors" href="mailto:direccion@mariomojica.com"><span className="material-symbols-outlined">alternate_email</span></Link>
          </div>
          <p className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-widest">
            {t("Footer.copy")}
          </p>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { projects } from "./portfolio/data";
import Header from "@/components/Header";
import ContactForm from "@/components/ContactForm";

export default function Home() {
  return (
    <div className="bg-white text-gray-900 font-sans">
      <Header />

      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#0088AA] text-white px-6 pt-20">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-4xl text-center space-y-8">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight uppercase italic">
            Soy Mario Mojica: Diseñador Industrial experto en automatizar el ciclo completo de manufactura y mercadeo.
          </h1>
          <div className="flex flex-col items-center gap-2 pt-4">
            <p className="text-sm md:text-base font-medium opacity-90 uppercase tracking-widest font-bold">Desplázate para ver mi trabajo</p>
            <div className="animate-bounce">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
          </div>
        </div>
      </section>

      <section className="portfolio-grid overflow-hidden border-t border-gray-100" id="portfolio">
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={`/portfolio/${project.slug}`}
            className="relative group aspect-square overflow-hidden bg-gray-100 border-[0.5px] border-gray-200"
          >
            <img
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
              src={project.mainImage}
            />
            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center text-center p-8 scale-95 group-hover:scale-100 transform transition-transform">
              <span className="text-white text-lg font-black uppercase italic mb-2">
                {project.slug === "maderkit"
                  ? "Durante 15 años"
                  : 2026 - parseInt(project.period.split(" ")[0]) === 0
                    ? "Este año"
                    : `Hace ${2026 - parseInt(project.period.split(" ")[0])} años`}
              </span>
              <span className="text-[#0088AA] text-[10px] font-bold uppercase tracking-[0.3em] mb-4">{project.period}</span>
              <h3 className="text-white text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight italic">
                {project.title}
              </h3>
              <div className="mt-6 w-12 h-[2px] bg-[#0088AA]"></div>
              <span className="mt-6 text-white/50 text-[10px] font-bold uppercase tracking-widest">Ver Proyecto</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
            <span>Rhino 3D</span>
            <span>Grasshopper</span>
            <span>Blender</span>
            <span className="text-[#0088AA] animate-pulse">●</span>
            <span>Frontend/backend devops</span>
            <span>N8N</span>
            <span>Supabase</span>
            <span>Antigravity</span>
            <span>Stitch</span>
            <span>React</span>
            <span>Three.js</span>
            <span>Next.js</span>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#FDFCF8]" id="about">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
            <div className="relative space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <img
                  alt="Despiece y Estructura Técnica"
                  className="w-full h-auto object-cover rounded shadow-sm transition-all duration-700 hover:scale-[1.02]"
                  src="/portfolio/Sobre_mi/02_Despiece.webp"
                />
                <img
                  alt="Diseño Paramétrico Grasshopper"
                  className="w-full h-auto object-cover rounded shadow-sm transition-all duration-700 hover:scale-[1.02]"
                  src="/portfolio/Sobre_mi/03_Grasshopper_chair.webp"
                />
                <img
                  alt="Automatización con n8n"
                  className="w-full h-auto object-cover rounded shadow-sm transition-all duration-700 hover:scale-[1.02]"
                  src="/portfolio/Sobre_mi/04_N8N.webp"
                />
                <img
                  alt="Manufactura CNC"
                  className="w-full h-auto object-cover rounded shadow-sm transition-all duration-700 hover:scale-[1.02]"
                  src="/portfolio/Sobre_mi/05_CNC.webp"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#0088AA] -z-10 opacity-20"></div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-gray-900 uppercase italic">
                DISEÑO GENERATIVO Y AUTOMATIZACIÓN MAXIMIZANDO LA RENTABILIDAD EN LA INDUSTRIA DEL MUEBLE
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base md:text-lg text-justify">
                <p>
                  Soy Mario Mojica, Diseñador Industrial experto en la automatización de procesos con diseño generativo para la industria del mueble. Mi trayectoria no se mide solo en años, sino en más de 3 millones de productos que hoy habitan hogares en toda Latinoamérica. Desde el 2020, he consolidado mi perfil como estratega tecnológico, dedicándome a resolver la ineficiencia empresarial mediante la fusión de la maestría en manufactura con la aceleración de la IA.
                </p>
                <p>
                  Mi enfoque no es solo estético; es sistémico. Utilizo un ecosistema de vanguardia —integrando Rhino 3D, Grasshopper y n8n— para transformar la forma en la que se conciben los productos. Mi objetivo es lograr una rentabilidad superior, creando flujos de trabajo optimizados y listos para la Manufactura 4.0. No solo diseño objetos; diseño los sistemas inteligentes que los hacen posibles.
                </p>
                <p>
                  Especializado en convertir departamentos de diseño lentos en unidades de alto rendimiento, mi metodología integra flujos CNC, visualización avanzada en Blender/Three.js y automatizaciones para mercadeo. He logrado reducir los ciclos de desarrollo y respuesta técnica en hasta un 80%, eliminando cuellos de botella tradicionales.
                </p>
                <p>
                  Las áreas de diseño convencionales suelen ser costosas y poco ágiles; mi misión es cambiar esa realidad. Sumo 15 años de experiencia en manufactura masiva a un stack tecnológico de IA para entregar renders, planos y manuales de armado con una precisión quirúrgica. Acompaño a las empresas a dar el salto definitivo hacia la transformación digital, implementando procesos que aseguran su competitividad en el mercado global.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContactForm />

      <footer className="bg-white py-12 px-6 border-t border-gray-100">
        <div className="container mx-auto flex flex-col items-center gap-6">
          <div className="flex gap-8 text-gray-900">
            <Link className="hover:text-[#0088AA] transition-colors" href="#"><span className="material-symbols-outlined">description</span></Link>
            <Link className="hover:text-[#0088AA] transition-colors" href="#"><span className="material-symbols-outlined">link</span></Link>
            <Link className="hover:text-[#0088AA] transition-colors" href="#"><span className="material-symbols-outlined">alternate_email</span></Link>
          </div>
          <p className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-widest">
            © Mario Mojica - Portafolio
          </p>
        </div>
      </footer>
    </div>
  );
}

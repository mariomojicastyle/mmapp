import Link from "next/link";
import { projects } from "./portfolio/data";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="bg-white text-gray-900 font-sans">
      <Header />

      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#0088AA] text-white px-6 pt-20">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-4xl text-center space-y-8">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight uppercase italic">
            ¡Hola! Soy Mario Mojica. Diseñador Industrial y Desarrollador de Producto.
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
            <span>SolidWorks</span>
            <span>Blender</span>
            <span>React</span>
            <span>Three.js</span>
            <span>Next.js</span>
            <span>AI Automation</span>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#FDFCF8]" id="about">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="relative">
              <img
                alt="Mario Mojica Profile"
                className="w-full aspect-[4/5] object-cover rounded shadow-sm grayscale hover:grayscale-0 transition-all duration-700"
                src="/portfolio/2026_Mario_Mojica/M-1.JPG"
              />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#0088AA] -z-10 opacity-20"></div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-gray-900 uppercase italic">
                Transformando ideas en productos fabricables
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
                <p>
                  Con más de 15 años de trayectoria en el sector industrial, mi enfoque fusiona la precisión de la ingeniería con la sensibilidad del diseño contemporáneo.
                </p>
                <p>
                  Me especializo en el desarrollo de mobiliario RTA, optimización de flujos CNC y la integración de tecnologías 3D para la web, permitiendo que el diseño digital sea funcional, escalable y comercialmente viable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 text-center" id="contact">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-black mb-10 tracking-tight text-gray-900 uppercase italic">¿Tienes un proyecto en mente?</h2>
          <Link
            className="inline-block bg-[#0088AA] text-white py-5 px-14 font-bold text-lg uppercase tracking-widest hover:bg-opacity-90 transition-all shadow-xl shadow-teal-900/10"
            href="mailto:hola@mariomojica.com"
          >
            Contáctame
          </Link>
        </div>
      </section>

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

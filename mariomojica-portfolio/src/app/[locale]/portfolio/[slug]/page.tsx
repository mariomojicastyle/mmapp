import { projects } from "../data";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Header from "@/components/Header";
import { getTranslations } from "next-intl/server";

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { slug } = await params;
    const project = projects.find((p) => p.slug === slug);
    const t = await getTranslations("Index.Portfolio");
    const tProject = await getTranslations(`Projects.${slug}`);

    if (!project) {
        notFound();
    }

    return (
        <div className="bg-white text-gray-900 font-sans">
            <Header />

            <main>
                {/* Hero Section for Project */}
                <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
                    <img
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover grayscale brightness-50"
                        src={project.mainImage}
                    />
                    <div className="relative z-10 container mx-auto px-6 text-center text-white">
                        <div className="mb-4">
                            <span className="text-sm font-bold text-[#0088AA] uppercase tracking-[0.3em]">{project.period}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-2 uppercase italic tracking-tighter">
                            {tProject("title")}
                        </h1>
                    </div>
                </section>

                <section className="py-20 bg-white">
                    <div className="container mx-auto px-6 max-w-4xl">
                        <div className="space-y-8 text-lg md:text-xl text-gray-600 leading-relaxed">
                            {(tProject.raw("description") as string[]).map((p, i) => (
                                <p key={i}>{p}</p>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="pb-32 flex flex-col items-center px-6">
                    <div className="w-full max-w-6xl space-y-12 md:space-y-20">
                        {project.images.map((img, i) => (
                            <div key={i} className="overflow-hidden rounded-sm shadow-lg">
                                <img
                                    alt={`${project.title} detail ${i + 1}`}
                                    className="w-full h-auto object-cover"
                                    src={img}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="bg-white py-20 px-6 border-t border-gray-100 text-center">
                <div className="container mx-auto flex flex-col items-center gap-12">
                    <Link
                        className="group flex items-center gap-3 text-[#0088AA] font-bold uppercase tracking-widest text-sm transition-all hover:gap-5"
                        href="/#portfolio"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        {t("back")}
                    </Link>
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex gap-10 text-gray-400">
                            <Link className="hover:text-[#0088AA] transition-colors" href="#"><span className="material-symbols-outlined !text-3xl">description</span></Link>
                            <Link className="hover:text-[#0088AA] transition-colors" href="#"><span className="material-symbols-outlined !text-3xl">link</span></Link>
                            <Link className="hover:text-[#0088AA] transition-colors" href="#"><span className="material-symbols-outlined !text-3xl">alternate_email</span></Link>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">hola@mariomojica.com</p>
                            <p className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-[0.2em]">
                                © Mario Mojica
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

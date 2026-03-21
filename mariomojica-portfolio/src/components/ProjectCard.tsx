"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

interface ProjectCardProps {
    project: any;
    translations: {
        duration_15: string;
        this_year: string;
        years_ago: string;
        view: string;
        title: string;
    };
}

export default function ProjectCard({ project, translations }: ProjectCardProps) {
    const [isInCenter, setIsInCenter] = useState(false);
    const cardRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // Only apply intersection logic if we are NOT on desktop
                    if (window.innerWidth < 1024) {
                        setIsInCenter(entry.isIntersecting);
                    } else {
                        setIsInCenter(false);
                    }
                });
            },
            {
                rootMargin: "-30% 0px -30% 0px",
                threshold: 0.1,
            }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const durationText = project.slug === "maderkit"
        ? translations.duration_15
        : 2026 - parseInt(project.period.split(" ")[0]) === 0
            ? translations.this_year
            : translations.years_ago.replace("{count}", (2026 - parseInt(project.period.split(" ")[0])).toString());

    return (
        <Link
            ref={cardRef}
            key={project.slug}
            href={`/portfolio/${project.slug}`}
            className="relative group aspect-square overflow-hidden bg-gray-100 border-[0.5px] border-gray-200"
        >
            <img
                alt={project.title}
                className={`w-full h-full object-cover transition-transform duration-1000 grayscale group-hover:grayscale-0 group-hover:scale-110 ${
                    isInCenter ? "grayscale-0 scale-110" : ""
                }`}
                src={project.mainImage}
            />
            <div className={`absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-8 transition-all duration-500 transform ${
                isInCenter 
                    ? "opacity-100 scale-100" 
                    : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
            }`}>
                <span className="text-white text-lg font-black uppercase italic mb-2">
                    {durationText}
                </span>
                <span className="text-[#0088AA] text-[10px] font-bold uppercase tracking-[0.3em] mb-4">{project.period}</span>
                <h3 className="text-white text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight italic">
                    {translations.title}
                </h3>
                <div className="mt-6 w-12 h-[2px] bg-[#0088AA]"></div>
                <span className="mt-6 text-white/50 text-[10px] font-bold uppercase tracking-widest">{translations.view}</span>
            </div>
        </Link>
    );
}

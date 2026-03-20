"use client";

import { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const t = useTranslations("Header");
    const locale = useLocale();
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${isScrolled
                ? "bg-white shadow-xl py-3 text-gray-900"
                : "bg-transparent py-6 text-white"
                }`}
        >
            <div className="container mx-auto px-6 flex items-center justify-between relative">
                {/* Navigation - Hidden on mobile */}
                <nav className="hidden lg:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em]">
                    <Link className="hover:opacity-60 transition-all" href="/#portfolio">{t("portfolio")}</Link>
                    <Link className="hover:opacity-60 transition-all" href="/#about">{t("about")}</Link>
                    <Link className="hover:opacity-60 transition-all" href="/#contact">{t("contact")}</Link>
                </nav>

                {/* Brand / Logo */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <Link
                        className="transition-all duration-500 block"
                        href="/"
                    >
                        <img
                            src="/Logo_Header.svg"
                            alt="Mario Mojica Logo"
                            className={`h-7 md:h-9 w-auto transition-all duration-500 ${isScrolled ? "brightness-100" : "brightness-0 invert"
                                }`}
                        />
                    </Link>
                </div>

                {/* Right side stuff */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                        <Link 
                            href={pathname} 
                            locale="es" 
                            className={`transition-opacity ${locale === 'es' ? (isScrolled ? "text-gray-900" : "text-white") : "opacity-40 hover:opacity-100"}`}
                        >
                            ES
                        </Link>
                        <span className="opacity-20">/</span>
                        <Link 
                            href={pathname} 
                            locale="en" 
                            className={`transition-opacity ${locale === 'en' ? (isScrolled ? "text-gray-900" : "text-white") : "opacity-40 hover:opacity-100"}`}
                        >
                            EN
                        </Link>
                    </div>

                    <button className="flex items-center hover:opacity-60 transition-all">
                        <span className={`material-symbols-outlined !text-2xl ${isScrolled ? "text-gray-900" : "text-white"
                            }`}>
                            menu
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}

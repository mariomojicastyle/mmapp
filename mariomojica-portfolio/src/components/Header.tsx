"use client";

import { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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

    // Close menu when clicking a link
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            <header
                className={`fixed top-0 left-0 w-full z-[60] transition-all duration-500 ease-in-out ${isScrolled || isMenuOpen
                    ? "bg-white shadow-xl py-3 text-gray-900"
                    : "bg-[#0088AA] py-4 text-white"
                    }`}
            >
                <div className="container mx-auto px-6 flex items-center justify-between relative h-10">
                    {/* Navigation - Hidden on mobile */}
                    <nav className="hidden lg:flex gap-8 text-[11px] font-black uppercase tracking-[0.2em]">
                        <Link className="hover:opacity-60 transition-all" href="/#portfolio">{t("portfolio")}</Link>
                        <Link className="hover:opacity-60 transition-all" href="/#about">{t("about")}</Link>
                        <Link className="hover:opacity-60 transition-all" href="/#contact">{t("contact")}</Link>
                    </nav>

                    <div className="absolute left-1/2 -translate-x-1/2">
                        <Link
                            className="transition-all duration-500 block"
                            href="/"
                            onClick={closeMenu}
                        >
                            <img
                                src="/Logo_Header.svg"
                                alt="Mario Mojica Logo"
                                className={`h-7 md:h-9 w-auto transition-all duration-500 ${isScrolled || isMenuOpen ? "brightness-100" : "brightness-0 invert"
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
                                className={`transition-opacity ${locale === 'es' ? (isScrolled || isMenuOpen ? "text-gray-900" : "text-white") : "opacity-40 hover:opacity-100"}`}
                            >
                                ES
                            </Link>
                            <span className="opacity-20">/</span>
                            <Link 
                                href={pathname} 
                                locale="en" 
                                className={`transition-opacity ${locale === 'en' ? (isScrolled || isMenuOpen ? "text-gray-900" : "text-white") : "opacity-40 hover:opacity-100"}`}
                            >
                                EN
                            </Link>
                        </div>

                        {/* Hamburger Button - Only visible on mobile */}
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden flex items-center hover:opacity-60 transition-all z-[70]"
                        >
                            <span className={`material-symbols-outlined !text-3xl ${isScrolled || isMenuOpen ? "text-gray-900" : "text-white"}`}>
                                {isMenuOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Dropdown */}
            <div 
                className={`fixed inset-0 bg-white z-[55] transition-transform duration-500 ease-in-out lg:hidden ${
                    isMenuOpen ? "translate-y-0" : "-translate-y-full"
                }`}
            >
                <div className="flex flex-col items-center justify-center h-full gap-12 text-center">
                    <Link 
                        onClick={closeMenu}
                        href="/#portfolio" 
                        className="text-2xl font-black uppercase tracking-[0.2em] text-gray-900 hover:text-[#0088AA] transition-colors"
                    >
                        {t("portfolio")}
                    </Link>
                    <Link 
                        onClick={closeMenu}
                        href="/#about" 
                        className="text-2xl font-black uppercase tracking-[0.2em] text-gray-900 hover:text-[#0088AA] transition-colors"
                    >
                        {t("about")}
                    </Link>
                    <Link 
                        onClick={closeMenu}
                        href="/#contact" 
                        className="text-2xl font-black uppercase tracking-[0.2em] text-gray-900 hover:text-[#0088AA] transition-colors"
                    >
                        {t("contact")}
                    </Link>
                </div>
            </div>
        </>
    );
}


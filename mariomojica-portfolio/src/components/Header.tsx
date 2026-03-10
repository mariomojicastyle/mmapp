"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);

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
                    <Link className="hover:opacity-60 transition-all" href="/#portfolio">Portafolio</Link>
                    <Link className="hover:opacity-60 transition-all" href="/#about">Sobre mí</Link>
                    <Link className="hover:opacity-60 transition-all" href="/#contact">Contacto</Link>
                </nav>

                {/* Brand / Logo */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <Link
                        className={`text-xl md:text-2xl font-black uppercase tracking-tighter transition-all duration-500 ${isScrolled ? "text-[#0088AA]" : "text-white"
                            }`}
                        href="/"
                    >
                        Mario Mojica
                    </Link>
                </div>

                {/* Right side stuff */}
                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold">
                        <span className={isScrolled ? "text-gray-900" : "text-white"}>ES</span>
                        <span className="opacity-20">/</span>
                        <Link className="opacity-40 hover:opacity-100 transition-opacity" href="#">EN</Link>
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

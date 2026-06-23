"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "./LanguageContext";

export default function LiveDemo() {
  const { t } = useLanguage();
  const appArmadoUrl = process.env.NEXT_PUBLIC_APP_ARMADO_URL || 'http://localhost:5173';
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <section id="demo" className="py-24 md:py-32 px-4 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-white text-center mb-4"
        >
          {t("Experimenta el manual interactivo", "Experience the interactive manual")}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          viewport={{ once: true }}
          className="text-text-muted-dark text-lg text-center mb-12"
        >
          {t(
            "Toca, rota y navega. Esto es exactamente lo que verán tus clientes.",
            "Touch, rotate, and navigate. This is exactly what your customers will see."
          )}
        </motion.p>

        {/* Iframe container */}
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border-dark bg-black w-full"
        >
          {/* Maximize/Minimize Button */}
          <button
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 bg-primary/20 hover:bg-primary border-2 border-primary text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 z-10 hover:scale-105 active:scale-95 shadow-lg shadow-primary/40 cursor-pointer"
            title={isFullscreen ? t("Minimizar", "Minimize") : t("Maximizar", "Maximize")}
          >
            <span className="material-symbols-outlined !text-2xl font-bold">
              {isFullscreen ? "fullscreen_exit" : "fullscreen"}
            </span>
          </button>

          <iframe
            src={`${appArmadoUrl}/M00001`}
            className={`w-full block ${isFullscreen ? "h-full min-h-screen" : "aspect-video"}`}
            width="100%"
            allowFullScreen
            allow="xr-spatial-tracking; fullscreen; autoplay; web-share"
            title={t("Manual interactivo 3D — Demo en vivo", "3D Interactive Manual — Live Demo")}
          />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <Link
            href="#contacto"
            className="inline-block bg-primary text-white py-4 px-10 rounded-full font-semibold text-lg hover:brightness-110 transition-all duration-300"
          >
            {t("Solicitar un prototipo con mi mueble", "Request a prototype with my furniture")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

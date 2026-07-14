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
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      // Enviar el estado de fullscreen al iframe para sincronización
      const iframe = containerRef.current?.querySelector("iframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "FULLSCREEN_CHANGE", isFullscreen: isFull }, "*");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Escuchar mensajes del visor 3D para entrar/salir de pantalla completa
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === "MM_MANUAL_INICIAR") {
          if (containerRef.current && !document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch((err) => {
              console.error("Error attempting to enable fullscreen:", err);
            });
          }
        } else if (event.data.type === "MM_MANUAL_MINIMIZAR") {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch((err) => {
              console.error("Error exiting fullscreen:", err);
            });
          }
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Registrar el disparador global para maximizar desde otros componentes
  useEffect(() => {
    (window as any).__triggerLiveDemoFullscreen = () => {
      if (containerRef.current && !document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
        });
      }
    };
    return () => {
      delete (window as any).__triggerLiveDemoFullscreen;
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
          {t("Experimenta el manual interactivo", "Experience the interactive manual", "Experimente o manual interativo")}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          viewport={{ once: true }}
          className="text-text-muted-dark text-lg text-center mb-12"
        >
          {t(
            "Sube el volumen y haz clic en INICIAR",
            "Turn up the volume and click INICIAR",
            "Aumente o volume e clique em INICIAR"
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


          <iframe
            src={`${appArmadoUrl}/M00001`}
            className={`w-full block ${isFullscreen ? "h-full min-h-screen" : "aspect-[16/16.2]"}`}
            width="100%"
            allowFullScreen
            allow="xr-spatial-tracking; fullscreen; autoplay; web-share"
            title={t("Manual interactivo 3D — Demo en vivo", "3D Interactive Manual — Live Demo", "Manual interativo 3D — Demo ao vivo")}
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
            {t("Solicitar un prototipo con tu marca", "Request a prototype with your brand", "Solicitar um protótipo com a sua marca")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

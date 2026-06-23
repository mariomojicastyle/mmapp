"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";

export default function ProductFeatures() {
  const { t } = useLanguage();

  const features = [
    {
      icon: "record_voice_over",
      title: t("Audio Guía Multilingüe (TTS)", "Multilingual Voice Guide (TTS)", "Guia de Áudio Multilíngue (TTS)"),
      description: t(
        "Locución profesional en español e inglés generada por IA. Tu cliente solo escucha y arma, sin necesidad de leer.",
        "Professional AI-generated voiceovers in Spanish and English. Your customer just listens and assembles, no reading required.",
        "Locução profissional gerada por IA. Seu cliente apenas escuta e monta, sem precisar ler."
      ),
    },
    {
      icon: "view_in_ar",
      title: t("Realidad Aumentada Nativa", "Native Augmented Reality", "Realidade Aumentada Nativa"),
      description: t(
        "El cliente proyecta el mueble en su casa desde el navegador. Sin apps, sin descargas, sin fricción.",
        "Customers project the furniture in their room straight from the browser. No apps, no downloads, zero friction.",
        "O cliente projeta o móvel em sua casa direto do navegador. Sem apps, sem downloads, sem atrito."
      ),
    },
    {
      icon: "hardware",
      title: t("Identificador de Herrajes", "Hardware Identifier", "Identificador de Ferragens"),
      description: t(
        "Cada tornillo, perno y bisagra se resalta visualmente con cantidad exacta por paso de armado.",
        "Each screw, bolt, and hinge is highlighted visually with exact quantities per assembly step.",
        "Cada parafuso, pino e dobradiça é destacado visualmente com a quantidade exata por etapa de montagem."
      ),
    },
    {
      icon: "palette",
      title: t("Branding 100% Corporativo", "100% Corporate Branding", "Branding 100% Corporativo"),
      description: t(
        "Tu logo, tus colores, tu identidad. El manual se ve como parte de tu marca, no de la nuestra.",
        "Your logo, your colors, your identity. The manual looks like an extension of your brand, not ours.",
        "Seu logotipo, suas cores, sua identidade. O manual parece parte da sua marca, não da nossa."
      ),
    },
    {
      icon: "qr_code_2",
      title: t("Código QR Autogenerado", "Auto-Generated QR Code", "Código QR Autogerado"),
      description: t(
        "Imprime el QR en la caja del producto. El cliente escanea y accede al manual al instante.",
        "Print the QR code on the product box. Your customer scans it and accesses the manual instantly.",
        "Imprima o QR na caixa do produto. O cliente escaneia e acessa o manual instantaneamente."
      ),
    },
    {
      icon: "light_mode",
      title: t("Escenario 3D Premium (PBR)", "Premium 3D Scene (PBR)", "Cenário 3D Premium (PBR)"),
      description: t(
        "Texturas fotorrealistas de piso y paredes con iluminación calibrada profesionalmente.",
        "Photorealistic floor and wall textures with professionally calibrated studio lighting.",
        "Texturas fotorrealistas de piso e paredes com iluminação calibrada profissionalmente."
      ),
    },
  ];

  return (
    <section
      id="caracteristicas"
      className="py-24 px-4 bg-background-light dark:bg-background-dark"
    >
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl font-bold mb-4 text-text-light dark:text-text-dark"
        >
          {t("Todo lo que necesitas en un solo manual", "Everything you need in a single manual", "Tudo o que você precisa em um único manual")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          viewport={{ once: true }}
          className="text-text-muted-light dark:text-text-muted-dark text-lg max-w-3xl mx-auto"
        >
          {t(
            "Cada detalle pensado para reducir fricción y elevar la experiencia del cliente final.",
            "Every single detail designed to reduce friction and elevate the end-customer experience.",
            "Cada detalhe pensado para reduzir o atrito e elevar a experiência do cliente final."
          )}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <motion.div
            key={feature.icon}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="bg-surface-light dark:bg-surface-dark rounded-2xl p-8 border border-border-light dark:border-border-dark hover:border-primary/50 transition-all duration-300 group"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">
                {feature.icon}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-text-light dark:text-text-dark">
              {feature.title}
            </h3>
            <p className="text-text-muted-light dark:text-text-muted-dark text-sm leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

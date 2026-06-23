'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from './LanguageContext';

export default function ClientPortal() {
  const { t } = useLanguage();

  const features = [
    {
      icon: 'palette',
      text: t('Personaliza colores, logotipos, textos de ayuda y faviconos desde tu panel.', 'Customize colors, logos, help texts, and favicons from your panel.', 'Personalize cores, logotipos, textos de ajuda e favicons a partir do seu painel.'),
    },
    {
      icon: 'visibility',
      text: t('Visualiza la previsualización en vivo de tus manuales antes de publicar.', 'View the live preview of your manuals before publishing.', 'Veja a pré-visualização ao vivo dos seus manuais antes de publicar.'),
    },
    {
      icon: 'download',
      text: t('Descarga códigos QR e informes de métricas para tus comités de calidad.', 'Download QR codes and metrics reports for your quality committees.', 'Baixe códigos QR e relatórios de métricas para seus comitês de qualidade.'),
    },
    {
      icon: 'forum',
      text: t('Comunicación fluida y centralizada. Solicita modificaciones técnicas desde la plataforma.', 'Fluid and centralized communication. Request technical changes from the platform.', 'Comunicação fluida e centralizada. Solicite modificações técnicas direto da plataforma.'),
    },
  ];

  return (
    <section className="py-24 px-4 bg-background-light dark:bg-background-dark">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* LEFT COLUMN — Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-border-dark shadow-2xl relative overflow-hidden">
            {/* Window controls */}
            <div className="flex items-center gap-2 mb-6">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
            </div>

            <div className="flex gap-4">
              {/* Sidebar mock */}
              <div className="bg-surface-dark w-12 rounded-xl flex flex-col items-center gap-4 py-4 shrink-0">
                <span className="material-symbols-outlined text-text-muted-dark text-lg">dashboard</span>
                <span className="material-symbols-outlined text-text-muted-dark text-lg">settings</span>
                <span className="material-symbols-outlined text-text-muted-dark text-lg">analytics</span>
                <span className="material-symbols-outlined text-text-muted-dark text-lg">help</span>
              </div>

              {/* Main area */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1 — Identidad Visual */}
                <div className="bg-surface-dark rounded-xl p-4">
                  <span className="material-symbols-outlined text-primary text-2xl mb-2 block">palette</span>
                  <p className="text-text-dark text-sm font-semibold mb-3">{t("Identidad Visual", "Visual Identity", "Identidade Visual")}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary" />
                    <span className="w-6 h-6 rounded-full bg-purple-500" />
                    <span className="w-6 h-6 rounded-full bg-orange-500" />
                  </div>
                </div>

                {/* Card 2 — Códigos QR */}
                <div className="bg-surface-dark rounded-xl p-4">
                  <span className="material-symbols-outlined text-primary text-2xl mb-2 block">qr_code_2</span>
                  <p className="text-text-dark text-sm font-semibold mb-3">{t("Códigos QR", "QR Codes", "Códigos QR")}</p>
                  <div className="border-2 border-dashed border-border-dark w-16 h-16 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-text-muted-dark text-3xl">qr_code</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN — Text */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        >
          <span className="text-primary text-xs uppercase tracking-widest font-bold mb-4 block">
            {t("Portal Exclusivo B2B", "Exclusive B2B Portal", "Portal Exclusivo B2B")}
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-text-light dark:text-text-dark">
            {t("Tu catálogo bajo control absoluto", "Your Catalog Under Absolute Control", "Seu Catálogo Sob Controle Absoluto")}
          </h2>

          <div className="space-y-1">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-4 mb-5"
              >
                <span className="material-symbols-outlined text-primary text-2xl mt-0.5 shrink-0">
                  {feature.icon}
                </span>
                <p className="text-text-muted-light dark:text-text-muted-dark text-sm leading-relaxed">
                  {feature.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

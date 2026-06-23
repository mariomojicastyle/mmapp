"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";

export default function PainVsSolution() {
  const { t } = useLanguage();

  const painPoints = [
    {
      icon: "close",
      text: t("Manuales impresos confusos e imposibles de seguir", "Confusing and impossible-to-follow printed manuals", "Manuais impressos confusos e impossíveis de seguir"),
    },
    {
      icon: "close",
      text: t("Herrajes imposibles de distinguir entre sí", "Hardware pieces impossible to distinguish from one another", "Ferragens impossíveis de distinguir entre si"),
    },
    {
      icon: "close",
      text: t("Sin feedback del cliente final sobre el proceso", "No end-customer feedback on the assembly process", "Sem feedback do cliente final sobre o processo"),
    },
    {
      icon: "close",
      text: t("Soporte telefónico saturado por dudas de armado", "Phone support overwhelmed by assembly questions", "Suporte telefônico saturado por dúvidas de montagem"),
    },
  ];

  const solutionPoints = [
    {
      icon: "check_circle",
      text: t("Guía 3D rotativa paso a paso con animaciones", "Interactive step-by-step 3D guides with animations", "Guia 3D rotativo passo a passo com animações"),
    },
    {
      icon: "check_circle",
      text: t("Resaltado interactivo de cada herraje por toque", "Interactive highlighting of each hardware piece on tap", "Destaque interativo de cada ferragem ao toque"),
    },
    {
      icon: "check_circle",
      text: t("Analíticas y reseñas automatizadas por mueble", "Automated analytics and reviews per furniture product", "Análises e avaliações automatizadas por móvel"),
    },
    {
      icon: "check_circle",
      text: t("Asistente de voz multilingüe integrado (TTS)", "Integrated multilingual voice assistant (TTS)", "Assistente de voz multilíngue integrado (TTS)"),
    },
  ];

  return (
    <section className="py-24 px-4 bg-background-light dark:bg-background-dark">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16 text-text-light dark:text-text-dark"
        >
          {t("Manual de papel vs. Manual Interactivo 3D", "Paper Manual vs. Interactive 3D Manual", "Manual de papel vs. Manual Interativo 3D")}
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN — El Problema */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true }}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8"
          >
            <h3 className="text-xl font-semibold text-red-500 mb-8">
              <span className="material-symbols-outlined align-middle mr-2 text-red-500">
                warning
              </span>
              {t("El Problema", "The Problem", "O Problema")}
            </h3>

            <div className="space-y-6">
              {painPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-500 text-xl">
                      {point.icon}
                    </span>
                  </div>
                  <p className="text-red-500 pt-2 leading-snug">
                    {point.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT COLUMN — La Solución */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-8"
          >
            <h3 className="text-xl font-semibold text-primary mb-8">
              <span className="material-symbols-outlined align-middle mr-2 text-primary">
                lightbulb
              </span>
              {t("La Solución", "The Solution", "A Solução")}
            </h3>

            <div className="space-y-6">
              {solutionPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">
                      {point.icon}
                    </span>
                  </div>
                  <p className="text-primary pt-2 leading-snug">
                    {point.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

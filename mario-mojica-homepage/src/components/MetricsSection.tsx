"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";

export default function MetricsSection() {
  const { t } = useLanguage();

  const bullets = [
    {
      icon: "filter_alt",
      title: t("Embudo de Retención", "Retention Funnel", "Funil de Retenção"),
      description: t(
        "Identifica en qué paso exacto abandonan tus clientes. ¿El paso 8 tiene 32 abandonos? Audita ese herraje antes de que genere más devoluciones.",
        "Identify exactly at which step your customers drop off. Does step 8 have 32 drop-offs? Audit that hardware piece before it causes more returns.",
        "Identifique exatamente em qual etapa seus clientes abandonam. A etapa 8 tem 32 abandonos? Audite essa ferragem antes que gere mais devoluções."
      ),
    },
    {
      icon: "monitoring",
      title: t("Tasa de Finalización", "Completion Rate", "Taxa de Conclusão"),
      description: t(
        "Monitorea qué porcentaje de tus clientes termina de armar el mueble con éxito.",
        "Monitor what percentage of your customers successfully finish assembling the furniture.",
        "Monitore qual porcentagem de seus clientes termina de montar o móvel com sucesso."
      ),
    },
    {
      icon: "sentiment_satisfied",
      title: t("Análisis de Sentimiento", "Sentiment Analysis", "Análise de Sentimento"),
      description: t(
        "Lee las opiniones reales de tus compradores clasificadas por sentimiento positivo, neutral y negativo.",
        "Read real buyer reviews classified by positive, neutral, and negative sentiment.",
        "Leia as opiniões reais dos seus compradores classificadas por sentimento positivo, neutro e negativo."
      ),
    },
    {
      icon: "devices",
      title: t("Distribución por Dispositivo", "Device Distribution", "Distribuição por Dispositivo"),
      description: t(
        "Conoce si tus clientes usan celular o computadora para optimizar la experiencia.",
        "Find out whether your customers use mobile phones or computers to optimize the experience.",
        "Descubra se seus clientes usam celular ou computador para otimizar a experiência."
      ),
    },
  ];

  const metrics = [
    {
      label: t("Tasa de Finalización", "Completion Rate", "Taxa de Conclusão"),
      value: "82%",
      color: "text-primary",
      barColor: "bg-primary",
      barWidth: "w-4/5",
    },
    {
      label: t("Abandonos Paso 8", "Step 8 Drop-offs", "Abandonos Etapa 8"),
      value: "32",
      color: "text-red-400",
      barColor: "bg-red-400",
      barWidth: "w-2/5",
    },
    {
      label: t("Sentimiento Positivo", "Positive Sentiment", "Sentimento Positivo"),
      value: "74%",
      color: "text-emerald-400",
      barColor: "bg-emerald-400",
      barWidth: "w-3/4",
    },
  ];

  return (
    <section className="py-24 px-4 bg-surface-light dark:bg-surface-dark border-y border-border-light dark:border-border-dark">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
        {/* LEFT COLUMN */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="text-primary text-xs uppercase tracking-widest font-bold mb-4 inline-block">
            {t("Diferenciador Clave", "Key Differentiator", "Diferencial Chave")}
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-text-light dark:text-text-dark">
            {t("Toma decisiones basadas en datos reales de tus clientes", "Make decisions based on real data from your customers", "Tome decisões com base em dados reais dos seus clientes")}
          </h2>

          <div className="space-y-6">
            {bullets.map((bullet, index) => (
              <motion.div
                key={bullet.icon}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {bullet.icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-text-light dark:text-text-dark">
                    {bullet.title}
                  </h3>
                  <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                    {bullet.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT COLUMN — Report Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          viewport={{ once: true }}
        >
          <div className="bg-background-dark rounded-2xl p-8 border border-border-dark shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-sm text-text-muted-dark">
                {t("Reporte Ejecutivo • Junio 2026", "Executive Report • June 2026", "Relatório Executivo • Junho 2026")}
              </span>
            </div>

            {/* Metric Mini-Cards */}
            <div className="grid grid-cols-1 gap-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="bg-surface-dark rounded-xl p-4"
                >
                  <p className="text-xs text-text-muted-dark mb-1">
                    {metric.label}
                  </p>
                  <p className={`text-2xl font-bold ${metric.color} mb-2`}>
                    {metric.value}
                  </p>
                  <div className="w-full h-1.5 bg-border-dark rounded-full">
                    <div
                      className={`${metric.barWidth} h-1.5 ${metric.barColor} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-text-muted-dark italic">
              {t("Vista previa del reporte PDF automatizado", "Preview of the automated PDF report", "Pré-visualização do relatório PDF automatizado")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

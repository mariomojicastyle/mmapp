'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { useLanguage } from './LanguageContext';

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function SocialProof() {
  const { t } = useLanguage();

  const stats = [
    { icon: 'trending_down', value: '-60%', label: t('Reducción de reclamos por armado', 'Reduction in assembly claims', 'Redução de reclamações por montagem') },
    { icon: 'phone_disabled', value: '-45%', label: t('Llamadas a soporte evitadas', 'Avoided support calls', 'Chamadas de suporte evitadas') },
    { icon: 'task_alt', value: '82%', label: t('Tasa de finalización de armado', 'Assembly completion rate', 'Taxa de conclusão de montagem') },
    { icon: 'sentiment_very_satisfied', value: '71.9%', label: t('Experiencia y opiniones positivas', 'Positive experience and feedback', 'Experiência e avaliações positivas') },
  ];

  return (
    <section className="bg-surface-light dark:bg-surface-dark border-y border-border-light dark:border-border-dark py-16 px-4">
      <motion.div
        className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.icon}
            variants={itemVariants}
            className="flex flex-col items-center text-center gap-3"
          >
            {/* Icon Circle */}
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">
                {stat.icon}
              </span>
            </div>

            {/* Value */}
            <span className="text-4xl font-bold text-primary">
              {stat.value}
            </span>

            {/* Label */}
            <span className="text-sm text-text-muted-light dark:text-text-muted-dark leading-snug">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

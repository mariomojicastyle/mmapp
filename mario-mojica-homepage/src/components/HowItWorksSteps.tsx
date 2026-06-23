'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from './LanguageContext';

export default function HowItWorksSteps() {
  const { t } = useLanguage();

  const steps = [
    {
      num: '1',
      title: t('Envíanos tu mueble', 'Send us your furniture details', 'Envie-nos os detalhes do seu móvel'),
      desc: t(
        'Modelos 3D (3dm, stp, obj, fbx, dwg), planos (pdf) y fotos de referencia para validar acabados y colores.',
        '3D models (3dm, stp, obj, fbx, dwg), blueprints (pdf), and reference photos to validate finishes and colors.',
        'Modelos 3D (3dm, stp, obj, fbx, dwg), plantas (pdf) e fotos de referência para validar acabamentos e cores.'
      ),
    },
    {
      num: '2',
      title: t('Nosotros lo transformamos', 'We transform it', 'Nós o transformamos'),
      desc: t(
        'Creamos el modelo 3D optimizado, configuramos el audio guía y calibramos la iluminación PBR.',
        'We create the optimized 3D model, configure the voice assistant, and calibrate the PBR lighting.',
        'Criamos o modelo 3D otimizado, configuramos o guia de voz e calibramos a iluminação PBR.'
      ),
    },
    {
      num: '3',
      title: t('Imprime tu QR y listo', 'Print your QR & start', 'Imprima seu QR e pronto'),
      desc: t(
        'Descarga el código QR desde tu portal, imprímelo en la caja y tus clientes acceden al instante.',
        'Download the QR code from your dashboard, print it on the product box, and your customers access it instantly.',
        'Baixe o código QR do seu portal, imprima-o na caixa e seus clientes acessam instantaneamente.'
      ),
    },
  ];

  return (
    <section className="py-24 px-4 bg-surface-light dark:bg-surface-dark border-y border-border-light dark:border-border-dark">
      <div className="container mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-4 text-text-light dark:text-text-dark"
        >
          {t('Integra el manual en 3 simples pasos', 'Integrate the manual in 3 simple steps', 'Integre o manual em 3 passos simples')}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-text-muted-light dark:text-text-muted-dark text-lg text-center mb-16"
        >
          {t('Sin complicaciones técnicas. Nosotros nos encargamos de todo.', 'No technical complications. We handle everything.', 'Sem complicações técnicas. Nós cuidamos de tudo.')}
        </motion.p>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting dashed line (desktop only) */}
          <div className="hidden md:block absolute top-8 left-1/6 right-1/6 border-t-2 border-dashed border-border-dark z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-center mb-3 text-text-light dark:text-text-dark">
                  {step.title}
                </h3>
                <p className="text-text-muted-light dark:text-text-muted-dark text-sm text-center leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

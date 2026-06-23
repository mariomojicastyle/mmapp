'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from './LanguageContext';

export default function FAQ() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3003';

  const faqs = [
    {
      q: t('¿Cómo se integra el manual en mi sitio web?', 'How is the manual integrated into my website?'),
      a: t(
        'Un simple iframe o código QR. No requiere desarrollo técnico de tu parte. El manual se aloja en nuestros servidores con CDN global.',
        'A simple iframe or QR code. No technical development required on your part. The manual is hosted on our servers with a global CDN.'
      ),
    },
    {
      q: t('¿Qué archivos necesito entregar?', 'What files do I need to provide?'),
      a: t(
        'Modelos 3D (3dm, stp, obj, fbx, dwg), planos (pdf) y fotos de referencia para validar acabados y colores.',
        '3D models (3dm, stp, obj, fbx, dwg), blueprints (pdf), and reference photos to validate finishes and colors.'
      ),
    },
    {
      q: t('¿Cuánto tiempo toma crear un manual?', 'How long does it take to create a manual?'),
      a: t(
        'Entre 5 y 10 días hábiles dependiendo de la complejidad del mueble y la cantidad de pasos de armado.',
        'Between 5 and 10 business days depending on the complexity of the furniture and the number of assembly steps.'
      ),
    },
    {
      q: t('¿En qué dispositivos funciona?', 'Which devices are supported?'),
      a: t(
        'En cualquier smartphone, tablet o computadora con un navegador web moderno. No requiere instalar aplicaciones ni realizar descargas.',
        'On any smartphone, tablet, or computer with a modern web browser. No app installations or downloads required.'
      ),
    },
    {
      q: t('¿Cómo garantizan la confidencialidad y la propiedad intelectual de mis diseños?', 'How do you guarantee the confidentiality and intellectual property of my designs?'),
      a: t(
        'Firmamos un Acuerdo de Confidencialidad (NDA) vinculante antes de recibir tus archivos. Respetamos rigurosamente la propiedad industrial de todos los planos y modelos 3D que nos entregas; toda la información técnica sigue perteneciendo 100% a tu empresa.',
        'We sign a binding Non-Disclosure Agreement (NDA) before receiving your files. We strictly respect the industrial property of all blueprints and 3D models you submit; all technical information remains 100% owned by your company.'
      ),
    },
    {
      q: t('¿Puedo personalizar los colores con mi marca?', 'Can I customize the colors with my brand?'),
      a: (
        <>
          {t('Absolutamente. Desde tu ', 'Absolutely. From your ')}
          <Link href={`${platformUrl}/login`} className="text-primary hover:underline font-semibold">
            {t('portal B2B', 'B2B portal')}
          </Link>{' '}
          {t(
            'puedes cambiar colores corporativos, logos, textos de ayuda, faviconos e idiomas de forma autónoma.',
            'you can autonomously change corporate colors, logos, help texts, favicons, and languages.'
          )}
        </>
      ),
    },
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 px-4 bg-background-light dark:bg-background-dark">
      <div className="container mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16 text-text-light dark:text-text-dark"
        >
          {t('Preguntas Frecuentes', 'Frequently Asked Questions')}
        </motion.h2>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="border-b border-border-light dark:border-border-dark"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full py-6 flex items-center justify-between text-left cursor-pointer"
              >
                <span className="text-lg font-semibold text-text-light dark:text-text-dark pr-4">
                  {faq.q}
                </span>
                <span
                  className={`material-symbols-outlined text-text-muted-light dark:text-text-muted-dark transition-transform duration-300 shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index
                    ? 'max-h-40 opacity-100 pb-6'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="text-text-muted-light dark:text-text-muted-dark leading-relaxed">
                  {faq.a}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

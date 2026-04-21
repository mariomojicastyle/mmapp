'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Renders Fotorrealistas 4K',
    description: 'Elimina las costosas sesiones fotográficas. Genera infinitas imágenes de estilo de vida y fondos blancos para tu vitrina online.',
    link: '#renders',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYfTmk9de54GD5sF4c_WFR8ZczkXrNOS5jSdMK3j2sl8J63gjTiEhiNFZjQUrj0XtXtsVqFB18D9Mkrx87sSI81EibdOfco6_tjVylTTrmYcy3rLTBCOr_tK0W-z2J1Uq16r2pODB6rqKTAy7Phh-kn9pXHUuEMGIHDCPmTeWgj-1NkZ1d_7j4cBE8dlKB2dYGmhv1YwOh4omOYzreCqNL7PviMNzL3kFnKHAE5jTTC6sE35vvvkGY8vemXDE47WjUkAxN8tqsbQk'
  },
  {
    title: 'Videos de Producto',
    description: 'Crea animaciones fluidas mostrando funcionalidades, aperturas de cajones, despliegue de sofás cama o rotaciones 360° para enriquecer tus páginas de producto y redes sociales.',
    link: '#videos',
    isVideo: true,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKdmhepECZ48ZLhwuiVB9fiYGWBARh2SkcoITTuE7U4ozhKOJPPn159u4RrL4M3FRAwW8OQ4yyLQWvzv5dhD1z-WEH918TaiQRMgTDL-qElC0ADBycudMcTj1uOXyxyTV0Vkr3fzIpBIrI753EjOZUtwT43sqVxV8kfl7QXoaEIYY7QuewJnD55D2azPAMnUMKNBfn_SPj7G4TVTD5MSMJX0VW5rd-MTLxFH-bjv3dVNItZu4KF7dONZIBZXX3hLGLQUksrkLR2GU'
  },
  {
    title: 'Realidad Aumentada Web (WebAR)',
    description: 'Permite a tus clientes ver tus muebles a escala real en sus propias casas directamente desde el navegador de su teléfono, sin necesidad de descargar ninguna aplicación.',
    link: '#ar',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAMXFhDRRLCvOU3qexXLyjEc5WuK078hS3AvPSGUWKxwrhLA3f-pjS1k_mPIgpgbaZBu5M9n98wHgmU4MHj8aXkYdonU-0rNFCF_MDnn4fIPn5g5e0w1JnJekdX0wU2ZPaMICTxznvEUky4MjnvTxOb8JUf_bFlwrZ59b60UkmHlNch7F_v2_JUq5vOdnbmTegecy6QGXzzNLBfKRW3wLMJQFomZwxR0tJkZanRXUarvqp73YpHpFWY_OHrfy74dmGS9bshRihhF4'
  },
  {
    title: 'Manual de Armado en 3D',
    description: 'Maximiza la experiencia del usuario con la herramienta de armado más sofisticada del mercado, reduce las reclamaciones por armado incorrecto y fideliza al cliente para futuras compras.',
    link: '#manuales',
    icon: '3d_rotation'
  },
  {
    title: 'Planos de Fabricación Automáticos',
    description: 'Dile adiós al dibujo manual. Genera automáticamente vistas en planta, alzados, despieces, lista de cortes (Cutlist) y maquinados exactos listos para pasar a producción.',
    link: '#planos',
    icon: 'architecture'
  },
  {
    title: 'Archivos para CNC e Industria 4.0',
    description: 'Exporta directamente los archivos necesarios para tus máquinas CNC, seccionadoras, y taladros. Código máquina perfecto generado a partir del diseño original.',
    link: '#cnc',
    icon: 'memory'
  }
];

export default function DetailedFeatures() {
  return (
    <section className="py-24 px-4 bg-background-light dark:bg-background-dark text-center">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-4xl font-bold mb-16">Características principales</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-left group cursor-pointer"
            >
              <div className="rounded-2xl overflow-hidden border border-border-light dark:border-border-dark mb-6 bg-surface-light dark:bg-surface-dark h-64 relative flex items-center justify-center">
                {feature.image ? (
                  <>
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {feature.isVideo && (
                      <span className="material-symbols-outlined absolute text-white text-6xl drop-shadow-lg">play_circle</span>
                    )}
                  </>
                ) : (
                  <span className="material-symbols-outlined text-8xl text-primary opacity-50 transition-transform duration-500 group-hover:scale-110">{feature.icon}</span>
                )}
              </div>
              
              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-text-muted-light dark:text-text-muted-dark mb-4 h-24 line-clamp-3">
                {feature.description}
              </p>
              
              <Link href={feature.link} className="text-primary font-bold flex items-center gap-1 group-hover:underline">
                Descubrir más <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

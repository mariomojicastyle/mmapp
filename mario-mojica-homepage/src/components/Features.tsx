"use client";

import React from "react";
import { motion } from "framer-motion";
import { UploadCloud, Settings2, Share2, MousePointer2 } from "lucide-react";

const steps = [
  {
    icon: <UploadCloud className="w-8 h-8" />,
    title: "Carga tus modelos",
    description: "Sube tus archivos GLB, OBJ o FBX. Nuestro motor optimiza automáticamente cada detalle para web y móvil.",
    color: "bg-blue-500/10 text-blue-500"
  },
  {
    icon: <Settings2 className="w-8 h-8" />,
    title: "Gestiona y Personaliza",
    description: "Configura materiales, luces y hotspots interactivos desde un panel intuitivo. Sin código.",
    color: "bg-purple-500/10 text-purple-500"
  },
  {
    icon: <Share2 className="w-8 h-8" />,
    title: "Distribución Masiva",
    description: "Integra en tu E-commerce, envía por WhatsApp o genera QRs para tiendas físicas en segundos.",
    color: "bg-orange-500/10 text-orange-500"
  }
];

export default function Features() {
  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-900/30 border-y border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          De la idea a la <span className="text-zinc-500 text-glow">experiencia AR</span> <br className="hidden md:block" /> en tres simples pasos.
        </h2>
        <p className="text-zinc-500 max-w-2xl mx-auto">
          Hemos simplificado la complejidad del 3D para que puedas enfocarte en lo que importa: vender más.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            viewport={{ once: true }}
            className="group relative p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-2xl hover:shadow-zinc-500/10 transition-all duration-500"
          >
            <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              {step.icon}
            </div>
            <h3 className="text-xl font-bold mb-4">{step.title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              {step.description}
            </p>
            
            <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MousePointer2 className="w-5 h-5 text-zinc-300" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

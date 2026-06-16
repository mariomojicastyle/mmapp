"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";

export default function ProblemSolution() {
  const points = [
    {
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      title: "Fotos estáticas",
      description: "Generan dudas, devoluciones y una tasa de conversión limitada.",
      type: "problem"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      title: "Experiencia 3D",
      description: "El 70% de los clientes prefieren interactuar con el producto antes de comprar.",
      type: "solution"
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
      title: "Confianza con AR",
      description: "El 90% de los usuarios se sienten más seguros comprando cuando pueden ver el producto en su espacio.",
      type: "solution"
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              El mundo está cambiando. <br />
              <span className="text-zinc-500">Tus clientes también.</span>
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Ya no es suficiente con mostrar una imagen. Hoy, la venta se gana a través de la interactividad y la confianza visual. Mario Mojica te da las herramientas para liderar esta transformación.
            </p>

            <div className="space-y-4 pt-4">
              {points.map((point, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-4 rounded-2xl border ${point.type === "problem" ? "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30" : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800"}`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1">{point.icon}</div>
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wider">{point.title}</h4>
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">{point.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-8">
              {/* Representación visual de solución vs problema */}
              <div className="relative w-full h-full">
                <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-4 animate-float">
                   <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                   </div>
                   <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">+250%</div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">ROI de Marketing</div>
                   </div>
                </div>
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-zinc-200 dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-400 dark:border-zinc-700 flex items-center justify-center opacity-50 grayscale">
                   <div className="text-center">
                      <div className="text-lg font-bold">Estático</div>
                   </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

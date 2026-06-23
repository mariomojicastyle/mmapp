"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"

export default function PrivacyPage() {
  const [lang, setLang] = useState<"es" | "en">("es")

  useEffect(() => {
    const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || "es"
    if (browserLang.toLowerCase().startsWith("es")) {
      setLang("es")
    } else {
      setLang("en")
    }
  }, [])

  const t = {
    es: {
      back: "Volver al acceso",
      title: "Política de Privacidad Global",
      subtitle: "Última actualización: 19 de Junio de 2026",
      intro: "Esta Política de Privacidad describe cómo Mario Mojica recopila, utiliza, procesa y protege la información obtenida a través de nuestros visores interactivos 3D, Realidad Aumentada (AR), herramientas de telemetría de ensamble y servicios relacionados, tanto en nuestro sitio web como en las plataformas e-commerce de nuestros clientes asociados (distribuidores y marcas de mobiliario).",
      sections: [
        {
          title: "1. Información que Recopilamos",
          content: "Recopilamos datos técnicos y de comportamiento de interacción directamente desde nuestros visores interactivos 3D y manuales de armado integrados en las tiendas online asociadas. Esto incluye: eventos del visor (rotaciones 360°, zoom, aperturas de componentes, clics de ayuda, tiempo invertido por paso), información técnica del dispositivo (compatibilidad WebGL, resolución de pantalla, sistema operativo) y cookies técnicas necesarias para recordar variaciones de producto o configuraciones del visor 3D."
        },
        {
          title: "2. Rol como Procesador y Controlador de Datos",
          content: "Cuando interactúas con un visor 3D o manual de armado de Mario Mojica en el sitio web de un distribuidor de muebles asociado, dicho distribuidor actúa como el Controlador de Datos, y nosotros actuamos como el Procesador de Datos en su nombre. Los datos analíticos de telemetría se comparten de forma confidencial con la marca correspondiente con el fin exclusivo de mejorar el diseño de sus productos y la claridad del proceso de ensamble."
        },
        {
          title: "3. Uso de la Información",
          content: "Utilizamos la información recopilada para: proveer el correcto renderizado y visualización 3D/AR en tiempo real de acuerdo a la capacidad de hardware del usuario; generar informes analíticos de usabilidad y tasas de completitud de armado de muebles para los fabricantes; optimizar el rendimiento técnico del software y reducir fricciones durante el proceso de ensamble final."
        },
        {
          title: "4. Cookies y Almacenamiento Local",
          content: "Utilizamos almacenamiento local del navegador (como localStorage y cookies técnicas esenciales) para optimizar el rendimiento de la GPU mediante el almacenamiento en caché de elementos 3D complejos y para guardar las preferencias del usuario (por ejemplo, el idioma seleccionado o la última variación de tapicería visualizada)."
        },
        {
          title: "5. Derechos del Usuario",
          content: "Conforme a regulaciones internacionales (como GDPR y normativas locales de protección de datos), tienes derecho a acceder, rectificar, limitar o solicitar la eliminación de tu información personal. Si interactuaste con nuestros servicios a través del sitio web de un distribuidor asociado, te sugerimos contactar directamente a dicha marca, ya que actúan como Controladores de Datos."
        }
      ]
    },
    en: {
      back: "Back to login",
      title: "Global Privacy Policy",
      subtitle: "Last updated: June 19, 2026",
      intro: "This Privacy Policy describes how Mario Mojica collects, uses, processes, and protects information obtained through our interactive 3D viewers, Web Augmented Reality (WebAR), assembly telemetry tools, and related services, both on our website and on the e-commerce platforms of our associated retail partners.",
      sections: [
        {
          title: "1. Information We Collect",
          content: "We collect technical and behavioral interaction data directly from our interactive 3D viewers and assembly manuals embedded in partner online stores. This includes: viewer events (360° rotations, zoom, component openings, help clicks, time spent per step), device technical info (WebGL compatibility, screen resolution, operating system), and technical cookies necessary to remember product variations or 3D viewer settings."
        },
        {
          title: "2. Role as Processor and Controller of Data",
          content: "When you interact with a Mario Mojica 3D viewer or assembly manual on an associated furniture retailer's website, that retailer acts as the Data Controller, and we act as the Data Processor on their behalf. The telemetry analytics data is shared confidentially with the respective brand for the sole purpose of improving product design and the clarity of the assembly process."
        },
        {
          title: "3. How We Use Information",
          content: "We use the collected information to: provide correct real-time 3D/AR rendering based on user hardware capabilities; generate usability analytical reports and assembly completion rates for manufacturers; and optimize software technical performance to reduce friction during the end-assembly process."
        },
        {
          title: "4. Cookies and Local Storage",
          content: "We use browser local storage (such as localStorage and essential technical cookies) to optimize GPU performance by caching complex 3D assets and saving user preferences (e.g., selected language or the last viewed upholstery variant)."
        },
        {
          title: "5. User Rights",
          content: "According to international regulations (such as GDPR and local data protection laws), you have the right to access, rectify, restrict, or request the deletion of your personal information. If you interacted with our services through a partner retailer's website, we recommend contacting that brand directly, as they act as the Data Controllers."
        }
      ]
    }
  }[lang]

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 py-12 px-6 lg:px-24">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8 lg:p-12">
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = "/login";
            }
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0088AA] hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </a>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-[#0088AA]" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t.title}</h1>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">{t.subtitle}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-100/80 rounded-xl p-4 mb-8 font-medium">
          {t.intro}
        </p>
        
        <div className="space-y-8">
          {t.sections.map((sec, idx) => (
            <section key={idx} className="border-b border-slate-50 pb-6 last:border-0 last:pb-0">
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                  {idx + 1}
                </span>
                {sec.title}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 pl-8">
                {sec.content}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

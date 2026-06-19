"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"

export default function TermsPage() {
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
      title: "Términos de Servicio Globales",
      subtitle: "Última actualización: 19 de Junio de 2026",
      intro: "Al registrarse, acceder o interactuar con nuestros visores 3D, tecnología de Realidad Aumentada (AR), manuales de armado interactivo o la plataforma analítica de Mario Mojica, usted acepta regirse por los presentes Términos de Servicio. Si no está de acuerdo, le solicitamos abstenerse de utilizar nuestras herramientas.",
      sections: [
        {
          title: "1. Licencia de Uso Limitada",
          content: "Mario Mojica otorga a las marcas asociadas, distribuidores y usuarios finales una licencia limitada, no exclusiva, revocable y no transferible para cargar y visualizar modelos 3D, texturas e instructivos de armado interactivos. Queda estrictamente prohibido aplicar ingeniería inversa, extraer los archivos de modelos GLB/gLTF o texturas, o reproducir las animaciones 3D fuera de los visores oficiales proporcionados por la plataforma."
        },
        {
          title: "2. Requisitos Técnicos y Rendimiento",
          content: "Nuestros visores interactivos utilizan tecnología WebGL de aceleración de gráficos por hardware en el navegador. La calidad, fluidez y respuesta del visor 3D y de los flujos de Realidad Aumentada dependen directamente de la GPU y capacidades técnicas del dispositivo del usuario. Mario Mojica no es responsable de incompatibilidades de hardware o del consumo de datos móviles al descargar activos 3D de alta densidad."
        },
        {
          title: "3. Recopilación de Telemetría de Armado",
          content: "Al utilizar el visor de manuales de armado 3D interactivo, el sistema registra eventos de interacción (tasa de éxito de armado, pasos pausados, uso del botón de ayuda y tiempos de finalización). El usuario acepta el procesamiento de este comportamiento técnico anónimo y su transferencia exclusiva a la marca o fabricante del mueble con el fin de optimizar el producto físico y el manual."
        },
        {
          title: "4. Propiedad Intelectual",
          content: "Todos los derechos de propiedad intelectual del software, el motor de renderizado WebGL, el código del visor interactivo 3D, las marcas y la tecnología de telemetría pertenecen exclusivamente a Mario Mojica. Los derechos sobre los diseños de los muebles y las marcas comerciales asociadas pertenecen a sus respectivos fabricantes o distribuidores autorizados."
        },
        {
          title: "5. Limitación de Responsabilidad",
          content: "Mario Mojica se esfuerza por mantener una precisión matemática en los despieces, planos de fabricación e instructivos interactivos. Sin embargo, no nos hacemos responsables de daños indirectos, incidentes de ensamble incorrecto en el hogar del cliente, o pérdidas de material derivadas del uso de la documentación generada por la plataforma."
        }
      ]
    },
    en: {
      back: "Back to login",
      title: "Global Terms of Service",
      subtitle: "Last updated: June 19, 2026",
      intro: "By registering, accessing, or interacting with our 3D viewers, Augmented Reality (AR) technology, interactive assembly manuals, or Mario Mojica's analytics platform, you agree to be bound by these Terms of Service. If you do not agree, please refrain from using our tools.",
      sections: [
        {
          title: "1. Limited Use License",
          content: "Mario Mojica grants associated brands, distributors, and end-users a limited, non-exclusive, revocable, and non-transferable license to load and display 3D models, textures, and interactive assembly instructions. It is strictly forbidden to reverse engineer, extract GLB/gLTF model files or textures, or reproduce the 3D animations outside of the official viewers provided by the platform."
        },
        {
          title: "2. Technical Requirements and Performance",
          content: "Our interactive viewers use WebGL technology for hardware-accelerated graphics in the browser. The quality, smoothness, and response of the 3D viewer and Augmented Reality flows directly depend on the GPU and technical capabilities of the user's device. Mario Mojica is not responsible for hardware incompatibilities or mobile data usage when downloading high-density 3D assets."
        },
        {
          title: "3. Assembly Telemetry Collection",
          content: "By using the interactive 3D assembly manual viewer, the system records interaction events (assembly success rate, paused steps, use of the help button, and completion times). The user consents to the processing of this anonymous technical behavior and its exclusive transfer to the furniture brand or manufacturer to optimize the physical product and its guide."
        },
        {
          title: "4. Intellectual Property",
          content: "All intellectual property rights of the software, WebGL rendering engine, 3D interactive viewer code, trademarks, and telemetry technology belong exclusively to Mario Mojica. Rights to the furniture designs and associated trademarks belong to their respective manufacturers or authorized distributors."
        },
        {
          title: "5. Limitation of Liability",
          content: "Mario Mojica strives to maintain mathematical accuracy in cut lists, manufacturing plans, and interactive instructions. However, we are not liable for indirect damages, faulty assembly incidents in the customer's home, or material losses arising from the use of documentation generated by the platform."
        }
      ]
    }
  }[lang]

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 py-12 px-6 lg:px-24">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8 lg:p-12">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0088AA] hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-8 w-8 text-[#0088AA]" />
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

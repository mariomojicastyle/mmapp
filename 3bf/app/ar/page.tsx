"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { Sparkles, ArrowLeft, Box, Smartphone, CheckCircle, Info } from "lucide-react";
import Link from "next/link";
import ViewInArIcon from "@/components/icons/ViewInArIcon";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "ar-scale"?: string;
        "ar-placement"?: string;
        "quick-look-browsers"?: string;
        "camera-controls"?: boolean;
        "touch-action"?: string;
        "interaction-prompt"?: string;
        "auto-rotate"?: boolean;
        "auto-rotate-delay"?: string | number;
        "rotation-per-second"?: string;
        "shadow-intensity"?: string | number;
        "shadow-softness"?: string | number;
        exposure?: string | number;
        "environment-image"?: string;
        alt?: string;
        onLoad?: () => void;
      };
    }
  }
}

import { getLocalARModel } from "@/lib/arStorage";

function ARContent() {
  const searchParams = useSearchParams();
  const modelId = searchParams.get("id");
  const source = searchParams.get("source");
  const modelName = searchParams.get("name") || "Mueble 3dBimFab";
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [sinModelo, setSinModelo] = useState(false);
  const viewerRef = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    let objectUrlRevoke: string | null = null;

    async function resolverModelo() {
      // 1. Si es modo local (móvil directo), leer de IndexedDB
      if (source === "local") {
        try {
          const local = await getLocalARModel();
          if (local && local.blob) {
            const blobUrl = URL.createObjectURL(local.blob);
            objectUrlRevoke = blobUrl;
            setModelUrl(blobUrl);
            return;
          }
        } catch (e) {
          console.warn("Fallo leyendo IndexedDB local:", e);
        }
      }

      // 2. Si viene con ID de modelo (escaneo de QR o enlace web)
      if (modelId) {
        setModelUrl(`/api/ar-model/${modelId}`);
        return;
      }

      // 3. Fallback: Intentar leer IndexedDB de todos modos
      try {
        const localFallback = await getLocalARModel();
        if (localFallback && localFallback.blob) {
          const blobUrl = URL.createObjectURL(localFallback.blob);
          objectUrlRevoke = blobUrl;
          setModelUrl(blobUrl);
          return;
        }
      } catch (e) {}

      // Si no hay ninguna fuente válida
      setSinModelo(true);
      setCargando(false);
    }

    resolverModelo();

    return () => {
      if (objectUrlRevoke) {
        URL.revokeObjectURL(objectUrlRevoke);
      }
    };
  }, [modelId, source]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !modelUrl) return;

    const onLoad = () => {
      setCargando(false);
    };

    const onProgress = (e: any) => {
      if (e?.detail?.totalProgress >= 1) {
        setCargando(false);
      }
    };

    el.addEventListener("load", onLoad);
    el.addEventListener("progress", onProgress);

    // Timeout de seguridad: Si en 2.5 segundos el modelo ya está en GPU, quitar overlay
    const timer = setTimeout(() => {
      setCargando(false);
    }, 2500);

    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("progress", onProgress);
      clearTimeout(timer);
    };
  }, [modelUrl]);

  if (sinModelo || (!modelId && !modelUrl && !cargando)) {
    return (
      <div className="min-h-screen bg-[#131B2E] flex flex-col items-center justify-center p-6 text-center text-[#F8FAFC]">
        <div className="w-16 h-16 bg-[#1368AA]/20 border border-[#1368AA]/40 rounded-full flex items-center justify-center mb-4 text-[#1368AA]">
          <Box className="w-8 h-8 text-[#1368AA]" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">No se especificó un modelo</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Para ver un mueble en tu espacio, abre el configurador 3D y pulsa en "Ver en tu espacio" para proyectarlo o escanear el código QR.
        </p>
        <Link
          href="/"
          style={{ backgroundColor: "#1368AA" }}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Ir al Configurador 3D
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#131B2E] overflow-hidden flex flex-col select-none">
      {/* Script oficial de Google <model-viewer> para Realidad Aumentada universal */}
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        strategy="afterInteractive"
      />

      {/* Barra superior de navegación */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5 bg-[#131B2E]/95 backdrop-blur-md border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1E293B] hover:bg-[#1368AA] text-slate-300 hover:text-white transition-colors border border-slate-700/50 shrink-0 cursor-pointer"
            title="Volver al Configurador 3D"
            aria-label="Volver al Configurador 3D"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">{modelName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Logo 3dBimFab oficial calibrado (h-[42px]) */}
          <img
            src="/Logo_3BF_Dark.svg"
            alt="3dBimFab"
            className="h-[42px] w-auto object-contain"
          />
        </div>
      </header>

      {/* Contenedor del visor 3D y AR de Google */}
      <main className="flex-1 w-full h-full relative">
        {modelUrl && (
          // @ts-ignore
          <model-viewer
            ref={viewerRef}
            src={modelUrl}
            ar
            ar-modes="scene-viewer webxr quick-look"
            ar-scale="auto"
            ar-placement="floor"
            quick-look-browsers="safari chrome"
            camera-controls
            touch-action="none"
            interaction-prompt="none"
            shadow-intensity="1.2"
            shadow-softness="0.7"
            exposure="1.1"
            environment-image="neutral"
            style={{ width: "100%", height: "100%", backgroundColor: "#131B2E" }}
          >
            {/* Botón flotante nativo de Realidad Aumentada en Móvil - Azul #1368AA oficial sin incandescencias */}
            <button
              slot="ar-button"
              aria-label="Experiencia AR"
              title="Experiencia AR"
              style={{ backgroundColor: "#1368AA", borderColor: "#1368AA" }}
              className="absolute bottom-[70px] left-1/2 -translate-x-1/2 z-30 flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <ViewInArIcon className="w-7 h-7 text-white" />
            </button>
          </model-viewer>
        )}

        {/* Indicador de carga flotante no bloqueante */}
        {cargando && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#131B2E]/70 backdrop-blur-xs z-10 text-white pointer-events-none transition-opacity duration-300">
            <div className="w-10 h-10 border-3 border-[#1368AA] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-200 tracking-wide">Cargando modelo 3D...</p>
          </div>
        )}
      </main>

      {/* Banner inferior de guía de gestos */}
      <footer className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none flex justify-center">
        <div className="px-3.5 py-1.5 rounded-full bg-[#131B2E]/90 backdrop-blur-md border border-[#1368AA]/30 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
          <Info className="w-3.5 h-3.5 text-[#1368AA]" />
          <span>Gira con un dedo • Zoom con dos dedos • Pulsa el botón para AR</span>
        </div>
      </footer>
    </div>
  );
}

export default function ARPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#131B2E] flex flex-col items-center justify-center text-white text-xs gap-3">
          <div className="w-8 h-8 border-2 border-[#1368AA] border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-300 font-medium">Iniciando Experiencia AR...</span>
        </div>
      }
    >
      <ARContent />
    </Suspense>
  );
}

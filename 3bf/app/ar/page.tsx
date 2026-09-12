"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { Sparkles, ArrowLeft, Box, Smartphone, CheckCircle, Info, X, Download, Play, Pause, RotateCcw, Film } from "lucide-react";
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
        "camera-orbit"?: string;
        "tone-mapping"?: string;
        alt?: string;
        onLoad?: () => void;
        autoplay?: boolean;
        "animation-name"?: string;
        "animation-crossfade-duration"?: string | number;
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
  const [tieneAnimaciones, setTieneAnimaciones] = useState(false);
  const [estaReproduciendo, setEstaReproduciendo] = useState(true);
  const [nombreAnimacion, setNombreAnimacion] = useState<string | null>(null);
  const viewerRef = React.useRef<HTMLElement | null>(null);

  const togglePlay = () => {
    const mv = viewerRef.current as any;
    if (!mv) return;
    if (estaReproduciendo) {
      mv.pause();
      setEstaReproduciendo(false);
    } else {
      mv.play({ repetitions: Infinity });
      setEstaReproduciendo(true);
    }
  };

  const reiniciarAnimacion = () => {
    const mv = viewerRef.current as any;
    if (!mv) return;
    mv.currentTime = 0;
    mv.play({ repetitions: Infinity });
    setEstaReproduciendo(true);
  };

  // 📲 Gestión de Instalación de la Aplicación (PWA Standalone)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [mostrarBannerInstalar, setMostrarBannerInstalar] = useState(true);
  const [modalInstrucciones, setModalInstrucciones] = useState(false);
  const [yaInstalado, setYaInstalado] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detectar si ya se está ejecutando como app instalada (standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setYaInstalado(true);
      setMostrarBannerInstalar(false);
    }

    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setMostrarBannerInstalar(true);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", () => {
      setYaInstalado(true);
      setDeferredPrompt(null);
      setMostrarBannerInstalar(false);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
    };
  }, []);

  const handleAccionInstalar = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        setYaInstalado(true);
        setMostrarBannerInstalar(false);
      }
      setDeferredPrompt(null);
    } else {
      setModalInstrucciones(true);
    }
  };

  // 📱 Forzar viewport nativo móvil para que los controles táctiles y el botón de AR sean perfectos
  useEffect(() => {
    if (typeof window === "undefined") return;
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "viewport");
      document.head.appendChild(meta);
    }
    const originalContent = meta.getAttribute("content");
    meta.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");

    return () => {
      if (originalContent) {
        meta.setAttribute("content", originalContent);
      }
    };
  }, []);

  useEffect(() => {
    let objectUrlRevoke: string | null = null;
    let isCancelled = false;

    async function resolverModelo() {
      // 1. Si viene con ID de modelo (escaneo de QR o móvil con ID persistente)
      if (modelId) {
        // Enlace canónico seguro: el engine permanente aloja los binarios de Scene Viewer sin pérdida
        const base = "https://engine.mariomojica.com";
        const fullHttpsUrl = `${base}/api/ar-model/${modelId}.glb`;
        if (!isCancelled) {
          setModelUrl(fullHttpsUrl);
        }
        return;
      }

      // 2. Si es modo local (móvil directo sin ID), leer de IndexedDB para carga inmediata
      if (source === "local") {
        try {
          const local = await getLocalARModel();
          if (local && local.blob && !isCancelled) {
            const blobUrl = URL.createObjectURL(local.blob);
            objectUrlRevoke = blobUrl;
            setModelUrl(blobUrl);

            // Subir en segundo plano a la API para obtener URL HTTPS real requerida por Google Scene Viewer
            try {
              const res = await fetch(`/api/compress-glb?mode=ar&name=${encodeURIComponent(modelName)}`, {
                method: "POST",
                headers: { "Content-Type": "application/octet-stream" },
                body: local.blob,
              });
              if (res.ok) {
                const data = await res.json();
                if (data?.id && !isCancelled) {
                  const httpsUrl = `${window.location.origin}/api/ar-model/${data.id}.glb`;
                  setModelUrl(httpsUrl);
                }
              }
            } catch (bgUploadErr) {
              console.warn("[3dBimFab AR] Subida en segundo plano falló:", bgUploadErr);
            }
            return;
          }
        } catch (e) {
          console.warn("Fallo leyendo IndexedDB local:", e);
        }
      }

      // 3. Fallback: Intentar leer IndexedDB de todos modos
      try {
        const localFallback = await getLocalARModel();
        if (localFallback && localFallback.blob && !isCancelled) {
          const blobUrl = URL.createObjectURL(localFallback.blob);
          objectUrlRevoke = blobUrl;
          setModelUrl(blobUrl);
          return;
        }
      } catch (e) {}

      // Si no hay ninguna fuente válida
      if (!isCancelled) {
        setSinModelo(true);
        setCargando(false);
      }
    }

    resolverModelo();

    return () => {
      isCancelled = true;
      if (objectUrlRevoke) {
        URL.revokeObjectURL(objectUrlRevoke);
      }
    };
  }, [modelId, source, modelName]);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !modelUrl) return;

    const inicializarAnimaciones = () => {
      setCargando(false);
      const mv = el as any;
      if (mv && mv.availableAnimations && mv.availableAnimations.length > 0) {
        const animName = mv.availableAnimations[0];
        setNombreAnimacion(animName);
        setTieneAnimaciones(true);
        setEstaReproduciendo(true);
        try {
          if (!mv.animationName) {
            mv.animationName = animName;
          }
          mv.play({ repetitions: Infinity });
        } catch (e) {
          console.warn("[AR] Auto-play animation:", e);
        }
      }
    };

    const onLoad = () => {
      inicializarAnimaciones();
    };

    const onProgress = (e: any) => {
      if (e?.detail?.totalProgress >= 1) {
        setCargando(false);
      }
    };

    el.addEventListener("load", onLoad);
    el.addEventListener("progress", onProgress);

    // ⚡ Si el modelo ya terminó de cargar antes de adjuntar el listener (IndexedDB, Blob o caché rápido)
    if ((el as any).loaded) {
      inicializarAnimaciones();
    }

    // 🔄 Verificación periódica durante los primeros 2.5s por si el web component ya parseó animaciones
    const interval = setInterval(() => {
      const mv = el as any;
      if (mv && mv.availableAnimations && mv.availableAnimations.length > 0) {
        inicializarAnimaciones();
        clearInterval(interval);
      }
    }, 200);

    // Timeout de seguridad: Si en 2.5 segundos el modelo ya está en GPU, quitar overlay
    const timer = setTimeout(() => {
      setCargando(false);
      clearInterval(interval);
    }, 2500);

    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("progress", onProgress);
      clearInterval(interval);
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
    <div className="relative w-full h-[100dvh] bg-[#131B2E] overflow-hidden flex flex-col select-none">
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
          {!yaInstalado && (
            <button
              onClick={handleAccionInstalar}
              style={{ backgroundColor: "#1368AA" }}
              className="px-2.5 py-1 text-[11px] font-bold text-white rounded-full flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
              title="Instalar 3dBimFab en el teléfono"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}

          {/* Logo 3dBimFab oficial calibrado (h-[42px]) */}
          <img
            src="/Logo_3BF_Dark.svg"
            alt="3dBimFab"
            className="h-[42px] w-auto object-contain"
          />
        </div>
      </header>

      {/* 📲 Banner Flotante Prominente de Instalación PWA (Estilo Chrome Oficial) */}
      {mostrarBannerInstalar && !yaInstalado && (
        <div className="absolute top-14 left-3 right-3 z-30 bg-[#1E293B] text-white p-2.5 px-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/Icon_3BF.png" alt="3BF" className="w-9 h-9 rounded-xl shadow-xs shrink-0 object-cover" />
            <div className="min-w-0 leading-tight">
              <h4 className="text-xs font-bold truncate">Instalar 3dBimFab</h4>
              <p className="text-[10px] text-slate-400 truncate">engine.mariomojica.com</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleAccionInstalar}
              style={{ backgroundColor: "#1368AA" }}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 transition cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Instalar</span>
            </button>
            <button
              onClick={() => setMostrarBannerInstalar(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 💡 Modal de Instrucciones de Instalación si Chrome tiene el prompt en cooldown */}
      {modalInstrucciones && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none">
          <div className="bg-[#131B2E] border border-[#1E293B] text-white p-5 rounded-2xl max-w-xs w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/Icon_3BF.png" alt="3BF" className="w-9 h-9 rounded-xl shadow-xs" />
                <div>
                  <h3 className="text-xs font-bold leading-tight">Instalar 3dBimFab</h3>
                  <p className="text-[10px] text-slate-400">Acceso directo en tu celular</p>
                </div>
              </div>
              <button
                onClick={() => setModalInstrucciones(false)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed bg-[#0B0F17] p-3 rounded-xl border border-slate-800">
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#1368AA]">1.</span>
                <span>Toca los <strong>3 puntos (⋮)</strong> en la esquina superior derecha de tu navegador Chrome.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#1368AA]">2.</span>
                <span>Selecciona <strong>"Instalar aplicación"</strong> (o <strong>"Agregar a la pantalla principal"</strong>).</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-[#1368AA]">3.</span>
                <span>Presiona <strong>"Instalar"</strong>. ¡Listo! Se creará el acceso directo con el icono de 3BF.</span>
              </p>
            </div>

            <button
              onClick={() => setModalInstrucciones(false)}
              style={{ backgroundColor: "#1368AA" }}
              className="w-full py-2 rounded-full text-xs font-bold text-white shadow-md cursor-pointer hover:opacity-90 active:scale-95 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

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
            autoplay
            animation-name={nombreAnimacion || undefined}
            animation-crossfade-duration="300"
            camera-controls
            touch-action="none"
            interaction-prompt="none"
            camera-orbit="32deg 75deg 105%"
            shadow-intensity="1.4"
            shadow-softness="0.4"
            exposure="1.0"
            tone-mapping="aces"
            environment-image="neutral"
            style={{ width: "100%", height: "100%", backgroundColor: "#131B2E" }}
          >
            {/* Botón flotante nativo de Realidad Aumentada en Móvil - Azul #1368AA oficial sin incandescencias */}
            <button
              slot="ar-button"
              aria-label="Experiencia AR"
              title="Experiencia AR"
              style={{ backgroundColor: "#1368AA", borderColor: "#1368AA" }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center w-16 h-16 sm:w-14 sm:h-14 rounded-full text-white shadow-xl border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer touch-manipulation"
            >
              <ViewInArIcon className="w-8 h-8 sm:w-7 sm:h-7 text-white" />
            </button>
          </model-viewer>
        )}

        {/* 🎬 Barra Flotante de Control de Animación AR (Solo si el modelo incluye clips de animación) */}
        {tieneAnimaciones && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#131B2E]/92 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#1368AA]/40 shadow-xl">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-white pr-2 border-r border-slate-700/60">
              <Film className="w-3.5 h-3.5 text-[#1368AA]" />
              <span>Animación</span>
            </span>

            <button
              onClick={togglePlay}
              style={{ backgroundColor: "#1368AA" }}
              className="px-2.5 py-1 rounded-full text-white text-[11px] font-bold flex items-center gap-1 hover:opacity-90 active:scale-95 transition cursor-pointer shadow-sm"
              title={estaReproduciendo ? "Pausar animación" : "Reproducir animación"}
            >
              {estaReproduciendo ? (
                <>
                  <Pause className="w-3 h-3" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" /> Reproducir
                </>
              )}
            </button>

            <button
              onClick={reiniciarAnimacion}
              className="p-1 rounded-full bg-[#1E293B] hover:bg-[#334155] text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/50"
              title="Reiniciar animación desde el segundo 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
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

"use client";

import React, { useEffect } from "react";
import Viewer3D from "@/components/viewer/Viewer3D";
import ControlPanel from "@/components/ui/ControlPanel";
import DespieceView from "@/components/views/DespieceView";
import DatabaseView from "@/components/views/DatabaseView";
import SaveFurnitureModal from "@/components/ui/SaveFurnitureModal";
import AIRenderStudioModal from "@/components/ui/AIRenderStudioModal";
import PBRMaterialStudioModal from "@/components/ui/PBRMaterialStudioModal";
import NPanel from "@/components/viewer/NPanel";
import { use3BFStore, APP_VERSION } from "@/lib/store";
import { Box, Layers, Cpu, CheckCircle2, AlertCircle, Database, Camera, Check, Sparkles } from "lucide-react";
import { IconModoLineas, IconModoCristal, IconModoSolido, IconModoRender } from "@/components/ui/ControlPanel";

export default function Home3BF() {
  const { 
    pestanaActiva, 
    setPestanaActiva, 
    workerStatus, 
    setWorkerStatus,
    hidratarDesdeLocalStorage,
    coloresApariencia,
    setMostrarNPanel,
    tema,
    setTema,
    esquemaColor,
    setEsquemaColor,
    modoVisual,
    setModoVisual,
    parametros,
    anchoPanelDerecho,
    setAnchoPanelDerecho,
    setModalRenderIAAbierto,
  } = use3BFStore();

  const [guardandoFoto, setGuardandoFoto] = React.useState(false);
  const [fotoCapturada, setFotoCapturada] = React.useState(false);
  const [isResizingPanel, setIsResizingPanel] = React.useState(false);
  const handleStartResizePanel = (e: React.MouseEvent | React.TouchEvent) => {
    setIsResizingPanel(true);
    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const nuevoAncho = window.innerWidth - clientX - 12;
      setAnchoPanelDerecho(Math.max(220, Math.min(800, nuevoAncho)));
    };

    const onEnd = () => {
      setIsResizingPanel(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  };

  const capturarMiniatura = async () => {
    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) {
        alert("No se encontró el lienzo 3D.");
        return;
      }
      setGuardandoFoto(true);

      // Captura de alta resolución desde WebGL si está disponible
      let imageBase64 = "";
      if (typeof window !== "undefined" && (window as any).__capturarThumbnail3BF) {
        imageBase64 = (window as any).__capturarThumbnail3BF() || "";
      }
      if (!imageBase64) {
        imageBase64 = canvas.toDataURL("image/png");
      }

      const {
        muebleActivoGuardado,
        actualizarThumbnailMueble,
        objetoActivoId,
        instancias,
        parametros,
      } = use3BFStore.getState();

      // 1. Si hay un Mueble abierto en el escenario (ej: Borrar_01)
      if (muebleActivoGuardado) {
        await actualizarThumbnailMueble(muebleActivoGuardado.id, imageBase64);
        setFotoCapturada(true);
        setTimeout(() => setFotoCapturada(false), 2500);
        window.dispatchEvent(
          new CustomEvent("3bf-thumbnail-updated", { detail: { muebleId: muebleActivoGuardado.id, imageBase64 } })
        );
        return;
      }

      // 2. Si no es un mueble guardado, asignarlo al Componente Activo en el escenario
      let modelId = "Cubierta";
      if (objetoActivoId && instancias[objetoActivoId]) {
        modelId = instancias[objetoActivoId].definitionId || (parametros as any).model_id || "Cubierta";
      } else if (parametros.model_id) {
        modelId = parametros.model_id;
      } else if ((parametros as any).custom_filename) {
        modelId = (parametros as any).custom_filename.replace(/\.ghx$/i, "");
      }

      const res = await fetch("/api/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: modelId, imageBase64 }),
      });

      if (res.ok) {
        setFotoCapturada(true);
        setTimeout(() => setFotoCapturada(false), 2500);
        window.dispatchEvent(
          new CustomEvent("3bf-thumbnail-updated", { detail: { modelId, imageBase64 } })
        );
      }
    } catch (err) {
      console.error("Error al capturar snapshot:", err);
    } finally {
      setGuardandoFoto(false);
    }
  };

  const verificarWorker = async () => {
    try {
      const res = await fetch("/api/health", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "online" && data.worker && data.rhino_compute) {
          setWorkerStatus("online");
        } else {
          setWorkerStatus("offline");
        }
      } else {
        setWorkerStatus("offline");
      }
    } catch {
      setWorkerStatus("offline");
    }
  };

  useEffect(() => {
    // Hidratar inmediatamente toda la base de datos de materias primas y costos
    hidratarDesdeLocalStorage();
    verificarWorker();

    // Heartbeat cada 8 segundos y al reactivar la pantalla / regresar de hibernación
    const interval = setInterval(verificarWorker, 8000);
    const handleReactivation = () => {
      verificarWorker();
    };

    window.addEventListener("focus", handleReactivation);
    document.addEventListener("visibilitychange", handleReactivation);

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // ⏪ DESHACER (Ctrl + Z / Cmd + Z)
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z" || e.code === "KeyZ") && !e.shiftKey) {
        e.preventDefault();
        use3BFStore.getState().deshacer();
        return;
      }

      // ⏩ REHACER (Ctrl + Y  o  Ctrl + Shift + Z / Cmd + Shift + Z)
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y" || e.code === "KeyY")) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "z" || e.key === "Z" || e.code === "KeyZ"))
      ) {
        e.preventDefault();
        use3BFStore.getState().rehacer();
        return;
      }

      // 🎛️ TOGGLE PANEL N (Tecla N)
      if ((e.key === "n" || e.key === "N" || e.code === "KeyN") && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        use3BFStore.getState().setMostrarNPanel((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleReactivation);
      document.removeEventListener("visibilitychange", handleReactivation);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hidratarDesdeLocalStorage]);

  return (
    <main 
      style={{ backgroundColor: coloresApariencia?.fondoAplicacion }}
      className="w-screen h-screen flex flex-col overflow-hidden text-[var(--text-main)] transition-colors"
    >
      {/* Modal Global Guardar Como Mueble (Google Drive / Marcas) */}
      <SaveFurnitureModal />

      {/* TopNav Barra Superior (Elementos distribuidos equidistantes y balanceados) */}
      <header 
        style={{ 
          backgroundColor: coloresApariencia?.fondoTopNav || coloresApariencia?.fondoPaneles, 
          borderColor: coloresApariencia?.bordePaneles,
          color: coloresApariencia?.textoPrincipal 
        }}
        className="h-14 px-2 sm:px-3 md:px-4 flex items-center justify-between border-b glass-panel z-10 relative transition-colors gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 overflow-x-auto custom-scrollbar"
      >
        {/* Logotipo Vectorial Completo 3BF */}
        <div className="flex items-center shrink-0">
          <svg
            viewBox="6.73 15.276 235 59.448"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 sm:h-8 md:h-9 w-auto select-none overflow-visible"
            role="img"
            aria-label="3dBimFab — Powered by MARIO MOJICA"
          >
            <g transform="translate(0.54747356,0.5)">
              <g transform="translate(0.64469146)">
                {/* Cuadro Rojo 3BF del SVG Oficial */}
                <rect
                  x="5.5378542"
                  y="14.77611"
                  width="59.447781"
                  height="59.447781"
                  fill="#bb0f0f"
                />
                {/* Texto 3BF */}
                <text
                  x="8.3642311"
                  y="54.980133"
                  style={{
                    fontFamily: "var(--font-prompt), 'Prompt', sans-serif",
                    fontSize: "29.9861px",
                    fill: coloresApariencia?.color3BF || "#ffffff",
                  }}
                >
                  3BF
                </text>
                {/* Texto 3dBimFab */}
                <text
                  x="73.092186"
                  y="54.980133"
                  style={{
                    fontFamily: "var(--font-prompt), 'Prompt', sans-serif",
                    fontSize: "29.9861px",
                    fill: coloresApariencia?.textoLogotipo || coloresApariencia?.textoPrincipal || "currentColor",
                  }}
                >
                  3dBimFab
                </text>
                {/* Texto Powered by MARIO MOJICA */}
                <text
                  x="73.50573"
                  y="67.131699"
                  style={{
                    fontFamily: "var(--font-prompt), 'Prompt', sans-serif",
                    fontSize: "10.415px",
                    fill: coloresApariencia?.textoLogotipo || coloresApariencia?.textoPrincipal || "currentColor",
                    opacity: 0.85,
                  }}
                >
                  Powered by MARIO MOJICA
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* 2. Pestañas de Vista Principales (Centradas en el Header) */}
        <div className="flex items-center justify-center flex-1 min-w-0">
          <div 
            style={{ 
              borderColor: coloresApariencia?.insigniaFondo || coloresApariencia?.bordePaneles,
              backgroundColor: coloresApariencia?.panelContenedor || "#E2E8F0"
            }}
            className="flex items-center p-0.5 md:p-1 rounded-full border text-xs shadow-inner backdrop-blur-md gap-0.5 md:gap-1 h-8 md:h-9 shrink-0"
          >
            <button
              onClick={() => setPestanaActiva("3d")}
              style={
                pestanaActiva === "3d"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                  : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
              }
              className={`px-2 sm:px-3 md:px-4 h-6 md:h-7 rounded-full transition flex items-center gap-1 font-bold cursor-pointer text-[11px] md:text-xs ${
                pestanaActiva === "3d"
                  ? "text-white shadow-md border"
                  : "hover:opacity-90 border backdrop-blur-sm"
              }`}
            >
              <Box className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span><span className="hidden sm:inline">Visor </span>3D</span>
            </button>
            <button
              onClick={() => setPestanaActiva("despiece")}
              style={
                pestanaActiva === "despiece"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                  : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
              }
              className={`px-2 sm:px-3 md:px-4 h-6 md:h-7 rounded-full transition flex items-center gap-1 font-bold cursor-pointer text-[11px] md:text-xs ${
                pestanaActiva === "despiece"
                  ? "text-white shadow-md border"
                  : "hover:opacity-90 border backdrop-blur-sm"
              }`}
            >
              <Layers className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span>Despiece<span className="hidden sm:inline"> & Costos</span></span>
            </button>
            <button
              onClick={() => setPestanaActiva("basedatos")}
              style={
                pestanaActiva === "basedatos"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                  : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
              }
              className={`px-2 sm:px-3 md:px-4 h-6 md:h-7 rounded-full transition flex items-center gap-1 font-bold cursor-pointer text-[11px] md:text-xs ${
                pestanaActiva === "basedatos"
                  ? "text-white shadow-md border"
                  : "hover:opacity-90 border backdrop-blur-sm"
              }`}
            >
              <Database className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span><span className="hidden sm:inline">Base de </span>Datos</span>
            </button>
          </div>
        </div>

        {/* 3. Bloque de Herramientas y Controles Visuales a la Derecha */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 shrink-0">
          {/* Botonera de 4 Modos 3D */}
          <div 
            style={{ 
              borderColor: coloresApariencia?.insigniaFondo || coloresApariencia?.bordePaneles,
              backgroundColor: coloresApariencia?.panelContenedor || "#E2E8F0"
            }}
            className="flex items-center p-0.5 md:p-1 rounded-full border gap-0.5 md:gap-1 shadow-inner h-8 md:h-9 shrink-0"
          >
            {/* 1. Líneas (Wireframe) */}
            <button
              onClick={() => setModoVisual("lineas")}
              title="1. Modo Líneas (Wireframe)"
              style={
                modoVisual === "lineas"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                  : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
              }
              className={`w-6 md:w-7 h-6 md:h-7 rounded-full flex items-center justify-center cursor-pointer transition ${
                modoVisual === "lineas" ? "text-white shadow-md border" : "hover:opacity-90 border backdrop-blur-sm"
              }`}
            >
              <IconModoLineas className="w-3.5 md:w-4 h-3.5 md:h-4" />
            </button>

            {/* 2. Cristal (Semitransparente / Glass) */}
            <button
              onClick={() => setModoVisual("semitransparente")}
              title="2. Modo Cristal (Semitransparente 70%)"
              style={
                modoVisual === "semitransparente"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                  : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
              }
              className={`w-6 md:w-7 h-6 md:h-7 rounded-full flex items-center justify-center cursor-pointer transition ${
                modoVisual === "semitransparente" ? "text-white shadow-md border" : "hover:opacity-90 border backdrop-blur-sm"
              }`}
            >
              <IconModoCristal className="w-3.5 md:w-4 h-3.5 md:h-4" isActivo={modoVisual === "semitransparente"} />
            </button>

            {/* 3. Sólido (Solid) */}
            <button
              onClick={() => setModoVisual("solido")}
              title="3. Modo Sólido (Solid)"
              style={
                modoVisual === "solido"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                  : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
              }
              className={`w-6 md:w-7 h-6 md:h-7 rounded-full flex items-center justify-center cursor-pointer transition ${
                modoVisual === "solido" ? "text-white shadow-md border" : "hover:opacity-90 border backdrop-blur-sm"
              }`}
            >
              <IconModoSolido className="w-3.5 md:w-4 h-3.5 md:h-4" />
            </button>

            {/* 4. Renderizado (Render / Specular) */}
            <button
              onClick={() => setModoVisual("renderizado")}
              title="4. Modo Renderizado (PBR / Specular)"
              style={
                modoVisual === "renderizado"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                  : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
              }
              className={`w-6 md:w-7 h-6 md:h-7 rounded-full flex items-center justify-center cursor-pointer transition ${
                modoVisual === "renderizado" ? "text-white shadow-md border" : "hover:opacity-90 border backdrop-blur-sm"
              }`}
            >
              <IconModoRender className="w-3.5 md:w-4 h-3.5 md:h-4" />
            </button>
          </div>

          {/* 2. Botón de Fotografía (Cápsula rounded-full) */}
          <div
            style={{ 
              borderColor: coloresApariencia?.insigniaFondo || coloresApariencia?.bordePaneles,
              backgroundColor: coloresApariencia?.panelContenedor || "#E2E8F0"
            }}
            className="p-0.5 md:p-1 rounded-full border shadow-inner h-8 md:h-9 shrink-0 flex items-center justify-center"
          >
            <button
              onClick={capturarMiniatura}
              disabled={guardandoFoto}
              title={
                fotoCapturada 
                  ? "¡Miniatura guardada con éxito!" 
                  : guardandoFoto 
                    ? "Capturando miniatura..." 
                    : "Capturar miniatura del lienzo 3D"
              }
              style={
                fotoCapturada
                  ? { backgroundColor: "#10B98125", borderColor: "#10B981", color: "#10B981" }
                  : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
              }
              className={`w-6 md:w-7 h-6 md:h-7 rounded-full border flex items-center justify-center transition cursor-pointer ${
                fotoCapturada ? "shadow-md" : "hover:opacity-90 backdrop-blur-sm"
              } ${guardandoFoto ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {fotoCapturada ? (
                <Check className="w-3.5 md:w-4 h-3.5 md:h-4 text-emerald-500 shrink-0" />
              ) : (
                <Camera 
                  style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} 
                  className="w-3.5 md:w-4 h-3.5 md:h-4 shrink-0" 
                />
              )}
            </button>
          </div>

          {/* 3. Switch de Tema (Light / Dark) */}
          <div 
            style={{ 
              borderColor: coloresApariencia?.insigniaFondo || coloresApariencia?.bordePaneles,
              backgroundColor: coloresApariencia?.panelContenedor || "#E2E8F0"
            }}
            className="flex items-center p-0.5 md:p-1 rounded-full border gap-0.5 md:gap-1 shadow-inner h-8 md:h-9 shrink-0"
          >
            <button
              onClick={() => setEsquemaColor("claro")}
              style={
                esquemaColor === "claro"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                  : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
              }
              className={`px-2.5 md:px-3.5 h-6 md:h-7 rounded-full transition cursor-pointer text-[11px] md:text-xs font-bold flex items-center justify-center ${
                esquemaColor === "claro" ? "text-white shadow-md border" : "hover:opacity-90 border backdrop-blur-sm"
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setEsquemaColor("oscuro")}
              style={
                esquemaColor === "oscuro"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2" }
                  : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
              }
              className={`px-2.5 md:px-3.5 h-6 md:h-7 rounded-full transition cursor-pointer text-[11px] md:text-xs font-bold flex items-center justify-center ${
                esquemaColor === "oscuro" ? "text-white shadow-md border" : "hover:opacity-90 border backdrop-blur-sm"
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </header>

      {/* Cuerpo Principal dividido en 2 columnas con barra de redimensión ergonómica */}
      <div className={`flex-1 flex overflow-hidden p-3 gap-0 relative ${isResizingPanel ? "select-none cursor-ew-resize" : ""}`}>
        {/* Columna Izquierda: Visor 3D o Tablas de Datos */}
        <div className="flex-1 h-full flex flex-col relative overflow-hidden">
          {pestanaActiva === "3d" ? (
            <Viewer3D />
          ) : pestanaActiva === "despiece" ? (
            <DespieceView />
          ) : (
            <DatabaseView />
          )}
        </div>

        {/* Separador / Handler de Redimensión Ergonómico entre Panel Izquierdo y Derecho (Mouse + Touch) */}
        <div
          onMouseDown={handleStartResizePanel}
          onTouchStart={handleStartResizePanel}
          title="Arrastra para ajustar el ancho del panel derecho"
          className="w-3.5 h-full cursor-ew-resize flex items-center justify-center group shrink-0 z-30 select-none hover:bg-cyan-500/10 transition-colors touch-none"
        >
          <div 
            className={`w-1 rounded-full transition-all ${
              isResizingPanel
                ? "bg-cyan-500 shadow-md shadow-cyan-500/60 w-1.5 h-16"
                : "bg-slate-300 dark:bg-slate-700 h-10 group-hover:bg-cyan-500/80 group-hover:h-14"
            }`}
          />
        </div>

        {/* Columna Derecha: Panel de Control de Parámetros & NPanel */}
        <div 
          style={{ 
            width: `${anchoPanelDerecho || 380}px`,
            backgroundColor: coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.bordePaneles,
            color: coloresApariencia?.textoPrincipal 
          }}
          className={`h-full glass-panel rounded-xl border flex flex-col transition-colors shrink-0 relative overflow-hidden ${
            isResizingPanel ? "transition-none" : "transition-all"
          }`}
        >
          <ControlPanel />
          {pestanaActiva !== "3d" && <NPanel />}
        </div>
      </div>

      {/* 🤖 Modal 3BF AI Render Studio (Google Gemini / Imagen 3) */}
      <AIRenderStudioModal />

      {/* 🧪 Modal 3BF PBR Material Studio (Calibrador 3D & Shader Ball) */}
      <PBRMaterialStudioModal />
    </main>
  );
}

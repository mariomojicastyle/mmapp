"use client";

import React, { useState, useEffect, useRef } from "react";
import { use3BFStore, RenderIAResultado, PromptTemplateItem } from "@/lib/store";
import PromptLibraryManager from "./PromptLibraryManager";
import { 
  Sparkles, 
  X, 
  Camera, 
  Download, 
  Copy, 
  Check, 
  Key, 
  Layers, 
  BookOpen, 
  Image as ImageIcon, 
  RefreshCw, 
  ExternalLink,
  History,
  Trash2,
  Maximize2,
  Minimize2,
  Sliders,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  Save
} from "lucide-react";

export default function AIRenderStudioModal() {
  const {
    modalRenderIAAbierto,
    setModalRenderIAAbierto,
    geminiApiKey,
    setGeminiApiKey,
    falApiKey,
    setFalApiKey,
    promptActivoRender,
    setPromptActivoRender,
    motorSeleccionadoRender,
    setMotorSeleccionadoRender,
    aspectRatioRender,
    setAspectRatioRender,
    guardarNuevoPrompt,
    historialRendersIA,
    agregarRenderHistorial,
    eliminarRenderHistorial,
    coloresApariencia,
    tema,
    muebleActivoGuardado,
    objetoActivoId,
    instancias,
    actualizarThumbnailMueble
  } = use3BFStore();

  const [captura3DBase64, setCaptura3DBase64] = useState<string>("");
  const [generando, setGenerando] = useState<boolean>(false);
  const [renderActual, setRenderActual] = useState<RenderIAResultado | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [avisoMsg, setAvisoMsg] = useState<string | null>(null);
  const [pestanaLateral, setPestanaLateral] = useState<"biblioteca" | "resultado" | "historial">("resultado");
  const [pantallaCompleta, setPantallaCompleta] = useState<boolean>(false);
  const [mostrarConfigKey, setMostrarConfigKey] = useState<boolean>(false);
  const [mostrarGuardarPreset, setMostrarGuardarPreset] = useState<boolean>(false);
  const [nuevoPresetTitulo, setNuevoPresetTitulo] = useState<string>("");
  const [nuevoPresetCategoria, setNuevoPresetCategoria] = useState<any>("Oficina");
  const [presetGuardadoExito, setPresetGuardadoExito] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>("");
  const [tempFalKey, setTempFalKey] = useState<string>("");
  const [copiado, setCopiado] = useState<boolean>(false);
  const [guardadoMiniatura, setGuardadoMiniatura] = useState<boolean>(false);
  const [compararModo, setCompararModo] = useState<"render" | "original" | "split">("render");
  const [mejorandoPhota, setMejorandoPhota] = useState<boolean>(false);

  // Obtener nombre del mueble activo
  const nombreMueble = muebleActivoGuardado?.nombre || (objetoActivoId && instancias[objetoActivoId]?.nombreVisible) || "Mueble 3DBimFab";

  // Capturar escena 3D limpia al abrir el modal (priorizando la captura calibrada del PBR Studio)
  const refrescarCaptura3D = () => {
    if (typeof window !== "undefined") {
      let b64 = "";
      if ((window as any).__3bfPBRSnapshot) {
        b64 = (window as any).__3bfPBRSnapshot;
      } else if ((window as any).__capturarShaderBallSnapshot) {
        b64 = (window as any).__capturarShaderBallSnapshot() || "";
      } else if ((window as any).__capturarEscenaRenderIA) {
        b64 = (window as any).__capturarEscenaRenderIA({ width: 1024, height: 1024 }) || "";
      } else if ((window as any).__capturarThumbnail3BF) {
        b64 = (window as any).__capturarThumbnail3BF() || "";
      }
      if (b64) {
        setCaptura3DBase64(b64);
      }
    }
  };

  useEffect(() => {
    if (modalRenderIAAbierto) {
      setTempApiKey(geminiApiKey);
      setTempFalKey(falApiKey);
      refrescarCaptura3D();
      if (historialRendersIA.length > 0 && !renderActual) {
        setRenderActual(historialRendersIA[0]);
      }
    }
  }, [modalRenderIAAbierto, geminiApiKey, falApiKey]);

  if (!modalRenderIAAbierto) return null;

  const handleSelectPrompt = (promptText: string, item: PromptTemplateItem) => {
    setPromptActivoRender(promptText);
    if (item.aspectRatio) {
      setAspectRatioRender(item.aspectRatio);
    }
  };

  const handleGenerarRender = async () => {
    if (!promptActivoRender.trim()) return;

    setGenerando(true);
    setErrorMsg(null);
    setAvisoMsg(null);

    try {
      // Captura fresca del 3D antes de enviar
      let snap = captura3DBase64;
      if (typeof window !== "undefined") {
        if ((window as any).__3bfPBRSnapshot) {
          snap = (window as any).__3bfPBRSnapshot;
        } else if ((window as any).__capturarShaderBallSnapshot) {
          snap = (window as any).__capturarShaderBallSnapshot() || snap;
        } else if ((window as any).__capturarEscenaRenderIA) {
          snap = (window as any).__capturarEscenaRenderIA({ width: 1024, height: 1024 }) || snap;
        }
        setCaptura3DBase64(snap);
      }

      const res = await fetch("/api/render-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptActivoRender,
          imageBase64: snap,
          motor: motorSeleccionadoRender,
          aspectRatio: aspectRatioRender,
          falKey: falApiKey || undefined,
          geminiKey: geminiApiKey || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error del servidor HTTP ${res.status}`);
      }

      const nuevoItem: RenderIAResultado = {
        id: `render_${Date.now()}`,
        muebleNombre: nombreMueble,
        imageUrl: data.imageUrl,
        imageBase64Original: snap,
        promptUsado: promptActivoRender,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        motorUsado: data.motor || motorSeleccionadoRender,
        aspectRatio: aspectRatioRender,
      };

      setRenderActual(nuevoItem);
      agregarRenderHistorial(nuevoItem);
      setPestanaLateral("resultado");

      if (data.warning) {
        setAvisoMsg(data.warning);
      }
    } catch (err: any) {
      console.error("Error en render IA:", err);
      setErrorMsg(err.message || "Error inesperado al conectar con el motor de IA.");
    } finally {
      setGenerando(false);
    }
  };

  const handleGuardarComoPreset = () => {
    if (!nuevoPresetTitulo.trim() || !promptActivoRender.trim()) return;
    guardarNuevoPrompt({
      titulo: nuevoPresetTitulo.trim(),
      categoria: nuevoPresetCategoria,
      prompt: promptActivoRender.trim(),
      descripcion: `Creado para ${nombreMueble}`,
      aspectRatio: aspectRatioRender,
      esFavorito: false,
    });
    setPresetGuardadoExito(true);
    setTimeout(() => {
      setPresetGuardadoExito(false);
      setMostrarGuardarPreset(false);
      setNuevoPresetTitulo("");
    }, 1500);
  };

  const handleGuardarApiKey = () => {
    setGeminiApiKey(tempApiKey.trim());
    setFalApiKey(tempFalKey.trim());
    setMostrarConfigKey(false);
  };

  const handleDescargarRender = () => {
    if (!renderActual) return;
    const a = document.createElement("a");
    a.href = renderActual.imageUrl;
    a.download = `render-3bf-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopiarImagen = async () => {
    if (!renderActual) return;
    try {
      const resp = await fetch(renderActual.imageUrl);
      const blob = await resp.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e) {
      console.error("Error al copiar imagen al portapapeles:", e);
    }
  };

  const handleEstablecerComoMiniatura = async () => {
    if (!renderActual) return;
    if (muebleActivoGuardado) {
      await actualizarThumbnailMueble(muebleActivoGuardado.id, renderActual.imageUrl);
      setGuardadoMiniatura(true);
      setTimeout(() => setGuardadoMiniatura(false), 2500);
    }
  };

  const handleMejorarConPhota = async () => {
    if (!renderActual?.imageUrl) return;
    setMejorandoPhota(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/render-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enhance",
          imageUrl: renderActual.imageUrl,
          prompt: renderActual.promptUsado || "4K architectural product photography, high-resolution details",
          falApiKey: falApiKey || undefined,
          falKey: falApiKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Error al mejorar la imagen (${res.status})`);
      }
      const nuevoItem: RenderIAResultado = {
        id: `render_${Date.now()}`,
        muebleNombre: nombreMueble,
        imageUrl: data.imageUrl,
        imageBase64Original: renderActual.imageBase64Original || renderActual.imageUrl,
        promptUsado: `${renderActual.promptUsado} ✨ [Phota 4K Enhanced]`,
        fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        motorUsado: "fal_phota_enhance",
        aspectRatio: renderActual.aspectRatio || "1:1",
      };
      setRenderActual(nuevoItem);
      agregarRenderHistorial(nuevoItem);
    } catch (err: any) {
      console.error("Error mejorando con Phota:", err);
      setErrorMsg(err.message || "No se pudo mejorar la imagen con Phota.");
    } finally {
      setMejorandoPhota(false);
    }
  };

  const modalOuterClasses = pantallaCompleta
    ? "fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-sm"
    : "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/75 backdrop-blur-sm";

  const modalContainerClasses = pantallaCompleta
    ? "w-full h-full border-none flex flex-col shadow-2xl overflow-hidden transition-colors"
    : "w-[98vw] max-w-[1700px] h-[95vh] max-h-[1020px] rounded-xl border flex flex-col shadow-2xl overflow-hidden transition-colors";

  return (
    <div className={modalOuterClasses}>
      <div 
        className={modalContainerClasses}
        style={{
          backgroundColor: coloresApariencia?.fondoAplicacion || (tema === "obsidian" ? "#0D1117" : "#F8FAFC"),
          borderColor: coloresApariencia?.bordePaneles || (tema === "obsidian" ? "#30363D" : "#E2E8F0"),
          color: coloresApariencia?.textoPrincipal || (tema === "obsidian" ? "#F0F6FC" : "#0F172A")
        }}
      >
        {/* ===================================================================== */}
        {/* 1. BARRA SUPERIOR / ENCABEZADO */}
        {/* ===================================================================== */}
        <div 
          className="flex items-center justify-between px-4 py-2.5 border-b select-none"
          style={{ 
            backgroundColor: coloresApariencia?.fondoPaneles || (tema === "obsidian" ? "#161B22" : "#FFFFFF"),
            borderColor: coloresApariencia?.bordePaneles || (tema === "obsidian" ? "#30363D" : "#E2E8F0")
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm tracking-tight" style={{ color: coloresApariencia?.textoPrincipal }}>
                  3BF AI Render Studio
                </h2>
                <span 
                  className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border"
                  style={{
                    backgroundColor: tema === "obsidian" ? "rgba(6, 182, 212, 0.15)" : "#E0F2FE",
                    color: tema === "obsidian" ? "#67E8F9" : "#0369A1",
                    borderColor: tema === "obsidian" ? "rgba(6, 182, 212, 0.3)" : "#BAE6FD"
                  }}
                >
                  Google Gemini / Imagen 3
                </span>
              </div>
              <p className="text-[11px]" style={{ color: coloresApariencia?.textoSecundario }}>
                Renderizado fotorrealista paramétrico 1:1 con prompts arquitectónicos
              </p>
            </div>
          </div>

          {/* Configuración de API Key y Motor */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarConfigKey(!mostrarConfigKey)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition border cursor-pointer hover:opacity-90"
              style={
                falApiKey || geminiApiKey
                  ? {
                      backgroundColor: tema === "obsidian" ? "rgba(16, 185, 129, 0.18)" : "#ECFDF5",
                      color: tema === "obsidian" ? "#6EE7B7" : "#047857",
                      borderColor: tema === "obsidian" ? "rgba(16, 185, 129, 0.35)" : "#A7F3D0"
                    }
                  : {
                      backgroundColor: tema === "obsidian" ? "rgba(245, 158, 11, 0.18)" : "#FFFBEB",
                      color: tema === "obsidian" ? "#FCD34D" : "#B45309",
                      borderColor: tema === "obsidian" ? "rgba(245, 158, 11, 0.35)" : "#FDE68A"
                    }
              }
              title="Configurar API Keys de fal.ai y Google AI Studio"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{falApiKey ? "fal.ai FLUX Conectado" : geminiApiKey ? "Google API Conectada" : "Configurar API Keys"}</span>
            </button>

            {/* Alternar Pantalla Completa */}
            <button
              onClick={() => setPantallaCompleta(!pantallaCompleta)}
              className="p-1.5 rounded-lg transition cursor-pointer hover:opacity-80 border"
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
                color: coloresApariencia?.textoPrincipal
              }}
              title={pantallaCompleta ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {pantallaCompleta ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setModalRenderIAAbierto(false)}
              className="p-1.5 rounded-lg transition cursor-pointer hover:opacity-80 border"
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
                color: coloresApariencia?.textoPrincipal
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Desplegable de Configuración de API Keys (fal.ai + Google) */}
        {mostrarConfigKey && (
          <div 
            className="p-4 border-b flex flex-col gap-3 text-xs shadow-inner animate-in slide-in-from-top-2"
            style={{ 
              backgroundColor: coloresApariencia?.fondoPaneles,
              borderColor: coloresApariencia?.bordePaneles 
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. fal.ai API Key */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span>⚡ fal.ai API Key (FLUX.1 Dev & Schnell):</span>
                  </span>
                  <a
                    href="https://fal.ai/dashboard/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-600 hover:underline text-[11px] flex items-center gap-0.5"
                  >
                    <span>Obtener Key en fal.ai</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={tempFalKey}
                  onChange={(e) => setTempFalKey(e.target.value)}
                  placeholder="Pega aquí tu clave fal_key_... o key de fal.ai"
                  className="w-full px-3 py-1.5 rounded border text-xs font-mono outline-none"
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal
                  }}
                />
              </div>

              {/* 2. Google AI Studio Key */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                    <span>🌐 Google AI Studio API Key (Gemini / Imagen 3):</span>
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-600 hover:underline text-[11px] flex items-center gap-0.5"
                  >
                    <span>Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Pega aquí tu clave AIzaSy..."
                  className="w-full px-3 py-1.5 rounded border text-xs font-mono outline-none"
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleGuardarApiKey}
                className="px-4 py-1.5 rounded font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition"
              >
                Guardar Credenciales
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 2. CUERPO PRINCIPAL DEL ESTUDIO (2 COLUMNAS) */}
        {/* ===================================================================== */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          {/* 👈 COLUMNA IZQUIERDA: CONTROLES DE DISPARO Y CAPTURA 3D (5 Cols) */}
          <div 
            className="lg:col-span-5 flex flex-col gap-3 p-4 border-r overflow-y-auto"
            style={{ 
              backgroundColor: coloresApariencia?.fondoPaneles, 
              borderColor: coloresApariencia?.bordePaneles 
            }}
          >
            {/* Vista Previa de la Captura 3D Limpia */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Encuadre Tridimensional (3D)</span>
                </span>
                <button
                  onClick={refrescarCaptura3D}
                  className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 hover:underline"
                  title="Capturar la orientación actual de la cámara 3D"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-encuadrar 3D</span>
                </button>
              </div>

              <div className="relative aspect-video rounded-lg border overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center shadow-inner group">
                {captura3DBase64 ? (
                  <img
                    src={captura3DBase64}
                    alt="Captura 3D del mueble"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Camera className="w-6 h-6 stroke-1" />
                    <span className="text-[11px]">Generando captura...</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/70 text-white font-mono text-[10px] backdrop-blur-xs">
                  {nombreMueble}
                </div>
              </div>
            </div>

            {/* Ajustes de Motor y Aspect Ratio */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[11px]" style={{ color: coloresApariencia?.textoSecundario }}>Motor de IA:</label>
                <select
                  value={motorSeleccionadoRender}
                  onChange={(e) => setMotorSeleccionadoRender(e.target.value as any)}
                  className="px-2 py-1.5 rounded border text-xs font-bold outline-none cursor-pointer"
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal
                  }}
                >
                  <option value="fal_nano_banana_pro">👑 fal.ai - Google Nano Banana PRO (Recomendado)</option>
                  <option value="flux_schnell_free">🆓 FLUX.1 Libre (Sin Claves)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[11px]" style={{ color: coloresApariencia?.textoSecundario }}>Formato / Ratio:</label>
                <select
                  value={aspectRatioRender}
                  onChange={(e) => setAspectRatioRender(e.target.value as any)}
                  className="px-2 py-1.5 rounded border text-xs font-bold outline-none cursor-pointer"
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal
                  }}
                >
                  <option value="1:1">1:1 Cuadrado (Instagram/Catálogo)</option>
                  <option value="16:9">16:9 Panorámico (Pantalla/Web)</option>
                  <option value="4:3">4:3 Fotográfico Estándar</option>
                  <option value="9:16">9:16 Vertical (Historias/Móvil)</option>
                </select>
              </div>
            </div>

            {/* Editor de Prompt Activo */}
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[11px]" style={{ color: coloresApariencia?.textoSecundario }}>
                  Prompt Activo (En Español):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMostrarGuardarPreset(!mostrarGuardarPreset)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    title="Guardar este prompt como un nuevo preset en la biblioteca"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Guardar Preset</span>
                  </button>
                  <button
                    onClick={() => setPestanaLateral("biblioteca")}
                    className="text-[11px] font-bold text-cyan-600 hover:underline flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Biblioteca</span>
                  </button>
                </div>
              </div>

              {/* Formulario Expandible para Guardar Preset con Título */}
              {mostrarGuardarPreset && (
                <div 
                  className="p-2.5 rounded-lg border flex flex-col gap-2 shadow-sm animate-in fade-in-50 duration-200"
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Save className="w-3 h-3" />
                      <span>Guardar como Preset Predefinido</span>
                    </span>
                    {presetGuardadoExito && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 animate-bounce">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>¡Guardado con éxito!</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={nuevoPresetTitulo}
                      onChange={(e) => setNuevoPresetTitulo(e.target.value)}
                      placeholder="Título del Preset (ej: Oficina Nórdica con Laptop)..."
                      className="sm:col-span-2 px-2.5 py-1 rounded border text-xs outline-none"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal,
                      }}
                    />
                    <select
                      value={nuevoPresetCategoria}
                      onChange={(e) => setNuevoPresetCategoria(e.target.value as any)}
                      className="px-2 py-1 rounded border text-xs font-semibold outline-none"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal,
                      }}
                    >
                      <option value="Oficina">Oficina</option>
                      <option value="Hogar / Sala">Hogar / Sala</option>
                      <option value="Dormitorio">Dormitorio</option>
                      <option value="Estudio Fotográfico">Estudio Fotográfico</option>
                      <option value="Comercial / Tienda">Comercial / Tienda</option>
                      <option value="Personalizado">Personalizado</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => setMostrarGuardarPreset(false)}
                      className="px-2 py-0.5 rounded text-[11px] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGuardarComoPreset}
                      disabled={!nuevoPresetTitulo.trim()}
                      className="px-3 py-1 rounded text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50 transition"
                    >
                      Guardar en Biblioteca
                    </button>
                  </div>
                </div>
              )}

              <textarea
                rows={5}
                value={promptActivoRender}
                onChange={(e) => setPromptActivoRender(e.target.value)}
                placeholder="Describe la iluminación, la habitación o el estilo decorativo deseado en español..."
                className="w-full p-2.5 rounded-lg border text-xs font-mono leading-relaxed outline-none transition resize-none shadow-inner"
                style={{
                  backgroundColor: coloresApariencia?.fondoAplicacion,
                  borderColor: coloresApariencia?.bordePaneles,
                  color: coloresApariencia?.textoPrincipal
                }}
              />
            </div>

            {/* Mensajes de Estado / Error */}
            {errorMsg && (
              <div 
                className="p-2.5 rounded-lg border text-xs flex items-center gap-2 shadow-xs"
                style={{
                  backgroundColor: tema === "obsidian" ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
                  borderColor: tema === "obsidian" ? "rgba(239, 68, 68, 0.4)" : "#FECACA",
                  color: tema === "obsidian" ? "#FCA5A5" : "#991B1B"
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="leading-tight font-semibold">{errorMsg}</span>
              </div>
            )}
            {avisoMsg && (
              <div 
                className="p-2.5 rounded-lg border text-xs flex items-center gap-2 shadow-xs"
                style={{
                  backgroundColor: tema === "obsidian" ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB",
                  borderColor: tema === "obsidian" ? "rgba(245, 158, 11, 0.4)" : "#FDE68A",
                  color: tema === "obsidian" ? "#FCD34D" : "#92400E"
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="leading-tight font-semibold">{avisoMsg}</span>
              </div>
            )}

            {/* Botón de Disparo de Render */}
            <button
              onClick={handleGenerarRender}
              disabled={generando || !promptActivoRender.trim()}
              className="w-full py-2.5 px-4 rounded-lg font-extrabold text-sm flex items-center justify-center gap-2 transition shadow-md bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando con IA Generativa (3-5s)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar Render Fotorrealista</span>
                </>
              )}
            </button>
          </div>

          {/* 👉 COLUMNA DERECHA: BIBLIOTECA, VISOR DE RESULTADO Y GALERÍA (7 Cols) */}
          <div 
            className="lg:col-span-7 flex flex-col h-full overflow-hidden"
            style={{ backgroundColor: coloresApariencia?.fondoAplicacion }}
          >
            {/* Barra de Pestañas Derecha */}
            <div 
              className="flex items-center justify-between px-4 border-b shrink-0"
              style={{ 
                backgroundColor: coloresApariencia?.fondoPaneles,
                borderColor: coloresApariencia?.bordePaneles 
              }}
            >
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPestanaLateral("biblioteca")}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer"
                  style={{
                    borderColor: pestanaLateral === "biblioteca" ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                    color: pestanaLateral === "biblioteca" ? (coloresApariencia?.botonActivo || "#0891b2") : coloresApariencia?.textoSecundario
                  }}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Biblioteca de Prompts</span>
                </button>

                <button
                  onClick={() => setPestanaLateral("resultado")}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer"
                  style={{
                    borderColor: pestanaLateral === "resultado" ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                    color: pestanaLateral === "resultado" ? (coloresApariencia?.botonActivo || "#0891b2") : coloresApariencia?.textoSecundario
                  }}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Render Resultante</span>
                  {renderActual && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setPestanaLateral("historial")}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer"
                  style={{
                    borderColor: pestanaLateral === "historial" ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                    color: pestanaLateral === "historial" ? (coloresApariencia?.botonActivo || "#0891b2") : coloresApariencia?.textoSecundario
                  }}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Historial ({historialRendersIA.length})</span>
                </button>
              </div>
            </div>

            {/* Contenido Dinámico de la Pestaña Activa */}
            <div className="flex-1 p-4 overflow-y-auto">
              {/* 📚 PESTAÑA 1: BIBLIOTECA DE PROMPTS */}
              {pestanaLateral === "biblioteca" && (
                <PromptLibraryManager
                  onSelectPrompt={handleSelectPrompt}
                  promptSeleccionadoId={null}
                />
              )}

              {/* 🖼️ PESTAÑA 2: RENDER RESULTANTE & COMPARADOR */}
              {pestanaLateral === "resultado" && (
                <div className="flex flex-col h-full gap-3">
                  {renderActual ? (
                    <>
                      {/* Visor de Imagen con Controles de Comparación */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCompararModo("render")}
                            className="px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border"
                            style={{
                              backgroundColor: compararModo === "render" 
                                ? (coloresApariencia?.botonActivo || "#0891b2") 
                                : (coloresApariencia?.fondoPaneles || "#1E293B"),
                              borderColor: compararModo === "render"
                                ? (coloresApariencia?.botonActivo || "#0891b2")
                                : (coloresApariencia?.bordePaneles || "#334155"),
                              color: compararModo === "render" ? "#FFFFFF" : (coloresApariencia?.textoPrincipal || "#E2E8F0")
                            }}
                          >
                            Render IA Fotorrealista
                          </button>
                          <button
                            onClick={() => setCompararModo("original")}
                            className="px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border"
                            style={{
                              backgroundColor: compararModo === "original" 
                                ? (coloresApariencia?.botonActivo || "#0891b2") 
                                : (coloresApariencia?.fondoPaneles || "#1E293B"),
                              borderColor: compararModo === "original"
                                ? (coloresApariencia?.botonActivo || "#0891b2")
                                : (coloresApariencia?.bordePaneles || "#334155"),
                              color: compararModo === "original" ? "#FFFFFF" : (coloresApariencia?.textoPrincipal || "#E2E8F0")
                            }}
                          >
                            Captura 3D Original
                          </button>
                        </div>

                        {/* Botones de Acción sobre la Imagen */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* ✨ BOTÓN PROTAGONISTA: MEJORAR CON PHOTA 4K */}
                          <button
                            onClick={handleMejorarConPhota}
                            disabled={mejorandoPhota || !renderActual}
                            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-extrabold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition transform hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                            title="Mejorar nitidez, texturas y realismo 4K preservando la identidad con Phota Enhance"
                          >
                            {mejorandoPhota ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                                <span>Mejorando con Phota...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>✨ Mejorar con Phota 4K</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleCopiarImagen}
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border transition hover:opacity-80 cursor-pointer"
                            style={{ 
                              borderColor: coloresApariencia?.bordePaneles,
                              backgroundColor: coloresApariencia?.fondoPaneles,
                              color: coloresApariencia?.textoPrincipal
                            }}
                            title="Copiar imagen al portapapeles"
                          >
                            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiado ? "¡Copiado!" : "Copiar"}</span>
                          </button>

                          <button
                            onClick={handleEstablecerComoMiniatura}
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border transition hover:opacity-80 cursor-pointer"
                            style={{ 
                              borderColor: coloresApariencia?.bordePaneles,
                              backgroundColor: coloresApariencia?.fondoPaneles,
                              color: coloresApariencia?.textoPrincipal
                            }}
                            title="Guardar como miniatura oficial de este mueble"
                          >
                            {guardadoMiniatura ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Camera className="w-3.5 h-3.5" />}
                            <span>{guardadoMiniatura ? "¡Asignada!" : "Usar Miniatura"}</span>
                          </button>

                          <button
                            onClick={handleDescargarRender}
                            className="flex items-center gap-1 px-3 py-1 rounded text-xs font-bold text-white shadow-xs transition cursor-pointer hover:opacity-90"
                            style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2" }}
                            title="Descargar render en alta calidad"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar HD</span>
                          </button>
                        </div>
                      </div>

                      {/* Lienzo del Render - Protagonista Gigante */}
                      <div className="flex-1 min-h-[450px] rounded-xl border shadow-2xl overflow-hidden bg-slate-950 flex items-center justify-center relative">
                        <img
                          src={compararModo === "render" ? renderActual.imageUrl : (renderActual.imageBase64Original || captura3DBase64)}
                          alt="Render IA Generado"
                          className="w-full h-full max-h-[80vh] object-contain"
                        />
                        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-slate-950/80 text-white backdrop-blur-xs font-mono text-[11px] flex items-center gap-2 border border-white/10 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          <span className="font-bold">
                            Motor: {
                              renderActual.motorUsado === "fal_nano_banana_pro"
                                ? "Google Nano Banana PRO"
                                : renderActual.motorUsado === "fal_nano_banana"
                                ? "Google Nano Banana"
                                : renderActual.motorUsado === "fal_phota_enhance"
                                ? "Phota Enhance 4K"
                                : renderActual.motorUsado === "flux_schnell_free"
                                ? "FLUX.1 Libre"
                                : renderActual.motorUsado === "google_gemini_imagen3"
                                ? "Google Imagen 3"
                                : renderActual.motorUsado
                            }
                          </span>
                          <span className="opacity-50">•</span>
                          <span className="opacity-80">{renderActual.fecha}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-60 gap-3">
                      <Sparkles className="w-12 h-12 stroke-1 text-cyan-600" />
                      <div>
                        <p className="font-bold text-sm">Ningún render generado todavía</p>
                        <p className="text-xs">Elige un prompt de la biblioteca o escribe uno a la izquierda y presiona &quot;Generar Render Fotorrealista&quot;.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 📜 PESTAÑA 3: HISTORIAL DE RENDERS */}
              {pestanaLateral === "historial" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: coloresApariencia?.bordePaneles }}>
                    <span className="font-bold text-xs">Renders Generados en esta Sesión</span>
                    <span className="text-[11px] opacity-60">{historialRendersIA.length} imágenes</span>
                  </div>

                  {historialRendersIA.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center opacity-60 gap-2">
                      <History className="w-8 h-8 stroke-1" />
                      <p className="text-xs font-semibold">El historial está vacío.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {historialRendersIA.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setRenderActual(item);
                            setPestanaLateral("resultado");
                          }}
                          className="group relative rounded-lg border overflow-hidden cursor-pointer transition hover:ring-2 hover:ring-cyan-500 shadow-sm"
                          style={{ borderColor: coloresApariencia?.bordePaneles }}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.promptUsado}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-between">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminarRenderHistorial(item.id);
                              }}
                              className="self-end p-1 rounded bg-red-600/80 text-white hover:bg-red-700 transition"
                              title="Eliminar de historial"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <p className="text-[10px] text-white font-mono line-clamp-2">
                              {item.promptUsado}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

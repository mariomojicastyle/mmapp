"use client";

import React, { useState, useEffect, useRef } from "react";
import { use3BFStore, MaterialPBRDef } from "@/lib/store";
import ShaderBallViewer from "@/components/viewer/ShaderBallViewer";
import {
  autoGenerarSetPBRCompleto,
  generarNormalMap,
  generarRoughnessMap,
  generarAOMap,
  ajustarDiffuseMap,
} from "@/lib/pbrMapGenerator";
import {
  Sparkles,
  X,
  Upload,
  Layers,
  Sun,
  Sliders,
  CheckCircle2,
  Save,
  Palette,
  RefreshCw,
  Eye,
  Box,
  Circle,
  Square,
  Info,
  Check,
  Maximize2,
  Minimize2,
} from "lucide-react";

export default function PBRMaterialStudioModal() {
  const {
    modalPBRStudioAbierto,
    setModalPBRStudioAbierto,
    setModalRenderIAAbierto,
    setPromptActivoRender,
    materialEnCalibracion,
    setMaterialEnCalibracion,
    materialesPBR,
    actualizarMaterialPBR,
    crearMaterialPBR,
    aplicarMaterialAMuebleActivo,
    coloresApariencia,
    tema,
    calibracion,
    setCalibracion,
  } = use3BFStore();

  const [matLocal, setMatLocal] = useState<MaterialPBRDef | null>(null);
  const [formaVisor, setFormaVisor] = useState<"esfera" | "tablero" | "cubo" | "mueble">("esfera");
  const [pantallaCompleta, setPantallaCompleta] = useState<boolean>(false);
  const [rotacionLuz, setRotacionLuz] = useState<number>(45);
  const [procesandoPBR, setProcesandoPBR] = useState<boolean>(false);
  const [guardadoExito, setGuardadoExito] = useState<boolean>(false);
  const [aplicadoExito, setAplicadoExito] = useState<boolean>(false);

  // Configuración de Iluminación HDRI (Poly Haven Alps Field + Custom)
  const [hdriConfig, setHdriConfig] = useState<{
    tipo: "alps_field_sol" | "modern_bathroom" | "estudio_suave" | "apartamento_calido" | "showroom_moderno" | "personalizado";
    customHdrUrl?: string | null;
    intensidad: number;
    rotacion: number;
    mostrarFondo: boolean;
    blurFondo: number;
    sombraOpacidad: number;
    sombraDifuminado: number;
  }>({
    tipo: "alps_field_sol",
    intensidad: 1.0,
    rotacion: 45,
    mostrarFondo: true,
    blurFondo: 0.5,
    sombraOpacidad: 0.22,
    sombraDifuminado: 2.4,
    customHdrUrl: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hdrFileInputRef = useRef<HTMLInputElement>(null);

  const handleSubirHdrPersonalizado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setHdriConfig((prev) => ({
      ...prev,
      tipo: "personalizado",
      customHdrUrl: url,
    }));
  };

  // Sincronizar con el material enviado a calibración
  useEffect(() => {
    if (modalPBRStudioAbierto) {
      let targetMat = materialEnCalibracion;
      if (!targetMat) {
        // Priorizar Duna o Marfil sobre metales
        targetMat =
          materialesPBR.find((m) => m.id === "mat_duna") ||
          materialesPBR.find((m) => m.id === "mat_marfil") ||
          materialesPBR.find((m) => m.tipo === "Melamina" || m.tipo === "Madera") ||
          materialesPBR[0];
      }
      if (targetMat) {
        const matCopia: MaterialPBRDef = JSON.parse(JSON.stringify(targetMat));
        setMatLocal(matCopia);

        // Si tiene textura difusa pero no tiene mapas normales calculados, auto-generarlos al instante
        if (matCopia.texturaUrl && (!matCopia.normalMapUrl || !matCopia.roughnessMapUrl)) {
          autoGenerarSetPBRCompleto(matCopia.texturaUrl, matCopia.tipo as any).then((pbrSet) => {
            setMatLocal((prev) =>
              prev && prev.id === matCopia.id
                ? {
                    ...prev,
                    normalMapUrl: pbrSet.normalUrl,
                    roughnessMapUrl: pbrSet.roughnessUrl,
                    aoMapUrl: pbrSet.aoUrl,
                    colorBase: "#FFFFFF",
                  }
                : prev
            );
          });
        }
      }
    }
  }, [modalPBRStudioAbierto, materialEnCalibracion, materialesPBR]);

  const handleSeleccionarMaterialCatalogo = (id: string) => {
    const found = materialesPBR.find((m) => m.id === id);
    if (!found) return;
    const matCopia: MaterialPBRDef = JSON.parse(JSON.stringify(found));
    setMatLocal(matCopia);
    setMaterialEnCalibracion(matCopia);

    if (matCopia.texturaUrl && (!matCopia.normalMapUrl || !matCopia.roughnessMapUrl)) {
      setProcesandoPBR(true);
      autoGenerarSetPBRCompleto(matCopia.texturaUrl, matCopia.tipo as any)
        .then((pbrSet) => {
          setMatLocal((prev) =>
            prev
              ? {
                  ...prev,
                  normalMapUrl: pbrSet.normalUrl,
                  roughnessMapUrl: pbrSet.roughnessUrl,
                  aoMapUrl: pbrSet.aoUrl,
                  colorBase: "#FFFFFF",
                }
              : null
          );
        })
        .finally(() => setProcesandoPBR(false));
    }
  };

  if (!modalPBRStudioAbierto || !matLocal) return null;

  // Subir nueva textura difusa
  const handleSubirTextura = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Extraer nombre del archivo sin extension (ej: "Duna.jpg" -> "Duna")
    const nombreArchivo = file.name.replace(/\.[^/.]+$/, "").trim();
    const esNombreGenerico = !matLocal.nombre || matLocal.nombre === "Acero" || matLocal.nombre.startsWith("Material");
    const nuevoNombre = esNombreGenerico ? (nombreArchivo || "Melamina Personalizada") : matLocal.nombre;
    const nuevoTipo = (matLocal.tipo === "Metal" || matLocal.tipo === "PBR") ? "Melamina" : matLocal.tipo;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setProcesandoPBR(true);
        try {
          // Auto-generar inmediatamente el set PBR completo al cargar la textura
          const pbrSet = await autoGenerarSetPBRCompleto(dataUrl, nuevoTipo as any);
          setMatLocal((prev) =>
            prev
              ? {
                  ...prev,
                  nombre: nuevoNombre,
                  tipo: nuevoTipo as any,
                  colorBase: "#FFFFFF", // Blanco puro para que la textura difusa se vea con su color natural
                  texturaUrl: pbrSet.diffuseUrl,
                  normalMapUrl: pbrSet.normalUrl,
                  roughnessMapUrl: pbrSet.roughnessUrl,
                  aoMapUrl: pbrSet.aoUrl,
                  rugosidad: pbrSet.roughnessBase,
                  metalico: pbrSet.metallicBase,
                  clearcoat: pbrSet.clearcoat,
                  normalScale: 1.2,
                  aoIntensity: 1.0,
                }
              : null
          );
        } catch (err) {
          console.error("Error auto-generando mapas PBR:", err);
        } finally {
          setProcesandoPBR(false);
        }
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Disparar auto-generación de mapas PBR manual
  const handleAutoCalcularPBR = async () => {
    if (!matLocal.texturaUrl) return;
    setProcesandoPBR(true);
    try {
      const pbrSet = await autoGenerarSetPBRCompleto(
        matLocal.texturaUrl,
        matLocal.tipo as any,
        {
          normalStrength: matLocal.normalScale ?? 1.8,
          roughnessBase: matLocal.rugosidad ?? 0.5,
          diffuseBrightness: matLocal.ajustesTextura?.brillo ?? 0,
          diffuseContrast: matLocal.ajustesTextura?.contraste ?? 1.0,
          diffuseSaturation: matLocal.ajustesTextura?.saturacion ?? 1.0,
          normalInvertY: matLocal.ajustesTextura?.normalInvertY ?? false,
          roughnessInvert: matLocal.ajustesTextura?.roughnessInvert ?? false,
        }
      );
      setMatLocal((prev) =>
        prev
          ? {
              ...prev,
              normalMapUrl: pbrSet.normalUrl,
              roughnessMapUrl: pbrSet.roughnessUrl,
              aoMapUrl: pbrSet.aoUrl,
            }
          : null
      );
    } catch (e) {
      console.error("Error al calcular mapas PBR:", e);
    } finally {
      setProcesandoPBR(false);
    }
  };

  // Ajustar Normal Map en vivo
  const handleCambiarNormalScale = async (scale: number) => {
    setMatLocal((prev) => (prev ? { ...prev, normalScale: scale } : null));
    if (matLocal.texturaUrl) {
      try {
        const norm = await generarNormalMap(matLocal.texturaUrl, {
          normalStrength: scale * 1.5,
          normalInvertY: matLocal.ajustesTextura?.normalInvertY ?? false,
        });
        setMatLocal((prev) => (prev ? { ...prev, normalMapUrl: norm } : null));
      } catch {}
    }
  };

  // Ajustar Roughness Map en vivo
  const handleCambiarRugosidadBase = async (val: number) => {
    setMatLocal((prev) => (prev ? { ...prev, rugosidad: val } : null));
    if (matLocal.texturaUrl) {
      try {
        const rough = await generarRoughnessMap(matLocal.texturaUrl, {
          roughnessBase: val,
          roughnessInvert: matLocal.ajustesTextura?.roughnessInvert ?? false,
        });
        setMatLocal((prev) => (prev ? { ...prev, roughnessMapUrl: rough } : null));
      } catch {}
    }
  };

  // Guardar en catálogo persistente
  const handleGuardarMaterial = () => {
    if (!matLocal) return;
    const existe = materialesPBR.find((m) => m.id === matLocal.id);
    if (existe) {
      actualizarMaterialPBR(matLocal.id, matLocal);
    } else {
      crearMaterialPBR(matLocal);
    }
    setGuardadoExito(true);
    setTimeout(() => setGuardadoExito(false), 2000);
  };

  // Aplicar al mueble 3D activo
  const handleAplicarAlMueble = () => {
    if (!matLocal) return;
    handleGuardarMaterial();
    aplicarMaterialAMuebleActivo(matLocal.id);
    setAplicadoExito(true);
    setTimeout(() => setAplicadoExito(false), 2000);
  };

  // Disparar Render AI con la calibración activa
  const handleLanzarRenderIA = () => {
    if (matLocal) {
      handleGuardarMaterial();
      aplicarMaterialAMuebleActivo(matLocal.id);
    }
    if (typeof window !== "undefined") {
      let snap = "";
      if ((window as any).__capturarShaderBallSnapshot) {
        snap = (window as any).__capturarShaderBallSnapshot() || "";
      }
      if (snap) {
        (window as any).__3bfPBRSnapshot = snap;
      }
    }
    if (matLocal && matLocal.nombre) {
      setPromptActivoRender(
        `Fotografía editorial de arquitectura de alta gama del mueble de diseño contemporáneo acabado en ${matLocal.nombre}. Mantén con total precisión la geometría del producto, la separación de tableros, aristas nítidas y la veta natural de la madera. Decora la escena en un espacio interior moderno con luz diurna difusa, suelo de madera clara y sombras de contacto reales.`
      );
    }
    setModalPBRStudioAbierto(false);
    setModalRenderIAAbierto(true);
  };

  const modalClasses = pantallaCompleta
    ? "fixed inset-0 z-50 flex flex-col bg-slate-950/85 backdrop-blur-sm"
    : "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/75 backdrop-blur-sm";

  const containerClasses = pantallaCompleta
    ? "w-full h-full border-none flex flex-col shadow-2xl overflow-hidden"
    : "w-[98vw] max-w-[1700px] h-[95vh] max-h-[1020px] rounded-xl border flex flex-col shadow-2xl overflow-hidden";

  return (
    <div className={modalClasses}>
      <div
        className={containerClasses}
        style={{
          backgroundColor: coloresApariencia?.fondoAplicacion,
          borderColor: coloresApariencia?.bordePaneles,
          color: coloresApariencia?.textoPrincipal,
        }}
      >
        {/* ===================================================================== */}
        {/* 1. CABECERA DEL PBR STUDIO */}
        {/* ===================================================================== */}
        <div
          className="px-4 py-2.5 border-b flex items-center justify-between gap-3 shrink-0"
          style={{
            backgroundColor: coloresApariencia?.fondoPaneles,
            borderColor: coloresApariencia?.bordePaneles,
          }}
        >
          <div className="flex items-center gap-2.5">
            <div 
              className="p-1.5 rounded-lg text-white shadow-xs"
              style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2" }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base tracking-tight" style={{ color: coloresApariencia?.textoPrincipal }}>
                  3BF PBR Material Studio
                </h2>
                <span 
                  className="px-2 py-0.5 rounded-full text-[10px] font-extrabold border"
                  style={{
                    backgroundColor: tema === "obsidian" ? "rgba(99, 102, 241, 0.18)" : "#EEF2FF",
                    color: tema === "obsidian" ? "#A5B4FC" : "#4338CA",
                    borderColor: tema === "obsidian" ? "rgba(99, 102, 241, 0.35)" : "#C7D2FE"
                  }}
                >
                  Calibrador Físico 3D & IBL
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Material del Catálogo */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-2xs"
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
              }}
            >
              <span className="text-[11px] font-bold opacity-75" style={{ color: coloresApariencia?.textoSecundario }}>Material:</span>
              <select
                value={matLocal.id}
                onChange={(e) => handleSeleccionarMaterialCatalogo(e.target.value)}
                className="bg-transparent text-xs font-extrabold outline-none cursor-pointer"
                style={{ color: coloresApariencia?.textoPrincipal }}
              >
                {materialesPBR.map((m) => (
                  <option 
                    key={m.id} 
                    value={m.id} 
                    style={{ 
                      backgroundColor: coloresApariencia?.fondoPaneles || (tema === "obsidian" ? "#161B22" : "#FFFFFF"), 
                      color: coloresApariencia?.textoPrincipal || (tema === "obsidian" ? "#F0F6FC" : "#0F172A") 
                    }}
                  >
                    {m.nombre} ({m.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* Alternar Pantalla Completa */}
            <button
              onClick={() => setPantallaCompleta(!pantallaCompleta)}
              className="p-1.5 rounded-lg border transition cursor-pointer hover:opacity-80"
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
                color: coloresApariencia?.textoPrincipal
              }}
              title={pantallaCompleta ? "Restaurar tamaño" : "Pantalla completa"}
            >
              {pantallaCompleta ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setModalPBRStudioAbierto(false)}
              className="p-1.5 rounded-lg border transition cursor-pointer hover:opacity-80"
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

        {/* ===================================================================== */}
        {/* 2. CUERPO PRINCIPAL: 2 COLUMNAS (PANEL DE CONTROL 390px + ESFERA GIGANTE) */}
        {/* ===================================================================== */}
        <div className="flex-1 flex flex-col md:flex-row gap-0 overflow-hidden">
          {/* 👈 COLUMNA LATERAL IZQUIERDA: CONTROLES PBR & PROPIEDADES (390px) */}
          <div
            className="w-full md:w-[390px] lg:w-[420px] flex flex-col gap-3 p-3.5 border-r overflow-y-auto shrink-0 shadow-sm"
            style={{
              backgroundColor: coloresApariencia?.fondoPaneles,
              borderColor: coloresApariencia?.bordePaneles,
            }}
          >
            {/* Cabecera de Canales & Botón de Subida */}
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Canales PBR Físicos</span>
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1 transition cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Cargar Foto</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSubirTextura}
                className="hidden"
              />
            </div>

            {/* Botón Mágico: Auto-Calcular PBR */}
            <button
              onClick={handleAutoCalcularPBR}
              disabled={procesandoPBR || !matLocal.texturaUrl}
              className="w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white disabled:opacity-50 cursor-pointer"
            >
              {procesandoPBR ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculando Normales & Rugosidad...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>✨ Auto-Generar Canales PBR (0.1s)</span>
                </>
              )}
            </button>

            {/* Miniaturas de los 4 Canales PBR */}
            <div className="grid grid-cols-2 gap-2">
              {/* Canal 1: Diffuse / Albedo */}
              <div className="p-2 rounded-lg border flex flex-col gap-1.5 shadow-2xs" style={{ borderColor: coloresApariencia?.bordePaneles }}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 dark:text-slate-200">1. Diffuse</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={matLocal.colorBase || "#FFFFFF"}
                      onChange={(e) => setMatLocal({ ...matLocal, colorBase: e.target.value })}
                      className="w-4 h-4 rounded border cursor-pointer"
                      title="Tinte de color"
                    />
                  </div>
                </div>
                <div className="w-full h-16 rounded border overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  {matLocal.texturaUrl ? (
                    <img src={matLocal.texturaUrl} alt="Diffuse" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ backgroundColor: matLocal.colorBase }} />
                  )}
                </div>
              </div>

              {/* Canal 2: Normal Map */}
              <div className="p-2 rounded-lg border flex flex-col gap-1.5 shadow-2xs" style={{ borderColor: coloresApariencia?.bordePaneles }}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">2. Normal</span>
                  <span className="text-[10px] font-mono">{(matLocal.normalScale ?? 1.2).toFixed(1)}x</span>
                </div>
                <div className="w-full h-16 rounded border overflow-hidden bg-indigo-950 flex items-center justify-center">
                  {matLocal.normalMapUrl ? (
                    <img src={matLocal.normalMapUrl} alt="Normal" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-indigo-300 font-mono">Sin Normal</span>
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={matLocal.normalScale ?? 1.2}
                  onChange={(e) => handleCambiarNormalScale(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-300 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Canal 3: Roughness Map */}
              <div className="p-2 rounded-lg border flex flex-col gap-1.5 shadow-2xs" style={{ borderColor: coloresApariencia?.bordePaneles }}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-600 dark:text-amber-400">3. Roughness</span>
                  <span className="text-[10px] font-mono">{(matLocal.rugosidad ?? 0.5).toFixed(2)}</span>
                </div>
                <div className="w-full h-16 rounded border overflow-hidden bg-slate-900 flex items-center justify-center">
                  {matLocal.roughnessMapUrl ? (
                    <img src={matLocal.roughnessMapUrl} alt="Roughness" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-slate-400 font-mono">Sin Mapa</span>
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={matLocal.rugosidad ?? 0.5}
                  onChange={(e) => handleCambiarRugosidadBase(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-300 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-amber-600"
                />
              </div>

              {/* Canal 4: AO */}
              <div className="p-2 rounded-lg border flex flex-col gap-1.5 shadow-2xs" style={{ borderColor: coloresApariencia?.bordePaneles }}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-600 dark:text-slate-300">4. AO Poro</span>
                  <span className="text-[10px] font-mono">{(matLocal.aoIntensity ?? 1.0).toFixed(1)}x</span>
                </div>
                <div className="w-full h-16 rounded border overflow-hidden bg-slate-900 flex items-center justify-center">
                  {matLocal.aoMapUrl ? (
                    <img src={matLocal.aoMapUrl} alt="AO" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-slate-400 font-mono">Sin AO</span>
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={matLocal.aoIntensity ?? 1.0}
                  onChange={(e) => setMatLocal({ ...matLocal, aoIntensity: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-slate-300 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-slate-600"
                />
              </div>
            </div>

            {/* SECCIÓN 2: PROPIEDADES PRINCIPLED BSDF */}
            <div className="pt-2 border-t flex flex-col gap-2.5" style={{ borderColor: coloresApariencia?.bordePaneles }}>
              <span className="font-extrabold text-xs flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. Parámetros Físicos Principled BSDF</span>
              </span>

              {/* Nombre y Tipo */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] opacity-70">Nombre:</label>
                  <input
                    type="text"
                    value={matLocal.nombre}
                    onChange={(e) => setMatLocal({ ...matLocal, nombre: e.target.value })}
                    className="px-2 py-1 rounded border text-xs font-bold outline-none"
                    style={{
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      borderColor: coloresApariencia?.bordePaneles,
                      color: coloresApariencia?.textoPrincipal,
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] opacity-70">Tipo:</label>
                  <select
                    value={matLocal.tipo}
                    onChange={(e) => setMatLocal({ ...matLocal, tipo: e.target.value as any })}
                    className="px-2 py-1 rounded border text-xs font-bold outline-none"
                    style={{
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      borderColor: coloresApariencia?.bordePaneles,
                      color: coloresApariencia?.textoPrincipal,
                    }}
                  >
                    <option value="Melamina">Melamina / Laminado</option>
                    <option value="Madera">Madera Maciza</option>
                    <option value="Metal">Metal / Herraje</option>
                    <option value="Plastico">Plástico</option>
                    <option value="Pintura">Pintura / Laca</option>
                    <option value="PBR">PBR Genérico</option>
                  </select>
                </div>
              </div>

              {/* Sliders Principled Apilados Verticalmente a Ancho Completo */}
              <div className="flex flex-col gap-2.5 pt-1">
                {/* 1. Metálico */}
                <div className="flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold opacity-75">Metálico (Metallic):</span>
                    <span className="font-mono font-extrabold text-cyan-600 dark:text-cyan-400">
                      {(matLocal.metalico ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={matLocal.metalico ?? 0}
                    onChange={(e) => setMatLocal({ ...matLocal, metalico: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>

                {/* 2. Resina / Barniz (Clearcoat) - Alta Sensibilidad */}
                <div className="flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold opacity-75">Resina / Barniz (Clearcoat):</span>
                    <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                      {(matLocal.clearcoat ?? 0).toFixed(3)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.005"
                    value={matLocal.clearcoat ?? 0}
                    onChange={(e) => setMatLocal({ ...matLocal, clearcoat: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* 3. Difusión del Brillo (Clearcoat Roughness) */}
                <div className="flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold opacity-75">Difusión del Brillo (Satinado):</span>
                    <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400">
                      {(matLocal.clearcoatRoughness ?? 0.35).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={matLocal.clearcoatRoughness ?? 0.35}
                    onChange={(e) => setMatLocal({ ...matLocal, clearcoatRoughness: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                {/* 4. Índice de Refracción (IOR) */}
                <div className="flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="font-bold opacity-75">Índice de Refracción (IOR):</span>
                    <span className="font-mono font-extrabold" style={{ color: coloresApariencia?.textoPrincipal }}>
                      {(matLocal.ior ?? 1.5).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.01"
                    value={matLocal.ior ?? 1.5}
                    onChange={(e) => setMatLocal({ ...matLocal, ior: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* 3. Delineado y Control de Aristas 3D */}
            <div 
              className="flex flex-col gap-2 p-3 rounded-lg border shadow-xs"
              style={{
                backgroundColor: coloresApariencia?.fondoPaneles,
                borderColor: coloresApariencia?.bordePaneles
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: coloresApariencia?.textoPrincipal }}>
                  <span>📐 3. Control de Aristas & Contornos</span>
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-[11px]">
                  <input
                    type="checkbox"
                    checked={calibracion.mostrarAristas !== false}
                    onChange={(e) => setCalibracion("mostrarAristas", e.target.checked)}
                    className="rounded cursor-pointer"
                  />
                  <span style={{ color: coloresApariencia?.textoPrincipal }}>Activar</span>
                </label>
              </div>

              {calibracion.mostrarAristas !== false && (
                <div className="flex flex-col gap-2 pt-1 border-t" style={{ borderColor: coloresApariencia?.bordePaneles }}>
                  {/* Color de Arista */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold opacity-75" style={{ color: coloresApariencia?.textoSecundario }}>Color de Arista:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={calibracion.colorAristas || "#111827"}
                        onChange={(e) => setCalibracion("colorAristas", e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        title="Seleccionar color de las aristas"
                      />
                      <span className="font-mono text-[10px] uppercase font-bold" style={{ color: coloresApariencia?.textoPrincipal }}>
                        {calibracion.colorAristas || "#111827"}
                      </span>
                    </div>
                  </div>

                  {/* Opacidad de Arista */}
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold opacity-75" style={{ color: coloresApariencia?.textoSecundario }}>Opacidad de Aristas:</span>
                      <span className="font-mono font-extrabold" style={{ color: coloresApariencia?.textoPrincipal }}>
                        {Math.round((calibracion.opacidadAristas ?? 0.75) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={calibracion.opacidadAristas ?? 0.75}
                      onChange={(e) => setCalibracion("opacidadAristas", parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    />
                  </div>

                  {/* Ángulo Umbral (Threshold) */}
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold opacity-75" style={{ color: coloresApariencia?.textoSecundario }}>Ángulo de Delineado:</span>
                      <span className="font-mono font-extrabold" style={{ color: coloresApariencia?.textoPrincipal }}>
                        {calibracion.thresholdAristas ?? 25}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="89"
                      step="1"
                      value={calibracion.thresholdAristas ?? 25}
                      onChange={(e) => setCalibracion("thresholdAristas", parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="mt-auto pt-3 border-t flex flex-col gap-2" style={{ borderColor: coloresApariencia?.bordePaneles }}>
              <button
                onClick={handleGuardarMaterial}
                className="w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer hover:opacity-90 shadow-2xs"
                style={{
                  backgroundColor: coloresApariencia?.fondoPaneles,
                  borderColor: coloresApariencia?.bordePaneles,
                  color: coloresApariencia?.textoPrincipal
                }}
              >
                {guardadoExito ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>¡Guardado en Catálogo!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar en Catálogo PBR</span>
                  </>
                )}
              </button>

              <button
                onClick={handleAplicarAlMueble}
                className="w-full py-2 px-3 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1.5 text-white shadow-xs transition cursor-pointer hover:opacity-90"
                style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2" }}
              >
                {aplicadoExito ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>¡Aplicado al Mueble 3D!</span>
                  </>
                ) : (
                  <>
                    <Palette className="w-3.5 h-3.5" />
                    <span>🎯 Aplicar al Mueble 3D Activo</span>
                  </>
                )}
              </button>

              {/* Botón Destacado: Lanzar Render AI con esta calibración */}
              <button
                onClick={handleLanzarRenderIA}
                className="w-full py-2.5 px-4 rounded-lg font-extrabold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md transition transform hover:scale-[1.01] cursor-pointer"
                title="Aplicar este material y abrir el estudio de Render Fotorrealista con IA"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>✨ Lanzar Render AI con este Material</span>
              </button>
            </div>
          </div>

          {/* 🔮 ÁREA PROTAGONISTA DERECHA: SHADER BALL 3D GIGANTE */}
          <div 
            className="flex-1 flex flex-col p-3 gap-2.5 overflow-hidden relative"
            style={{ backgroundColor: coloresApariencia?.fondoAplicacion }}
          >
            {/* Barra Flotante Superior: Selector de Forma y Controles de Aristas */}
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              <span className="font-extrabold text-xs flex items-center gap-1.5" style={{ color: coloresApariencia?.textoPrincipal }}>
                <Eye className="w-3.5 h-3.5" style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} />
                <span>Shader Ball 3D Interactivo (Rotar con el Mouse 360°)</span>
              </span>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Control de Aristas y Contornos */}
                <div 
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs border shadow-xs"
                  style={{
                    backgroundColor: coloresApariencia?.fondoPaneles,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal
                  }}
                >
                  <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-[11px]">
                    <input
                      type="checkbox"
                      checked={calibracion.mostrarAristas !== false}
                      onChange={(e) => setCalibracion("mostrarAristas", e.target.checked)}
                      className="rounded cursor-pointer"
                    />
                    <span style={{ color: coloresApariencia?.textoPrincipal }}>📐 Aristas</span>
                  </label>

                  {calibracion.mostrarAristas !== false && (
                    <div className="flex items-center gap-1.5 border-l pl-2" style={{ borderColor: coloresApariencia?.bordePaneles }}>
                      <input
                        type="color"
                        value={calibracion.colorAristas || "#111827"}
                        onChange={(e) => setCalibracion("colorAristas", e.target.value)}
                        className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                        title="Color de las aristas"
                      />
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={calibracion.opacidadAristas ?? 0.75}
                        onChange={(e) => setCalibracion("opacidadAristas", parseFloat(e.target.value))}
                        className="w-14 h-1 rounded appearance-none cursor-pointer"
                        title="Opacidad de las aristas"
                      />
                      <span className="font-mono text-[10px] font-bold opacity-80" style={{ color: coloresApariencia?.textoPrincipal }}>
                        {Math.round((calibracion.opacidadAristas ?? 0.75) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Selector de Geometría de prueba */}
                <div 
                  className="flex items-center gap-1 p-0.5 rounded-lg border shadow-xs"
                  style={{
                    backgroundColor: coloresApariencia?.fondoPaneles,
                    borderColor: coloresApariencia?.bordePaneles
                  }}
                >
                  <button
                    onClick={() => setFormaVisor("esfera")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition cursor-pointer font-bold"
                    style={{
                      backgroundColor: formaVisor === "esfera" ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                      color: formaVisor === "esfera" ? "#FFFFFF" : coloresApariencia?.textoSecundario
                    }}
                    title="Shader Ball Esférica"
                  >
                    <Circle className="w-3.5 h-3.5" />
                    <span>Esfera</span>
                  </button>
                  <button
                    onClick={() => setFormaVisor("tablero")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition cursor-pointer font-bold"
                    style={{
                      backgroundColor: formaVisor === "tablero" ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                      color: formaVisor === "tablero" ? "#FFFFFF" : coloresApariencia?.textoSecundario
                    }}
                    title="Tablero Plano de Melamina con Canto"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Tablero Melamina</span>
                  </button>
                  <button
                    onClick={() => setFormaVisor("cubo")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition cursor-pointer font-bold"
                    style={{
                      backgroundColor: formaVisor === "cubo" ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                      color: formaVisor === "cubo" ? "#FFFFFF" : coloresApariencia?.textoSecundario
                    }}
                    title="Cubo Biselado"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Cubo</span>
                  </button>
                  <button
                    onClick={() => setFormaVisor("mueble")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition cursor-pointer font-bold"
                    style={{
                      backgroundColor: formaVisor === "mueble" ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                      color: formaVisor === "mueble" ? "#FFFFFF" : coloresApariencia?.textoSecundario
                    }}
                    title="Previsualizar en el Mueble Real Completo"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>🪑 Mueble Real</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas 3D Shader Ball Gigante */}
            <div className="flex-1 min-h-[420px] rounded-xl overflow-hidden border shadow-2xl relative" style={{ borderColor: coloresApariencia?.bordePaneles }}>
              <ShaderBallViewer
                materialDef={matLocal}
                forma={formaVisor}
                hdriConfig={hdriConfig}
              />
            </div>

            {/* Barra Inferior: Controles de Iluminación HDRI */}
            <div 
              className="p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-md" 
              style={{ 
                backgroundColor: coloresApariencia?.fondoPaneles, 
                borderColor: coloresApariencia?.bordePaneles 
              }}
            >
              {/* Selector HDRI */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5" />
                  <span>Entorno HDRI:</span>
                </span>
                <select
                  value={hdriConfig.tipo}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    if (val === "personalizado") {
                      hdrFileInputRef.current?.click();
                    } else {
                      setHdriConfig({ ...hdriConfig, tipo: val });
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg border text-xs font-extrabold outline-none cursor-pointer"
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal,
                  }}
                >
                  <option value="alps_field_sol">🏔️ Alps Field (Poly Haven)</option>
                  <option value="modern_bathroom">🛁 Baño Moderno (Poly Haven Interior)</option>
                  <option value="estudio_suave">📸 Estudio Fotográfico (Softbox)</option>
                  <option value="apartamento_calido">🛋️ Apartamento Nórdico (Interior)</option>
                  <option value="showroom_moderno">🏢 Showroom / Galería</option>
                  <option value="personalizado">📂 Cargar .HDR Propio...</option>
                </select>
                <input
                  ref={hdrFileInputRef}
                  type="file"
                  accept=".hdr,.exr"
                  onChange={handleSubirHdrPersonalizado}
                  className="hidden"
                />
              </div>

              {/* Sliders HDRI e Iluminación */}
              <div className="flex items-center gap-3 flex-1 min-w-[340px] justify-end flex-wrap">
                {/* Intensidad de Luz */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] opacity-70">Luz:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={hdriConfig.intensidad}
                    onChange={(e) => setHdriConfig({ ...hdriConfig, intensidad: parseFloat(e.target.value) })}
                    className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="font-mono text-[10px] font-bold w-6">{hdriConfig.intensidad.toFixed(1)}x</span>
                </div>

                {/* Rotación HDRI */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] opacity-70">Giro:</span>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hdriConfig.rotacion}
                    onChange={(e) => setHdriConfig({ ...hdriConfig, rotacion: parseInt(e.target.value) })}
                    className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-600"
                  />
                  <span className="font-mono text-[10px] font-bold w-7">{hdriConfig.rotacion}°</span>
                </div>

                {/* Opacidad / Oscuridad de la Sombra */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Sombra:</span>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.02"
                    value={hdriConfig.sombraOpacidad}
                    onChange={(e) => setHdriConfig({ ...hdriConfig, sombraOpacidad: parseFloat(e.target.value) })}
                    className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-indigo-600"
                    title="Controlar qué tan oscura o suave es la sombra de contacto"
                  />
                  <span className="font-mono text-[10px] font-bold w-7">{Math.round(hdriConfig.sombraOpacidad * 100)}%</span>
                </div>

                {/* Difuminado / Suavidad de la Sombra */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] opacity-70">Difusión:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={hdriConfig.sombraDifuminado}
                    onChange={(e) => setHdriConfig({ ...hdriConfig, sombraDifuminado: parseFloat(e.target.value) })}
                    className="w-16 h-1 bg-slate-300 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-purple-600"
                    title="Controlar el difuminado suave del borde de la sombra"
                  />
                  <span className="font-mono text-[10px] font-bold w-6">{hdriConfig.sombraDifuminado.toFixed(1)}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

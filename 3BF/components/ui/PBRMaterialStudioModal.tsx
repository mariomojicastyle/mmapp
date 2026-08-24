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

// Icono Oficial Dresser (Material Symbols - Cómoda / Mueble con Cajones)
function DresserIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M4 21v-2h1v-4H4v-2h1V9H4V7h1V3h14v4h1v2h-1v4h1v2h-1v4h1v2h-2v-2H6v2H4zm3-4h10v-2H7v2zm0-6h10V9H7v2zm0-6h10V5H7v2z" />
    </svg>
  );
}

export default function PBRMaterialStudioModal() {
  const {
    modalPBRStudioAbierto,
    setModalPBRStudioAbierto,
    setModalRenderIAAbierto,
    setPromptActivoRender,
    materialEnCalibracion,
    setMaterialEnCalibracion,
    materialesPBR,
    capas,
    materialSeleccionadoId,
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

  // Sincronizar con el material activo del mueble o catálogo al abrir el estudio
  useEffect(() => {
    if (modalPBRStudioAbierto) {
      let targetMat = materialEnCalibracion;
      if (!targetMat) {
        // 1. Buscar si hay una capa activa con material asignado (ej: capa_tono)
        const capaActiva = capas.find((c) => c.activa) || capas.find((c) => c.id === "capa_tono");
        const matCapa = capaActiva ? materialesPBR.find((m) => m.id === capaActiva.materialId) : null;
        
        // 2. O el materialSeleccionadoId
        const matSel = materialSeleccionadoId ? materialesPBR.find((m) => m.id === materialSeleccionadoId) : null;

        // 3. O priorizar materiales con textura como Duna o Marfil
        targetMat =
          matCapa ||
          matSel ||
          materialesPBR.find((m) => m.id === "mat_duna") ||
          materialesPBR.find((m) => m.id === "mat_marfil") ||
          materialesPBR.find((m) => m.texturaUrl) ||
          materialesPBR[0];
      }

      if (targetMat) {
        const matCopia: MaterialPBRDef = JSON.parse(JSON.stringify(targetMat));
        setMatLocal(matCopia);

        // Si tiene textura pero le faltan normales/rugosidad, auto-generar de inmediato para vestir el 3D
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
  }, [modalPBRStudioAbierto, materialEnCalibracion, materialesPBR, capas, materialSeleccionadoId]);

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

  // Guardar en catálogo persistente y aplicar automáticamente al mueble activo
  const handleGuardarMaterial = () => {
    if (!matLocal) return;
    const existe = materialesPBR.find((m) => m.id === matLocal.id);
    if (existe) {
      actualizarMaterialPBR(matLocal.id, matLocal);
    } else {
      crearMaterialPBR(matLocal);
    }
    aplicarMaterialAMuebleActivo(matLocal.id);
    setGuardadoExito(true);
    setTimeout(() => setGuardadoExito(false), 2000);
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
            <h2 className="font-extrabold text-sm sm:text-base tracking-tight" style={{ color: coloresApariencia?.textoPrincipal }}>
              3BF Material Studio
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Material del Catálogo */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-2xs"
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
              }}
            >
              <span className="text-[11px] font-semibold opacity-75" style={{ color: coloresApariencia?.textoSecundario }}>Material:</span>
              <select
                value={matLocal.id}
                onChange={(e) => handleSeleccionarMaterialCatalogo(e.target.value)}
                className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
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
              className="p-1.5 rounded-full border transition cursor-pointer hover:opacity-80"
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
              className="p-1.5 rounded-full border transition cursor-pointer hover:opacity-80"
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
              <span className="font-semibold text-xs flex items-center gap-1.5" style={{ color: coloresApariencia?.textoPrincipal }}>
                <Layers className="w-3.5 h-3.5" style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} />
                <span>1. Canales PBR Físicos</span>
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 rounded-full text-[11px] font-semibold text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer hover:opacity-90"
                style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2" }}
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

            {/* Botón: Auto-Calcular PBR */}
            <button
              onClick={handleAutoCalcularPBR}
              disabled={procesandoPBR || !matLocal.texturaUrl}
              className="w-full py-2 px-3 rounded-full font-semibold text-xs flex items-center justify-center transition shadow-xs text-white disabled:opacity-50 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2" }}
            >
              {procesandoPBR ? (
                <span>Calculando Normales & Rugosidad...</span>
              ) : (
                <span>Auto-Generar Canales PBR (0.1s)</span>
              )}
            </button>

            {/* Miniaturas de los 4 Canales PBR Cuadrados */}
            <div className="grid grid-cols-2 gap-2">
              {/* Canal 1: Diffuse / Albedo */}
              <div className="p-2 rounded-lg border flex flex-col gap-1.5 shadow-2xs" style={{ borderColor: coloresApariencia?.bordePaneles, backgroundColor: coloresApariencia?.fondoAplicacion }}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>1. Diffuse</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={matLocal.colorBase || "#FFFFFF"}
                      onChange={(e) => setMatLocal({ ...matLocal, colorBase: e.target.value })}
                      className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                      title="Tinte de color"
                    />
                  </div>
                </div>
                <div className="w-full aspect-square rounded-lg border overflow-hidden flex items-center justify-center relative" style={{ borderColor: coloresApariencia?.bordePaneles, backgroundColor: tema === "obsidian" ? "#161B22" : "#F8FAFC" }}>
                  {matLocal.texturaUrl ? (
                    <img src={matLocal.texturaUrl} alt="Diffuse" className="w-full h-full object-cover" />
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center gap-1.5 cursor-pointer transition hover:opacity-80 p-2 text-center"
                    >
                      <Upload className="w-4 h-4 opacity-60" style={{ color: coloresApariencia?.botonActivo || "#0891B2" }} />
                      <span className="text-[10px] font-semibold opacity-70 leading-tight" style={{ color: coloresApariencia?.textoPrincipal }}>
                        Adjuntar Foto
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Canal 2: Normal Map */}
              <div className="p-2 rounded-lg border flex flex-col gap-1.5 shadow-2xs" style={{ borderColor: coloresApariencia?.bordePaneles, backgroundColor: coloresApariencia?.fondoAplicacion }}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>2. Normal</span>
                  <div 
                    className="px-1.5 py-0.5 text-right text-[10px] font-mono font-bold border rounded shadow-2xs"
                    style={{
                      borderColor: coloresApariencia?.bordePaneles,
                      backgroundColor: coloresApariencia?.fondoPaneles,
                      color: coloresApariencia?.botonActivo || "#0891B2"
                    }}
                  >
                    {(matLocal.normalScale ?? 1.2).toFixed(1)}x
                  </div>
                </div>
                <div className="w-full aspect-square rounded-lg border overflow-hidden flex items-center justify-center" style={{ borderColor: coloresApariencia?.bordePaneles, backgroundColor: tema === "obsidian" ? "#161B22" : "#F8FAFC" }}>
                  {matLocal.normalMapUrl ? (
                    <img src={matLocal.normalMapUrl} alt="Normal" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-mono opacity-40" style={{ color: coloresApariencia?.textoSecundario }}>Sin Normal</span>
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={matLocal.normalScale ?? 1.2}
                  onChange={(e) => handleCambiarNormalScale(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                />
              </div>

              {/* Canal 3: Roughness Map */}
              <div className="p-2 rounded-lg border flex flex-col gap-1.5 shadow-2xs" style={{ borderColor: coloresApariencia?.bordePaneles, backgroundColor: coloresApariencia?.fondoAplicacion }}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>3. Roughness</span>
                  <div 
                    className="px-1.5 py-0.5 text-right text-[10px] font-mono font-bold border rounded shadow-2xs"
                    style={{
                      borderColor: coloresApariencia?.bordePaneles,
                      backgroundColor: coloresApariencia?.fondoPaneles,
                      color: coloresApariencia?.botonActivo || "#0891B2"
                    }}
                  >
                    {(matLocal.rugosidad ?? 0.5).toFixed(2)}
                  </div>
                </div>
                <div className="w-full aspect-square rounded-lg border overflow-hidden flex items-center justify-center" style={{ borderColor: coloresApariencia?.bordePaneles, backgroundColor: tema === "obsidian" ? "#161B22" : "#F8FAFC" }}>
                  {matLocal.roughnessMapUrl ? (
                    <img src={matLocal.roughnessMapUrl} alt="Roughness" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-mono opacity-40" style={{ color: coloresApariencia?.textoSecundario }}>Sin Roughness</span>
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={matLocal.rugosidad ?? 0.5}
                  onChange={(e) => handleCambiarRugosidadBase(parseFloat(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                />
              </div>

              {/* Canal 4: AO */}
              <div className="p-2 rounded-lg border flex flex-col gap-1.5 shadow-2xs" style={{ borderColor: coloresApariencia?.bordePaneles, backgroundColor: coloresApariencia?.fondoAplicacion }}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>4. AO Poro</span>
                  <div 
                    className="px-1.5 py-0.5 text-right text-[10px] font-mono font-bold border rounded shadow-2xs"
                    style={{
                      borderColor: coloresApariencia?.bordePaneles,
                      backgroundColor: coloresApariencia?.fondoPaneles,
                      color: coloresApariencia?.botonActivo || "#0891B2"
                    }}
                  >
                    {(matLocal.aoIntensity ?? 1.0).toFixed(1)}x
                  </div>
                </div>
                <div className="w-full aspect-square rounded-lg border overflow-hidden flex items-center justify-center" style={{ borderColor: coloresApariencia?.bordePaneles, backgroundColor: tema === "obsidian" ? "#161B22" : "#F8FAFC" }}>
                  {matLocal.aoMapUrl ? (
                    <img src={matLocal.aoMapUrl} alt="AO" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-mono opacity-40" style={{ color: coloresApariencia?.textoSecundario }}>Sin AO</span>
                  )}
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={matLocal.aoIntensity ?? 1.0}
                  onChange={(e) => setMatLocal({ ...matLocal, aoIntensity: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer"
                  style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                />
              </div>
            </div>

            {/* SECCIÓN 2: PROPIEDADES PRINCIPLED BSDF */}
            <div className="pt-2 border-t flex flex-col gap-2.5" style={{ borderColor: coloresApariencia?.bordePaneles }}>
              <span className="font-semibold text-xs flex items-center gap-1.5" style={{ color: coloresApariencia?.textoPrincipal }}>
                <Sliders className="w-3.5 h-3.5" style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} />
                <span>2. Parámetros Físicos Principled BSDF</span>
              </span>

              {/* Nombre & Tipo */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[10px]" style={{ color: coloresApariencia?.textoSecundario }}>Nombre:</label>
                  <input
                    type="text"
                    value={matLocal.nombre}
                    onChange={(e) => setMatLocal({ ...matLocal, nombre: e.target.value })}
                    className="px-2 py-1 rounded-md border text-xs font-semibold outline-none"
                    style={{
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      borderColor: coloresApariencia?.bordePaneles,
                      color: coloresApariencia?.textoPrincipal,
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[10px]" style={{ color: coloresApariencia?.textoSecundario }}>Tipo:</label>
                  <select
                    value={matLocal.tipo}
                    onChange={(e) => setMatLocal({ ...matLocal, tipo: e.target.value as any })}
                    className="px-2 py-1 rounded-md border text-xs font-semibold outline-none cursor-pointer"
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

              {/* Sliders Principled en Tarjetas Idénticas al Menú de Componentes */}
              <div className="flex flex-col gap-2 pt-1">
                {/* 1. Metálico */}
                <div 
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-2xs text-xs"
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles 
                  }}
                >
                  <div className="flex justify-between items-center">
                    <label className="font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Metálico (Metallic)</label>
                    <div 
                      className="px-2 py-0.5 text-right text-xs font-mono font-bold border rounded shadow-2xs min-w-[54px]"
                      style={{
                        borderColor: coloresApariencia?.bordePaneles,
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        color: coloresApariencia?.botonActivo || "#0891B2"
                      }}
                    >
                      {(matLocal.metalico ?? 0).toFixed(2)}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={matLocal.metalico ?? 0}
                    onChange={(e) => setMatLocal({ ...matLocal, metalico: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer"
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                  />
                </div>

                {/* 2. Resina / Barniz (Clearcoat) */}
                <div 
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-2xs text-xs"
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles 
                  }}
                >
                  <div className="flex justify-between items-center">
                    <label className="font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Resina / Barniz (Clearcoat)</label>
                    <div 
                      className="px-2 py-0.5 text-right text-xs font-mono font-bold border rounded shadow-2xs min-w-[54px]"
                      style={{
                        borderColor: coloresApariencia?.bordePaneles,
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        color: coloresApariencia?.botonActivo || "#0891B2"
                      }}
                    >
                      {(matLocal.clearcoat ?? 0).toFixed(3)}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.005"
                    value={matLocal.clearcoat ?? 0}
                    onChange={(e) => setMatLocal({ ...matLocal, clearcoat: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer"
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                  />
                </div>

                {/* 3. Difusión del Brillo (Clearcoat Roughness) */}
                <div 
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-2xs text-xs"
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles 
                  }}
                >
                  <div className="flex justify-between items-center">
                    <label className="font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Difusión del Brillo (Satinado)</label>
                    <div 
                      className="px-2 py-0.5 text-right text-xs font-mono font-bold border rounded shadow-2xs min-w-[54px]"
                      style={{
                        borderColor: coloresApariencia?.bordePaneles,
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        color: coloresApariencia?.botonActivo || "#0891B2"
                      }}
                    >
                      {(matLocal.clearcoatRoughness ?? 0.35).toFixed(2)}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={matLocal.clearcoatRoughness ?? 0.35}
                    onChange={(e) => setMatLocal({ ...matLocal, clearcoatRoughness: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer"
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                  />
                </div>

                {/* 4. Índice de Refracción (IOR) */}
                <div 
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-2xs text-xs"
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles 
                  }}
                >
                  <div className="flex justify-between items-center">
                    <label className="font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Índice de Refracción (IOR)</label>
                    <div 
                      className="px-2 py-0.5 text-right text-xs font-mono font-bold border rounded shadow-2xs min-w-[54px]"
                      style={{
                        borderColor: coloresApariencia?.bordePaneles,
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        color: coloresApariencia?.botonActivo || "#0891B2"
                      }}
                    >
                      {(matLocal.ior ?? 1.5).toFixed(2)}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.01"
                    value={matLocal.ior ?? 1.5}
                    onChange={(e) => setMatLocal({ ...matLocal, ior: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer"
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
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
                  <span>3. Control de Aristas & Contornos</span>
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
                  <div 
                    className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-2xs text-xs"
                    style={{ 
                      backgroundColor: coloresApariencia?.fondoPaneles, 
                      borderColor: coloresApariencia?.bordePaneles 
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <label className="font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Opacidad de Aristas</label>
                      <div 
                        className="px-2 py-0.5 text-right text-xs font-mono font-bold border rounded shadow-2xs min-w-[54px]"
                        style={{
                          borderColor: coloresApariencia?.bordePaneles,
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          color: coloresApariencia?.botonActivo || "#0891B2"
                        }}
                      >
                        {Math.round((calibracion.opacidadAristas ?? 0.75) * 100)}%
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={calibracion.opacidadAristas ?? 0.75}
                      onChange={(e) => setCalibracion("opacidadAristas", parseFloat(e.target.value))}
                      className="w-full cursor-pointer"
                      style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    />
                  </div>

                  {/* Ángulo Umbral (Threshold) */}
                  <div 
                    className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-2xs text-xs"
                    style={{ 
                      backgroundColor: coloresApariencia?.fondoPaneles, 
                      borderColor: coloresApariencia?.bordePaneles 
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <label className="font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Ángulo de Delineado</label>
                      <div 
                        className="px-2 py-0.5 text-right text-xs font-mono font-bold border rounded shadow-2xs min-w-[54px]"
                        style={{
                          borderColor: coloresApariencia?.bordePaneles,
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          color: coloresApariencia?.botonActivo || "#0891B2"
                        }}
                      >
                        {calibracion.thresholdAristas ?? 25}°
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="89"
                      step="1"
                      value={calibracion.thresholdAristas ?? 25}
                      onChange={(e) => setCalibracion("thresholdAristas", parseInt(e.target.value))}
                      className="w-full cursor-pointer"
                      style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BOTONES DE ACCIÓN UNIFICADOS */}
            <div className="mt-auto pt-3 border-t flex flex-col gap-2" style={{ borderColor: coloresApariencia?.bordePaneles }}>
              <button
                onClick={handleGuardarMaterial}
                className="w-full py-2.5 px-4 rounded-full font-semibold text-xs flex items-center justify-center text-white shadow-xs transition cursor-pointer hover:opacity-90"
                style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2" }}
              >
                <span>{guardadoExito ? "¡Guardado en Catálogo!" : "Guardar en Catálogo PBR"}</span>
              </button>

              {/* Botón Destacado: Lanzar Render AI con esta calibración */}
              <button
                onClick={handleLanzarRenderIA}
                className="w-full py-2.5 px-4 rounded-full font-semibold text-xs flex items-center justify-center text-white shadow-xs transition cursor-pointer hover:opacity-90"
                style={{ backgroundColor: coloresApariencia?.botonActivo || "#0891b2" }}
                title="Aplicar este material y abrir el estudio de Render Fotorrealista con IA"
              >
                <span>Lanzar Render AI con este Material</span>
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
              <span className="font-semibold text-xs flex items-center gap-1.5" style={{ color: coloresApariencia?.textoPrincipal }}>
                <Eye className="w-3.5 h-3.5" style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} />
                <span>Shader Ball 3D Interactivo (Rotar con el Mouse 360°)</span>
              </span>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Control de Aristas y Contornos */}
                <div 
                  className="flex items-center gap-2 px-3 py-1 rounded-full text-xs border shadow-xs"
                  style={{
                    backgroundColor: coloresApariencia?.fondoPaneles,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal
                  }}
                >
                  <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-[11px]">
                    <input
                      type="checkbox"
                      checked={calibracion.mostrarAristas !== false}
                      onChange={(e) => setCalibracion("mostrarAristas", e.target.checked)}
                      className="rounded cursor-pointer"
                    />
                    <span style={{ color: coloresApariencia?.textoPrincipal }}>Aristas</span>
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
                        style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                        title="Opacidad de las aristas"
                      />
                      <span className="font-mono text-[10px] font-semibold opacity-80" style={{ color: coloresApariencia?.textoPrincipal }}>
                        {Math.round((calibracion.opacidadAristas ?? 0.75) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Selector de Geometría de prueba */}
                <div 
                  className="flex items-center gap-1 p-0.5 rounded-full border shadow-xs"
                  style={{
                    backgroundColor: coloresApariencia?.fondoPaneles,
                    borderColor: coloresApariencia?.bordePaneles
                  }}
                >
                  <button
                    onClick={() => setFormaVisor("esfera")}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs transition cursor-pointer font-semibold"
                    style={{
                      backgroundColor: formaVisor === "esfera" ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                      color: formaVisor === "esfera" ? "#FFFFFF" : coloresApariencia?.textoSecundario
                    }}
                    title="Shader Ball Esférica"
                  >
                    <Circle className="w-3 h-3" />
                    <span>Esfera</span>
                  </button>
                  <button
                    onClick={() => setFormaVisor("tablero")}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs transition cursor-pointer font-semibold"
                    style={{
                      backgroundColor: formaVisor === "tablero" ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                      color: formaVisor === "tablero" ? "#FFFFFF" : coloresApariencia?.textoSecundario
                    }}
                    title="Tablero Plano de Melamina con Canto"
                  >
                    <Square className="w-3 h-3" />
                    <span>Tablero Melamina</span>
                  </button>
                  <button
                    onClick={() => setFormaVisor("cubo")}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs transition cursor-pointer font-semibold"
                    style={{
                      backgroundColor: formaVisor === "cubo" ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                      color: formaVisor === "cubo" ? "#FFFFFF" : coloresApariencia?.textoSecundario
                    }}
                    title="Cubo Biselado"
                  >
                    <Box className="w-3 h-3" />
                    <span>Cubo</span>
                  </button>
                  <button
                    onClick={() => setFormaVisor("mueble")}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition cursor-pointer font-semibold"
                    style={{
                      backgroundColor: formaVisor === "mueble" ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                      color: formaVisor === "mueble" ? "#FFFFFF" : coloresApariencia?.textoSecundario
                    }}
                    title="Previsualizar en el Mueble Real Completo"
                  >
                    <DresserIcon className="w-3.5 h-3.5" />
                    <span>Mueble Real</span>
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
                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: coloresApariencia?.botonActivo || "#0891B2" }}>
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
                  className="px-3 py-1 rounded-full border text-xs font-semibold outline-none cursor-pointer"
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
                  <span className="text-[11px] font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Luz:</span>
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.05"
                    value={hdriConfig.intensidad}
                    onChange={(e) => setHdriConfig({ ...hdriConfig, intensidad: parseFloat(e.target.value) })}
                    className="w-16 cursor-pointer"
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                  />
                  <div 
                    className="px-1.5 py-0.5 text-center text-[10px] font-mono font-bold border rounded shadow-2xs min-w-[38px]"
                    style={{
                      borderColor: coloresApariencia?.bordePaneles,
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      color: coloresApariencia?.botonActivo || "#0891B2"
                    }}
                  >
                    {hdriConfig.intensidad.toFixed(1)}x
                  </div>
                </div>

                {/* Rotación HDRI */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Giro:</span>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hdriConfig.rotacion}
                    onChange={(e) => setHdriConfig({ ...hdriConfig, rotacion: parseInt(e.target.value) })}
                    className="w-16 cursor-pointer"
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                  />
                  <div 
                    className="px-1.5 py-0.5 text-center text-[10px] font-mono font-bold border rounded shadow-2xs min-w-[38px]"
                    style={{
                      borderColor: coloresApariencia?.bordePaneles,
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      color: coloresApariencia?.botonActivo || "#0891B2"
                    }}
                  >
                    {hdriConfig.rotacion}°
                  </div>
                </div>

                {/* Opacidad / Oscuridad de la Sombra */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Sombra:</span>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.02"
                    value={hdriConfig.sombraOpacidad}
                    onChange={(e) => setHdriConfig({ ...hdriConfig, sombraOpacidad: parseFloat(e.target.value) })}
                    className="w-16 cursor-pointer"
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    title="Controlar qué tan oscura o suave es la sombra de contacto"
                  />
                  <div 
                    className="px-1.5 py-0.5 text-center text-[10px] font-mono font-bold border rounded shadow-2xs min-w-[38px]"
                    style={{
                      borderColor: coloresApariencia?.bordePaneles,
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      color: coloresApariencia?.botonActivo || "#0891B2"
                    }}
                  >
                    {Math.round(hdriConfig.sombraOpacidad * 100)}%
                  </div>
                </div>

                {/* Difuminado / Suavidad de la Sombra */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Difusión:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="8.0"
                    step="0.2"
                    value={hdriConfig.sombraDifuminado}
                    onChange={(e) => setHdriConfig({ ...hdriConfig, sombraDifuminado: parseFloat(e.target.value) })}
                    className="w-16 cursor-pointer"
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    title="Difuminado y dispersión de la sombra en el piso"
                  />
                  <div 
                    className="px-1.5 py-0.5 text-center text-[10px] font-mono font-bold border rounded shadow-2xs min-w-[38px]"
                    style={{
                      borderColor: coloresApariencia?.bordePaneles,
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      color: coloresApariencia?.botonActivo || "#0891B2"
                    }}
                  >
                    {hdriConfig.sombraDifuminado.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

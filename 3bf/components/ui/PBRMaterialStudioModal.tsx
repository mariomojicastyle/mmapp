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
  generarTexturasMetalProcedural,
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
  Pipette,
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

// 🎨 Paleta de Tonos PBR Rápidos para selección inmediata con un solo clic
const PRESET_TONOS_PBR = [
  { nombre: "Rojo Bermellón", hex: "#DC2626" },
  { nombre: "Azul MM", hex: "#1368AA" },
  { nombre: "Verde Esmeralda", hex: "#16A34A" },
  { nombre: "Amarillo Mostaza", hex: "#EAB308" },
  { nombre: "Naranja Ámbar", hex: "#EA580C" },
  { nombre: "Blanco Puro", hex: "#FFFFFF" },
  { nombre: "Negro Mate", hex: "#1A1A1A" },
  { nombre: "Nogal Café", hex: "#5C4033" },
  { nombre: "Marfil / Beige", hex: "#C5B39A" },
  { nombre: "Fresno / Madera", hex: "#C2A67E" },
  { nombre: "Gris Acero", hex: "#8A9EA7" },
  { nombre: "Grafito Carbón", hex: "#334155" },
];

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
  const [redondeoCubo, setRedondeoCubo] = useState<number>(0.04);
  const [pantallaCompleta, setPantallaCompleta] = useState<boolean>(false);
  const [rotacionLuz, setRotacionLuz] = useState<number>(45);
  const [procesandoPBR, setProcesandoPBR] = useState<boolean>(false);
  const [guardadoExito, setGuardadoExito] = useState<boolean>(false);
  const [aplicadoExito, setAplicadoExito] = useState<boolean>(false);
  const [ocultoPorCuentagotas, setOcultoPorCuentagotas] = useState<boolean>(false);

  // Configuración de Iluminación HDRI (Poly Haven Alps Field + Custom)
  const [hdriConfig, setHdriConfig] = useState<{
    tipo: "alps_field_sol" | "modern_bathroom" | "estudio_suave" | "apartamento_calido" | "showroom_moderno" | "personalizado";
    customHdrUrl?: string | null;
    intensidad: number;
    rotacion: number;
    mostrarFondo: boolean;
    blurFondo: number;
    sombraOpacidad: number;
    sombraSolOpacidad: number;
    sombraContactoOpacidad: number;
    sombraDifuminado: number;
  }>({
    tipo: "modern_bathroom",
    intensidad: 1.0,
    rotacion: 45,
    mostrarFondo: true,
    blurFondo: 0.0,
    sombraOpacidad: 0.22,
    sombraSolOpacidad: 0.15,
    sombraContactoOpacidad: 0.25,
    sombraDifuminado: 2.4,
    customHdrUrl: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const normalFileInputRef = useRef<HTMLInputElement>(null);
  const roughnessFileInputRef = useRef<HTMLInputElement>(null);
  const aoFileInputRef = useRef<HTMLInputElement>(null);
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

  // Subir mapa de normales personalizado
  const handleSubirNormalMap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setMatLocal((prev) => (prev ? { ...prev, normalMapUrl: dataUrl } : null));
      }
    };
    reader.readAsDataURL(file);
    if (normalFileInputRef.current) normalFileInputRef.current.value = "";
  };

  // Subir mapa de rugosidad personalizado
  const handleSubirRoughnessMap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setMatLocal((prev) => (prev ? { ...prev, roughnessMapUrl: dataUrl } : null));
      }
    };
    reader.readAsDataURL(file);
    if (roughnessFileInputRef.current) roughnessFileInputRef.current.value = "";
  };

  // Subir mapa de AO personalizado
  const handleSubirAOMap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setMatLocal((prev) => (prev ? { ...prev, aoMapUrl: dataUrl } : null));
      }
    };
    reader.readAsDataURL(file);
    if (aoFileInputRef.current) aoFileInputRef.current.value = "";
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
              prev && prev.id === matCopia.id && prev.texturaUrl === matCopia.texturaUrl
                ? {
                    ...prev,
                    normalMapUrl: prev.normalMapUrl || pbrSet.normalUrl,
                    roughnessMapUrl: prev.roughnessMapUrl || pbrSet.roughnessUrl,
                    aoMapUrl: prev.aoMapUrl || pbrSet.aoUrl,
                    colorBase: prev.colorBase || "#FFFFFF",
                  }
                : prev
            );
          });
        }
      }
    }
  }, [modalPBRStudioAbierto]);

  const handleSeleccionarMaterialCatalogo = (id: string) => {
    const found = materialesPBR.find((m) => m.id === id);
    if (!found) return;
    const matCopia: MaterialPBRDef = JSON.parse(JSON.stringify(found));
    setMatLocal(matCopia);
    setMaterialEnCalibracion(matCopia);
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

  // 🎨 Ajustar Color / Tono Base en vivo (sincroniza en tiempo real con 3D ShaderBall y catálogo)
  const handleCambiarColorBase = (nuevoColor: string) => {
    setMatLocal((prev) => {
      if (!prev) return null;
      const actualizado = { ...prev, colorBase: nuevoColor };
      actualizarMaterialPBR(actualizado.id, actualizado);
      return actualizado;
    });
  };

  // 🔩 Presets PBR Calibrados para Metales Hiperrealistas (Cromo, Zincado, Acero, Latón)
  const handleAplicarPresetMetal = (preset: {
    colorBase: string;
    metalico: number;
    rugosidad: number;
    clearcoat?: number;
    clearcoatRoughness?: number;
    ior?: number;
  }) => {
    setMatLocal((prev) => {
      if (!prev) return null;
      const actualizado = {
        ...prev,
        tipo: "Metal" as const,
        colorBase: preset.colorBase,
        metalico: preset.metalico,
        rugosidad: preset.rugosidad,
        clearcoat: preset.clearcoat ?? 0.0,
        clearcoatRoughness: preset.clearcoatRoughness ?? 0.3,
        ior: preset.ior ?? 1.5,
      };
      actualizarMaterialPBR(actualizado.id, actualizado);
      return actualizado;
    });
  };

  // ✨ Generar Micro-Textura Cepillada / Zincado Mecánico Procedural
  const handleGenerarMicroTexturaMetal = (tipo: "cepillado" | "zinc_galvanizado") => {
    const { normalUrl, roughnessUrl } = generarTexturasMetalProcedural(tipo);
    setMatLocal((prev) => {
      if (!prev) return null;
      const actualizado = {
        ...prev,
        tipo: "Metal" as const,
        normalMapUrl: normalUrl,
        roughnessMapUrl: roughnessUrl,
        metalico: 0.95,
        rugosidad: tipo === "cepillado" ? 0.28 : 0.24,
        normalScale: 0.75,
      };
      actualizarMaterialPBR(actualizado.id, actualizado);
      return actualizado;
    });
  };

  // 💧 Cuentagotas Universal Multipantalla (EyeDropper API nativo de Chromium)
  // Oculta temporalmente el modal para revelar el fondo y permite tomar muestras en cualquier pantalla o app
  const abrirCuentagotasPantalla = async () => {
    if (typeof window === "undefined" || !("EyeDropper" in window)) {
      alert("El Cuentagotas Multipantalla requiere Google Chrome, Microsoft Edge, Opera o Brave para capturar píxeles en cualquier monitor o aplicación.");
      return;
    }

    try {
      // 1. Ocultar el modal instantáneamente para ver completamente el fondo
      setOcultoPorCuentagotas(true);
      // Esperar brevemente para asegurar que el navegador renderice la transparencia
      await new Promise((resolve) => setTimeout(resolve, 90));

      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        handleCambiarColorBase(result.sRGBHex.toUpperCase());
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("Cuentagotas cancelado o error:", err);
      }
    } finally {
      // 2. Reaparecer el modal de inmediato con el nuevo tono muestreado
      setOcultoPorCuentagotas(false);
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
    // 💡 Solo se actualiza la definición del material en el catálogo PBR.
    // No se sobreescribe indiscriminadamente todo el mueble; únicamente las piezas
    // y capas que utilicen este material se actualizarán de forma reactiva.
    setGuardadoExito(true);
    setTimeout(() => setGuardadoExito(false), 2000);
  };

  // Disparar Render AI con la calibración activa
  const handleLanzarRenderIA = () => {
    if (matLocal) {
      handleGuardarMaterial();
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
    <div 
      className={modalClasses}
      style={{
        opacity: ocultoPorCuentagotas ? 0 : 1,
        pointerEvents: ocultoPorCuentagotas ? "none" : "auto",
        transition: "opacity 0.08s ease"
      }}
    >
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
                  {!matLocal.texturaUrl && (
                    <span className="text-[10px] font-bold" style={{ color: coloresApariencia?.botonActivo || "#0891B2" }}>
                      Color Plano
                    </span>
                  )}
                </div>

                <div 
                  className="w-full aspect-square rounded-lg border overflow-hidden flex items-center justify-center relative group" 
                  style={{ 
                    borderColor: coloresApariencia?.bordePaneles, 
                    backgroundColor: matLocal.texturaUrl ? (tema === "obsidian" ? "#161B22" : "#F8FAFC") : (matLocal.colorBase || "#CCCCCC")
                  }}
                >
                  {matLocal.texturaUrl ? (
                    <>
                      <img src={matLocal.texturaUrl} alt="Diffuse" className="w-full h-full object-cover" />
                      {/* Botón flotante X para eliminar la imagen diffuse */}
                      <button
                        onClick={() =>
                          setMatLocal({
                            ...matLocal,
                            texturaUrl: undefined,
                            tipo: matLocal.tipo === "Melamina" || matLocal.tipo === "Madera" ? "Plastico" : matLocal.tipo,
                            colorBase: matLocal.colorBase || "#CCCCCC",
                          })
                        }
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition cursor-pointer"
                        title="Eliminar mapa diffuse"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    /* 🎨 Selector de Color Plano para Material sin Textura (Tono Base) */
                    <div className="w-full h-full flex flex-col items-center justify-between p-2 text-center select-none gap-1">
                      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 w-full">
                        <div className="flex items-center gap-1.5">
                          <label 
                            htmlFor="diffuse-color-input"
                            className="w-11 h-11 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition flex items-center justify-center overflow-hidden relative group shrink-0"
                            style={{ backgroundColor: matLocal.colorBase || "#CCCCCC" }}
                            title="Clic para cambiar el tono de color"
                          >
                            <Palette className="w-3.5 h-3.5 text-white drop-shadow opacity-75 group-hover:opacity-100 transition" />
                            <input
                              id="diffuse-color-input"
                              type="color"
                              value={matLocal.colorBase?.startsWith("#") && matLocal.colorBase.length === 7 ? matLocal.colorBase : "#CCCCCC"}
                              onChange={(e) => handleCambiarColorBase(e.target.value)}
                              className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
                            />
                          </label>

                          {/* 💧 Cuentagotas de pantalla en Diffuse */}
                          <button
                            type="button"
                            onClick={abrirCuentagotasPantalla}
                            className="w-7 h-7 rounded-full border shadow-xs flex items-center justify-center cursor-pointer hover:scale-110 transition group"
                            style={{
                              backgroundColor: coloresApariencia?.fondoPaneles,
                              borderColor: coloresApariencia?.bordePaneles,
                              color: coloresApariencia?.botonActivo || "#0891b2"
                            }}
                            title="Cuentagotas Multipantalla: Oculta el modal y captura color de cualquier aplicación o pantalla"
                          >
                            <Pipette className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <span 
                            className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-2xs border backdrop-blur-xs"
                            style={{ 
                              backgroundColor: tema === "obsidian" ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.9)",
                              color: tema === "obsidian" ? "#FFFFFF" : "#0F172A",
                              borderColor: coloresApariencia?.bordePaneles
                            }}
                          >
                            {(matLocal.colorBase || "#CCCCCC").toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Botón para volver a cargar foto/textura si se desea */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-1.5 px-2 rounded-full text-[10px] font-semibold border transition hover:opacity-90 flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        style={{
                          backgroundColor: coloresApariencia?.fondoPaneles,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.botonActivo || "#0891B2"
                        }}
                        title="Adjuntar una imagen de textura para este material"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Cargar Textura</span>
                      </button>
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
                <div 
                  className="w-full aspect-square rounded-lg border overflow-hidden flex items-center justify-center relative group" 
                  style={{ 
                    borderColor: coloresApariencia?.bordePaneles, 
                    backgroundColor: matLocal.normalMapUrl ? (tema === "obsidian" ? "#161B22" : "#F8FAFC") : (tema === "obsidian" ? "#131822" : "#EEF2F6") 
                  }}
                >
                  {matLocal.normalMapUrl ? (
                    <>
                      <img src={matLocal.normalMapUrl} alt="Normal" className="w-full h-full object-cover" />
                      {/* Botón flotante X para eliminar mapa normal */}
                      <button
                        onClick={() => setMatLocal({ ...matLocal, normalMapUrl: undefined })}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition cursor-pointer"
                        title="Eliminar mapa normal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-between p-2 text-center select-none gap-1">
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-semibold opacity-60" style={{ color: coloresApariencia?.textoPrincipal }}>
                          Superficie Lisa
                        </span>
                        {matLocal.texturaUrl && (
                          <button
                            onClick={async () => {
                              if (!matLocal.texturaUrl) return;
                              const norm = await generarNormalMap(matLocal.texturaUrl, {
                                normalStrength: matLocal.normalScale ?? 1.2,
                                normalInvertY: matLocal.ajustesTextura?.normalInvertY ?? false,
                              });
                              setMatLocal({ ...matLocal, normalMapUrl: norm });
                            }}
                            className="mt-1 px-2 py-0.5 rounded text-[9px] font-semibold border transition hover:opacity-90 cursor-pointer shadow-2xs"
                            style={{
                              backgroundColor: coloresApariencia?.fondoPaneles,
                              borderColor: coloresApariencia?.bordePaneles,
                              color: coloresApariencia?.botonActivo || "#0891B2"
                            }}
                          >
                            Auto-Generar
                          </button>
                        )}
                      </div>

                      {/* Botón para cargar archivo de mapa de normales externo */}
                      <button
                        onClick={() => normalFileInputRef.current?.click()}
                        className="w-full py-1 px-1.5 rounded text-[10px] font-semibold border transition hover:opacity-90 flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        style={{
                          backgroundColor: coloresApariencia?.fondoPaneles,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.botonActivo || "#0891B2"
                        }}
                        title="Subir archivo de mapa de normales (RGB Normal Map)"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Cargar Normal</span>
                      </button>
                    </div>
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
                <div 
                  className="w-full aspect-square rounded-lg border overflow-hidden flex items-center justify-center relative group" 
                  style={{ 
                    borderColor: coloresApariencia?.bordePaneles, 
                    backgroundColor: matLocal.roughnessMapUrl 
                      ? (tema === "obsidian" ? "#161B22" : "#F8FAFC") 
                      : `rgb(${Math.round((matLocal.rugosidad ?? 0.5) * 230)}, ${Math.round((matLocal.rugosidad ?? 0.5) * 230)}, ${Math.round((matLocal.rugosidad ?? 0.5) * 230)})`
                  }}
                >
                  {matLocal.roughnessMapUrl ? (
                    <>
                      <img src={matLocal.roughnessMapUrl} alt="Roughness" className="w-full h-full object-cover" />
                      {/* Botón flotante X para eliminar mapa de rugosidad */}
                      <button
                        onClick={() => setMatLocal({ ...matLocal, roughnessMapUrl: undefined })}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition cursor-pointer"
                        title="Eliminar mapa de rugosidad"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-between p-2 text-center select-none gap-1">
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <span 
                          className="text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs border backdrop-blur-xs"
                          style={{
                            backgroundColor: (matLocal.rugosidad ?? 0.5) > 0.5 ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.85)",
                            color: (matLocal.rugosidad ?? 0.5) > 0.5 ? "#FFFFFF" : "#0F172A",
                            borderColor: coloresApariencia?.bordePaneles
                          }}
                        >
                          {(matLocal.rugosidad ?? 0.5) < 0.2 ? "Brillante" : (matLocal.rugosidad ?? 0.5) > 0.7 ? "Mate" : "Satinado"}
                        </span>
                        {matLocal.texturaUrl && (
                          <button
                            onClick={async () => {
                              if (!matLocal.texturaUrl) return;
                              const rough = await generarRoughnessMap(matLocal.texturaUrl, {
                                roughnessBase: matLocal.rugosidad ?? 0.5,
                                roughnessInvert: matLocal.ajustesTextura?.roughnessInvert ?? false,
                              });
                              setMatLocal({ ...matLocal, roughnessMapUrl: rough });
                            }}
                            className="mt-1 px-2 py-0.5 rounded text-[9px] font-semibold border transition hover:opacity-90 cursor-pointer shadow-2xs"
                            style={{
                              backgroundColor: coloresApariencia?.fondoPaneles,
                              borderColor: coloresApariencia?.bordePaneles,
                              color: coloresApariencia?.botonActivo || "#0891B2"
                            }}
                          >
                            Auto-Generar
                          </button>
                        )}
                      </div>

                      {/* Botón para cargar archivo de mapa de rugosidad externo */}
                      <button
                        onClick={() => roughnessFileInputRef.current?.click()}
                        className="w-full py-1 px-1.5 rounded text-[10px] font-semibold border transition hover:opacity-90 flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        style={{
                          backgroundColor: coloresApariencia?.fondoPaneles,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.botonActivo || "#0891B2"
                        }}
                        title="Subir archivo de mapa de rugosidad (Roughness Map B&N)"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Cargar Rugosidad</span>
                      </button>
                    </div>
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
                <div 
                  className="w-full aspect-square rounded-lg border overflow-hidden flex items-center justify-center relative group" 
                  style={{ 
                    borderColor: coloresApariencia?.bordePaneles, 
                    backgroundColor: matLocal.aoMapUrl ? (tema === "obsidian" ? "#161B22" : "#F8FAFC") : (tema === "obsidian" ? "#131822" : "#FFFFFF") 
                  }}
                >
                  {matLocal.aoMapUrl ? (
                    <>
                      <img src={matLocal.aoMapUrl} alt="AO" className="w-full h-full object-cover" />
                      {/* Botón flotante X para eliminar mapa AO */}
                      <button
                        onClick={() => setMatLocal({ ...matLocal, aoMapUrl: undefined })}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition cursor-pointer"
                        title="Eliminar mapa AO"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-between p-2 text-center select-none gap-1">
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-semibold opacity-60" style={{ color: coloresApariencia?.textoPrincipal }}>
                          Sin Oclusión
                        </span>
                        {matLocal.texturaUrl && (
                          <button
                            onClick={async () => {
                              if (!matLocal.texturaUrl) return;
                              const ao = await generarAOMap(matLocal.texturaUrl, {
                                aoStrength: matLocal.aoIntensity ?? 1.0,
                              });
                              setMatLocal({ ...matLocal, aoMapUrl: ao });
                            }}
                            className="mt-1 px-2 py-0.5 rounded text-[9px] font-semibold border transition hover:opacity-90 cursor-pointer shadow-2xs"
                            style={{
                              backgroundColor: coloresApariencia?.fondoPaneles,
                              borderColor: coloresApariencia?.bordePaneles,
                              color: coloresApariencia?.botonActivo || "#0891B2"
                            }}
                          >
                            Auto-Generar
                          </button>
                        )}
                      </div>

                      {/* Botón para cargar archivo de mapa de AO externo */}
                      <button
                        onClick={() => aoFileInputRef.current?.click()}
                        className="w-full py-1 px-1.5 rounded text-[10px] font-semibold border transition hover:opacity-90 flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        style={{
                          backgroundColor: coloresApariencia?.fondoPaneles,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.botonActivo || "#0891B2"
                        }}
                        title="Subir archivo de mapa de oclusión ambiental (Ambient Occlusion B&N)"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Cargar AO</span>
                      </button>
                    </div>
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
                    className="px-2.5 py-1 rounded-full border text-xs font-semibold outline-none"
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
                    className="px-2.5 py-1 rounded-full border text-xs font-semibold outline-none cursor-pointer"
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

              {/* 🎨 Parámetro 1: Color Base / Tono (Base Color / Albedo) */}
              <div 
                className="flex flex-col gap-2 p-2.5 rounded-xl border shadow-2xs text-xs"
                style={{ 
                  backgroundColor: coloresApariencia?.fondoAplicacion,
                  borderColor: coloresApariencia?.bordePaneles 
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} />
                    <span className="font-semibold text-[11px]" style={{ color: coloresApariencia?.textoPrincipal }}>
                      Color Base / Tono (Albedo)
                    </span>
                  </div>
                  {matLocal.texturaUrl ? (
                    <span 
                      className="text-[9px] px-2 py-0.5 rounded-full font-semibold border opacity-80"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoSecundario
                      }}
                    >
                      Textura Activa
                    </span>
                  ) : (
                    <span 
                      className="text-[9px] px-2 py-0.5 rounded-full font-semibold border"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.botonActivo || "#0891b2"
                      }}
                    >
                      Tono Puro
                    </span>
                  )}
                </div>

                {/* Fila Interactiva: Swatch Grande + Input HEX + Botón Selector */}
                <div className="flex items-center gap-2">
                  {/* Swatch Circular Clickable con input color integrado */}
                  <label 
                    htmlFor="principled-base-color-input"
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition flex items-center justify-center shrink-0 relative overflow-hidden group"
                    style={{ backgroundColor: matLocal.colorBase || "#CCCCCC" }}
                    title="Clic para abrir el selector de color"
                  >
                    <Palette className="w-3.5 h-3.5 text-white drop-shadow opacity-75 group-hover:opacity-100 transition" />
                    <input
                      id="principled-base-color-input"
                      type="color"
                      value={matLocal.colorBase?.startsWith("#") && matLocal.colorBase.length === 7 ? matLocal.colorBase : "#CCCCCC"}
                      onChange={(e) => handleCambiarColorBase(e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>

                  {/* Input de Texto HEX editable para escribir o pegar colores directamente */}
                  <div className="flex items-center gap-1.5 flex-1">
                    <div 
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full border shadow-2xs w-full"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles
                      }}
                    >
                      <span className="text-[11px] font-mono font-bold opacity-60" style={{ color: coloresApariencia?.textoSecundario }}>#</span>
                      <input
                        type="text"
                        maxLength={7}
                        value={(matLocal.colorBase || "#CCCCCC").replace(/^#/, "")}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                          if (val.length === 6) {
                            handleCambiarColorBase(`#${val}`);
                          } else {
                            setMatLocal((prev) => (prev ? { ...prev, colorBase: `#${val}` } : null));
                          }
                        }}
                        onBlur={(e) => {
                          let val = e.target.value.replace(/[^0-9a-fA-F]/g, "");
                          if (val.length === 3) {
                            val = val.split("").map(c => c + c).join("");
                          }
                          if (val.length === 6) {
                            handleCambiarColorBase(`#${val}`);
                          } else if (!matLocal.colorBase || matLocal.colorBase.length < 7) {
                            handleCambiarColorBase("#CCCCCC");
                          }
                        }}
                        className="w-full bg-transparent font-mono font-bold text-xs uppercase outline-none"
                        style={{ color: coloresApariencia?.textoPrincipal }}
                        placeholder="CCCCCC"
                        title="Código hexadecimal de color"
                      />
                    </div>
                  </div>

                  {/* Botón rápido para abrir el color picker */}
                  <label
                    htmlFor="principled-base-color-input"
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-xs cursor-pointer hover:opacity-90 flex items-center gap-1 shrink-0 transition"
                    style={{
                      backgroundColor: coloresApariencia?.fondoPaneles,
                      borderColor: coloresApariencia?.bordePaneles,
                      color: coloresApariencia?.botonActivo || "#0891b2"
                    }}
                    title="Abrir selector de color del sistema"
                  >
                    <Palette className="w-3 h-3" />
                    <span>Elegir</span>
                  </label>

                  {/* 💧 Botón Cuentagotas Universal Multipantalla */}
                  <button
                    type="button"
                    onClick={abrirCuentagotasPantalla}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-xs cursor-pointer hover:opacity-90 flex items-center gap-1 shrink-0 transition group"
                    style={{
                      backgroundColor: coloresApariencia?.fondoPaneles,
                      borderColor: coloresApariencia?.bordePaneles,
                      color: coloresApariencia?.botonActivo || "#0891b2"
                    }}
                    title="Cuentagotas Multipantalla: Oculta temporalmente el modal y captura cualquier color de la pantalla, escritorio u otra aplicación"
                  >
                    <Pipette className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                    <span className="hidden sm:inline">Cuentagotas</span>
                  </button>
                </div>

                {/* Paleta de Tonos Rápidos de un Clic */}
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70" style={{ color: coloresApariencia?.textoSecundario }}>
                    Tonos Rápidos Recomendados
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_TONOS_PBR.map((preset) => {
                      const isSelected = (matLocal.colorBase || "").toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => handleCambiarColorBase(preset.hex)}
                          title={`${preset.nombre} (${preset.hex})`}
                          className={`w-5 h-5 rounded-full border shadow-2xs transition-transform hover:scale-125 cursor-pointer shrink-0 ${
                            isSelected ? "ring-2 ring-cyan-500 scale-110" : ""
                          }`}
                          style={{
                            backgroundColor: preset.hex,
                            borderColor: tema === "obsidian" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Presets Rápidos de Acabados Metálicos Calibrados (PBR Espejo, Zinc, Acero, Latón) */}
              {matLocal.tipo === "Metal" && (
                <div 
                  className="flex flex-col gap-2 p-2.5 rounded-xl border shadow-2xs text-xs"
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles 
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] flex items-center gap-1.5" style={{ color: coloresApariencia?.textoPrincipal }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} />
                      <span>Acabados Metálicos Calibrados</span>
                    </span>
                    <span className="text-[9px] font-mono opacity-60" style={{ color: coloresApariencia?.textoSecundario }}>
                      Estilo Blender PBR
                    </span>
                  </div>

                  {/* Botones Cápsula de Presets Rápidos */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAplicarPresetMetal({ colorBase: "#FFFFFF", metalico: 1.0, rugosidad: 0.03, clearcoat: 0.05, clearcoatRoughness: 0.1 })}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs hover:scale-105 transition cursor-pointer flex items-center gap-1"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal,
                      }}
                      title="Cromo brillante tipo espejo (Reflejo 100%)"
                    >
                      <span>🪞</span>
                      <span>Cromo Espejo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAplicarPresetMetal({ colorBase: "#E2E8F0", metalico: 0.95, rugosidad: 0.26, clearcoat: 0.0, clearcoatRoughness: 0.3 })}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs hover:scale-105 transition cursor-pointer flex items-center gap-1"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.botonActivo || "#0891b2",
                      }}
                      title="Zincado satinado anticorrosivo (Exacto al modelo de Blender)"
                    >
                      <span>🔩</span>
                      <span>Zincado (Blender)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAplicarPresetMetal({ colorBase: "#CBD5E1", metalico: 0.92, rugosidad: 0.35, clearcoat: 0.0, clearcoatRoughness: 0.35 })}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs hover:scale-105 transition cursor-pointer flex items-center gap-1"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal,
                      }}
                      title="Acero inoxidable pulido satinado"
                    >
                      <span>⚙️</span>
                      <span>Acero Inox</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAplicarPresetMetal({ colorBase: "#F1F5F9", metalico: 0.88, rugosidad: 0.45, clearcoat: 0.0, clearcoatRoughness: 0.45 })}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs hover:scale-105 transition cursor-pointer flex items-center gap-1"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal,
                      }}
                      title="Aluminio anodizado natural mate"
                    >
                      <span>🛡️</span>
                      <span>Aluminio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAplicarPresetMetal({ colorBase: "#F5D061", metalico: 0.95, rugosidad: 0.20, clearcoat: 0.02, clearcoatRoughness: 0.2 })}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs hover:scale-105 transition cursor-pointer flex items-center gap-1"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: "#D97706",
                      }}
                      title="Latón / Dorado pulido para herrajes decorativos"
                    >
                      <span>🪙</span>
                      <span>Latón / Dorado</span>
                    </button>
                  </div>

                  {/* Acciones de Micro-Texturas Procedurales */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleGenerarMicroTexturaMetal("zinc_galvanizado")}
                      className="px-3 py-1 rounded-full text-[10px] font-semibold border shadow-xs hover:opacity-90 transition cursor-pointer flex items-center gap-1.5"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.botonActivo || "#0891b2",
                      }}
                      title="Genera micro-vetas sutiles de zinc galvanizado anticorrosivo"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Micro-Textura Zincado</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerarMicroTexturaMetal("cepillado")}
                      className="px-3 py-1 rounded-full text-[10px] font-semibold border shadow-xs hover:opacity-90 transition cursor-pointer flex items-center gap-1.5"
                      style={{
                        backgroundColor: coloresApariencia?.fondoPaneles,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal,
                      }}
                      title="Genera estrías direccionales de metal cepillado mecánico (Brushed Metal)"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Metal Cepillado (Brushed)</span>
                    </button>
                  </div>
                </div>
              )}

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

                {/* 2. Rugosidad Directa Principled BSDF (Roughness) */}
                <div 
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-2xs text-xs"
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles 
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <label className="font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Rugosidad (Roughness)</label>
                      <span className="text-[10px] opacity-60 font-mono">
                        {(matLocal.rugosidad ?? 0.5) < 0.1 ? "Espejo" : (matLocal.rugosidad ?? 0.5) < 0.35 ? "Satinado" : (matLocal.rugosidad ?? 0.5) > 0.7 ? "Mate" : "Semi-Mate"}
                      </span>
                    </div>
                    <div 
                      className="px-2 py-0.5 text-right text-xs font-mono font-bold border rounded shadow-2xs min-w-[54px]"
                      style={{
                        borderColor: coloresApariencia?.bordePaneles,
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        color: coloresApariencia?.botonActivo || "#0891B2"
                      }}
                    >
                      {(matLocal.rugosidad ?? 0.5).toFixed(2)}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={matLocal.rugosidad ?? 0.5}
                    onChange={(e) => handleCambiarRugosidadBase(parseFloat(e.target.value))}
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
            {/* Barra Flotante Superior: Selector de Forma y Control de Redondeo */}
            <div className="flex items-center justify-end px-1 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Control de Redondeo de Esquinas / Biselado para Cubo (Visualización de luz en plásticos y metales) */}
                {formaVisor === "cubo" && (
                  <div 
                    className="flex items-center gap-2 px-3 py-1 rounded-full text-xs border shadow-xs animate-in fade-in"
                    style={{
                      backgroundColor: coloresApariencia?.fondoPaneles,
                      borderColor: coloresApariencia?.bordePaneles,
                      color: coloresApariencia?.textoPrincipal
                    }}
                  >
                    <span className="font-semibold text-[11px]" style={{ color: coloresApariencia?.textoPrincipal }}>
                      Redondeo:
                    </span>

                    <input
                      type="range"
                      min="0.0"
                      max="0.15"
                      step="0.005"
                      value={redondeoCubo}
                      onChange={(e) => setRedondeoCubo(parseFloat(e.target.value))}
                      className="w-20 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                      title="Graduar el redondeo de las aristas del cubo (de afilado a bisel moderado para piezas plásticas)"
                    />

                    <span 
                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs border min-w-[50px] text-center"
                      style={{
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.botonActivo || "#0891b2"
                      }}
                    >
                      {redondeoCubo <= 0.002 ? "Afilado" : `${Math.round((redondeoCubo / 0.15) * 100)}%`}
                    </span>
                  </div>
                )}

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

                {/* Conmutador Rápido de Fondo: Blanco vs HDRI Unreal */}
                <button
                  type="button"
                  onClick={() => setHdriConfig((prev) => ({ ...prev, mostrarFondo: !prev.mostrarFondo }))}
                  className="px-3 py-1 rounded-full text-xs font-semibold border shadow-xs transition cursor-pointer flex items-center gap-1.5 hover:opacity-90"
                  style={{
                    backgroundColor: hdriConfig.mostrarFondo ? (coloresApariencia?.botonActivo || "#0891b2") : coloresApariencia?.fondoPaneles,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: hdriConfig.mostrarFondo ? "#FFFFFF" : coloresApariencia?.textoPrincipal,
                  }}
                  title={hdriConfig.mostrarFondo ? "Clic para cambiar a Fondo Blanco limpio" : "Clic para ver el Fondo HDRI desenfocado (Estilo Unreal Engine)"}
                >
                  <span>{hdriConfig.mostrarFondo ? "🖼️ Fondo HDRI" : "⚪ Fondo Blanco"}</span>
                </button>
              </div>
            </div>

            {/* Canvas 3D Shader Ball Gigante */}
            <div className="flex-1 min-h-[420px] rounded-xl overflow-hidden border shadow-2xl relative" style={{ borderColor: coloresApariencia?.bordePaneles }}>
              <ShaderBallViewer
                materialDef={matLocal}
                forma={formaVisor}
                hdriConfig={hdriConfig}
                redondeoCubo={redondeoCubo}
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
              {/* Selector HDRI y Conmutador de Fondo */}
              <div className="flex items-center gap-2 flex-wrap">
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
                  <option value="modern_bathroom">🛁 Baño Moderno (Poly Haven HDR)</option>
                  <option value="estudio_suave">📸 Estudio Softbox (Poly Haven Studio HDR)</option>
                  <option value="alps_field_sol">🌳 Exterior Soleado (Estilo Unreal Engine HDR)</option>
                  <option value="showroom_moderno">🏭 Taller / Showroom (Poly Haven Workshop HDR)</option>
                  <option value="personalizado">📂 Cargar .HDR Propio...</option>
                </select>
                <input
                  ref={hdrFileInputRef}
                  type="file"
                  accept=".hdr,.exr"
                  onChange={handleSubirHdrPersonalizado}
                  className="hidden"
                />

                {/* Píldoras Conmutadoras de Fondo: Blanco vs HDRI */}
                <div 
                  className="flex items-center gap-1 p-0.5 rounded-full border shadow-2xs"
                  style={{
                    backgroundColor: coloresApariencia?.fondoAplicacion,
                    borderColor: coloresApariencia?.bordePaneles,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setHdriConfig({ ...hdriConfig, mostrarFondo: false })}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                    style={{
                      backgroundColor: !hdriConfig.mostrarFondo ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                      color: !hdriConfig.mostrarFondo ? "#FFFFFF" : coloresApariencia?.textoSecundario,
                    }}
                    title="Fondo blanco ciclorama limpio para catálogo"
                  >
                    <span>⚪</span>
                    <span>Blanco</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHdriConfig({ ...hdriConfig, mostrarFondo: true })}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                    style={{
                      backgroundColor: hdriConfig.mostrarFondo ? (coloresApariencia?.botonActivo || "#0891b2") : "transparent",
                      color: hdriConfig.mostrarFondo ? "#FFFFFF" : coloresApariencia?.textoSecundario,
                    }}
                    title="Fondo HDRI con desenfoque cinematográfico (Estilo Unreal Engine)"
                  >
                    <span>🖼️</span>
                    <span>HDRI Unreal</span>
                  </button>
                </div>
              </div>

              {/* Sliders HDRI e Iluminación */}
              <div className="flex items-center gap-3 flex-1 min-w-[340px] justify-end flex-wrap">
                {/* Desenfoque del Fondo HDRI (Blur Bokeh Unreal Engine) */}
                {hdriConfig.mostrarFondo && (
                  <div className="flex items-center gap-1.5 text-xs animate-in fade-in">
                    <span className="text-[11px] font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Blur Fondo:</span>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={hdriConfig.blurFondo ?? 0.5}
                      onChange={(e) => setHdriConfig({ ...hdriConfig, blurFondo: parseFloat(e.target.value) })}
                      className="w-16 cursor-pointer"
                      style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                      title="Desenfoque fotográfico / profundidad de campo del fondo HDRI (Estilo Unreal Engine)"
                    />
                    <div 
                      className="px-1.5 py-0.5 text-center text-[10px] font-mono font-bold border rounded shadow-2xs min-w-[38px]"
                      style={{
                        borderColor: coloresApariencia?.bordePaneles,
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        color: coloresApariencia?.botonActivo || "#0891B2"
                      }}
                    >
                      {Math.round((hdriConfig.blurFondo ?? 0.5) * 100)}%
                    </div>
                  </div>
                )}
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

                {/* Opacidad de la Sombra Direccional (Sol / Luz) */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Sombra Sol:</span>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.02"
                    value={hdriConfig.sombraSolOpacidad}
                    onChange={(e) => setHdriConfig({ ...hdriConfig, sombraSolOpacidad: parseFloat(e.target.value) })}
                    className="w-14 cursor-pointer"
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    title="Controlar la intensidad de la sombra direccional proyectada por la luz/sol (0% = sin sombra dura)"
                  />
                  <div 
                    className="px-1.5 py-0.5 text-center text-[10px] font-mono font-bold border rounded shadow-2xs min-w-[34px]"
                    style={{
                      borderColor: coloresApariencia?.bordePaneles,
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      color: coloresApariencia?.botonActivo || "#0891B2"
                    }}
                  >
                    {Math.round(hdriConfig.sombraSolOpacidad * 100)}%
                  </div>
                </div>

                {/* Opacidad de la Sombra de Contacto Suave (Ambiente) */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-semibold" style={{ color: coloresApariencia?.textoPrincipal }}>Contacto:</span>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.02"
                    value={hdriConfig.sombraContactoOpacidad}
                    onChange={(e) => setHdriConfig({ ...hdriConfig, sombraContactoOpacidad: parseFloat(e.target.value) })}
                    className="w-14 cursor-pointer"
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    title="Controlar la sombra difusa de contacto bajo el objeto"
                  />
                  <div 
                    className="px-1.5 py-0.5 text-center text-[10px] font-mono font-bold border rounded shadow-2xs min-w-[34px]"
                    style={{
                      borderColor: coloresApariencia?.bordePaneles,
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      color: coloresApariencia?.botonActivo || "#0891B2"
                    }}
                  >
                    {Math.round(hdriConfig.sombraContactoOpacidad * 100)}%
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
                    className="w-14 cursor-pointer"
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    title="Difuminado y dispersión de las sombras en el piso"
                  />
                  <div 
                    className="px-1.5 py-0.5 text-center text-[10px] font-mono font-bold border rounded shadow-2xs min-w-[34px]"
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

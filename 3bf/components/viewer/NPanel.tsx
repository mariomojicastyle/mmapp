"use client";

import React, { useState, useEffect } from "react";
import { use3BFStore, defaultCalibracion, APP_VERSION, PRESETS_ILUMINACION } from "@/lib/store";
import FurnitureAssetBrowser from "./FurnitureAssetBrowser";
import AppearanceSettingsPanel from "./AppearanceSettingsPanel";
import LayerManagerPanel from "./LayerManagerPanel";
import MaterialManagerPanel from "./MaterialManagerPanel";
import PartBreakdownPanel from "./PartBreakdownPanel";
import { 
  ChevronLeft, 
  ChevronRight, 
  Box, 
  Boxes,
  Package,
  Palette, 
  Sliders, 
  Search, 
  GripVertical, 
  Layers, 
  Check, 
  Info,
  RotateCcw,
  Sun,
  Upload,
  Eye,
  Grid3X3,
  Trash2,
  Copy,
  Paintbrush,
  Camera,
  Focus,
  ListTree,
  Wrench,
  Sparkles,
  Lamp,
  Power,
  Bookmark
} from "lucide-react";

interface DefinicionItem {
  id: string;
  nombre: string;
  categoria: string;
  archivo: string;
  rutaRelativa: string;
  descripcion?: string;
  thumbnail?: string;
}

const CATEGORIAS_FALLBACK = ["Cubiertas"];

const DirectNumberInput = ({
  value,
  min,
  max,
  unit = "mm",
  onChange,
  className = ""
}: {
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (val: number) => void;
  className?: string;
}) => {
  const { coloresApariencia, guardarEstadoHistorial } = use3BFStore();
  const [localText, setLocalText] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalText(String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw);
    const normalizado = raw.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(normalizado);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    const normalizado = localText.replace(/\./g, "").replace(",", ".");
    let num = parseFloat(normalizado);
    if (isNaN(num)) num = value;
    const clamped = Math.min(max, Math.max(min, num));
    onChange(clamped);
    setLocalText(String(clamped));
    guardarEstadoHistorial();
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        inputMode="decimal"
        value={localText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={{
          borderColor: coloresApariencia?.bordePaneles || "#CBD5E1",
          backgroundColor: coloresApariencia?.fondoAplicacion || "#F8FAFC",
          color: coloresApariencia?.botonActivo || "#0891b2"
        }}
        className={`w-14 px-1.5 py-0.5 text-right text-xs font-mono font-bold border rounded outline-none shadow-2xs transition ${className}`}
      />
      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px] font-mono font-semibold">{unit}</span>
    </div>
  );
};

const DEFINICIONES_FALLBACK: DefinicionItem[] = [
  {
    id: "Cubierta",
    nombre: "Cubierta",
    categoria: "Cubiertas",
    archivo: "Cubierta.ghx",
    rutaRelativa: "Cubiertas/Cubierta.ghx",
    thumbnail: "/thumbnails/cubierta_render.svg",
  },
];

interface MaterialPBRItem {
  id: string;
  nombre: string;
  tipo: "Melamina" | "Madera" | "Color" | "Canto";
  colorHex: string;
  previewUrl?: string;
  rugosidad: number;
  metalicidad: number;
  proveedor: string;
}

const MATERIALES_PBR: MaterialPBRItem[] = [
  {
    id: "marfil_novopan",
    nombre: "MDPKOR Marfil",
    tipo: "Melamina",
    colorHex: "#C5B39A",
    previewUrl: "/textures/Marfil_diffuse.jpg",
    rugosidad: 0.65,
    metalicidad: 0.05,
    proveedor: "Novopan",
  },
  {
    id: "ceniza_escandinavo",
    nombre: "Ceniza Escandinavo",
    tipo: "Melamina",
    colorHex: "#9E978E",
    rugosidad: 0.7,
    metalicidad: 0.05,
    proveedor: "Novopan",
  },
  {
    id: "roble_natural",
    nombre: "Roble Natural Poro",
    tipo: "Madera",
    colorHex: "#A47551",
    rugosidad: 0.55,
    metalicidad: 0.02,
    proveedor: "Masisa",
  },
  {
    id: "nogal_amazonico",
    nombre: "Nogal Amazónico",
    tipo: "Madera",
    colorHex: "#543826",
    rugosidad: 0.6,
    metalicidad: 0.03,
    proveedor: "Arauco",
  },
  {
    id: "blanco_glacial",
    nombre: "Blanco Glacial Mate",
    tipo: "Color",
    colorHex: "#F1F5F9",
    rugosidad: 0.45,
    metalicidad: 0.01,
    proveedor: "Duratex",
  },
  {
    id: "grafito_soft",
    nombre: "Grafito Soft Touch",
    tipo: "Color",
    colorHex: "#334155",
    rugosidad: 0.8,
    metalicidad: 0.08,
    proveedor: "Novopan",
  },
];

export default function NPanel() {
  const { 
    pestanaActiva,
    mostrarNPanel, 
    setMostrarNPanel, 
    pestanaNPanel, 
    setPestanaNPanel,
    parametros,
    setParametro,
    calibracion,
    setCalibracion,
    resetCalibracion,
    setModoVisual,
    instancias,
    objetoActivoId,
    seleccionarInstancia,
    duplicarInstancia,
    eliminarInstancia,
    coloresApariencia,
    centrarCamara,
    anchoNPanel,
    setAnchoNPanel,
    modalRenderIAAbierto,
    setModalRenderIAAbierto,
    setLuzPropiedad,
    seleccionarLuzEstudio,
    toggleGizmosLuces,
    aplicarPresetIluminacion,
    guardarIluminacionPredeterminada,
    restaurarIluminacionPredeterminada,
    tieneIluminacionPredeterminada,
    setHdriPersonalizado,
    restablecerHdriPorDefecto,
  } = use3BFStore();

  const anchoEfectivoNPanel = React.useMemo(() => {
    if (typeof window === "undefined") return 380;
    if (window.innerWidth >= 1024) {
      return anchoNPanel && anchoNPanel >= 280 ? anchoNPanel : 380;
    }
    const ancho25 = Math.max(160, Math.round(window.innerWidth * 0.25));
    if (!anchoNPanel || anchoNPanel > window.innerWidth * 0.35 || anchoNPanel < 140) {
      return ancho25;
    }
    return anchoNPanel;
  }, [anchoNPanel]);
  const ancho = anchoEfectivoNPanel;
  const [isResizing, setIsResizing] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [guardadoDefaultFeedback, setGuardadoDefaultFeedback] = useState(false);
  const [categoriaMueble, setCategoriaMueble] = useState<string>("Todos");
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_FALLBACK);
  const [definiciones, setDefiniciones] = useState<DefinicionItem[]>(DEFINICIONES_FALLBACK);

  const [timestamp, setTimestamp] = useState(Date.now());

  const cargarDefiniciones = () => {
    fetch("/api/definitions")
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.categories && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategorias(data.categories);
        }
        if (data?.items && Array.isArray(data.items)) {
          const mapped = data.items.map((item: any) => {
            const idLower = (item.id || "").toLowerCase();
            const catLower = (item.categoria || "").toLowerCase();
            
            // Prioridad a imagen PNG real si existe captura para esta definición
            let thumb = item.thumbnail ? `${item.thumbnail}?t=${Date.now()}` : "/thumbnails/cubierta_render.svg";
            if (!item.thumbnail) {
              if (idLower.includes("cubierta")) {
                thumb = `/thumbnails/Cubierta.png?t=${Date.now()}`;
              } else if (catLower.includes("comoda") || catLower.includes("cajon")) {
                thumb = "/thumbnails/comoda_render.svg";
              } else if (catLower.includes("armario") || catLower.includes("closet")) {
                thumb = "/thumbnails/armario_render.svg";
              } else if (catLower.includes("escritorio") || catLower.includes("mesa")) {
                thumb = "/thumbnails/escritorio_render.svg";
              }
            }
            return { ...item, thumbnail: thumb };
          });
          setDefiniciones(mapped);
        }
      })
      .catch((err) => {
        console.warn("API definitions fallback:", err);
      });
  };

  useEffect(() => {
    cargarDefiniciones();

    const handleThumbUpdated = () => {
      setTimestamp(Date.now());
      cargarDefiniciones();
    };

    window.addEventListener("3bf-thumbnail-updated", handleThumbUpdated);
    return () => window.removeEventListener("3bf-thumbnail-updated", handleThumbUpdated);
  }, []);

  // Redimensionador de ancho en el borde izquierdo (Mouse + Touch en Celulares/Móviles)
  const handleStartResize = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setIsResizing(true);
    const startX = clientX;
    const startWidth = ancho;

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaX = startX - currentX; // Mover a la izquierda ensancha
      const esMovil = typeof window !== "undefined" && window.innerWidth < 1024;
      const minW = esMovil ? 140 : 280;
      const maxW = esMovil ? 210 : 800;
      const newWidth = Math.max(minW, Math.min(maxW, startWidth + deltaX));
      setAnchoNPanel(newWidth);
    };

    const onEnd = () => {
      setIsResizing(false);
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

  // Estado de captura de miniatura individual para componentes
  const [capturandoCompId, setCapturandoCompId] = useState<string | null>(null);
  const [capturaExitosaId, setCapturaExitosaId] = useState<string | null>(null);

  const handleCapturarMiniaturaComponente = async (item: DefinicionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      setCapturandoCompId(item.id);
      const canvas = document.querySelector("canvas");
      if (!canvas) {
        alert("No se encontró el lienzo 3D.");
        return;
      }

      let imageBase64 = "";
      if (typeof window !== "undefined" && (window as any).__capturarThumbnail3BF) {
        imageBase64 = (window as any).__capturarThumbnail3BF() || "";
      }
      if (!imageBase64) {
        imageBase64 = canvas.toDataURL("image/png");
      }

      const res = await fetch("/api/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: item.id, imageBase64 }),
      });

      if (res.ok) {
        setCapturaExitosaId(item.id);
        setTimeout(() => setCapturaExitosaId(null), 2000);
        
        // Actualizar la miniatura local de inmediato
        setDefiniciones((prev) =>
          prev.map((def) =>
            def.id === item.id
              ? { ...def, thumbnail: `${imageBase64}` }
              : def
          )
        );

        window.dispatchEvent(
          new CustomEvent("3bf-thumbnail-updated", { detail: { modelId: item.id, imageBase64 } })
        );
      }
    } catch (err) {
      console.error("Error al capturar miniatura de componente:", err);
    } finally {
      setCapturandoCompId(null);
    }
  };

  // Filtrado de Muebles
  const mueblesFiltrados = definiciones.filter((item) => {
    const coincideTexto = item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          item.archivo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCat = categoriaMueble === "Todos" || item.categoria.toLowerCase() === categoriaMueble.toLowerCase();
    return coincideTexto && coincideCat;
  });

  // Filtrado de Materiales
  const materialesFiltrados = MATERIALES_PBR.filter((mat) =>
    mat.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    mat.tipo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, item: DefinicionItem) => {
    setDraggedItemId(item.id);
    if (typeof window !== "undefined") {
      (window as any).__dragged3BFItem = item;
    }
    const payload = JSON.stringify({ 
      id: item.id, 
      nombre: item.nombre,
      categoria: item.categoria,
      archivo: item.archivo,
      tipo: "mueble" 
    });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    if (typeof window !== "undefined") {
      setTimeout(() => {
        (window as any).__dragged3BFItem = null;
      }, 500);
    }
  };

  const aplicarMaterial = (mat: MaterialPBRItem) => {
    setParametro("color_acabado", mat.colorHex);
    setCalibracion("rugosidadMadera", mat.rugosidad);
    setCalibracion("metalicidadMadera", mat.metalicidad);
    if (mat.previewUrl) {
      setCalibracion("customTextureUrl", mat.previewUrl);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 🔘 BOTÓN PESTAÑA CHEVRON ESTILO BLENDER (<) EN ESQUINA SUPERIOR DERECHA (Solo en Visor 3D) */}
      {/* ========================================================================= */}
      {pestanaActiva === "3d" && (
        <div 
          className={`absolute top-3 right-3 z-30 transition-all duration-200 ${
            mostrarNPanel 
              ? "opacity-0 pointer-events-none scale-75" 
              : "opacity-100 pointer-events-auto scale-100"
          }`}
        >
          <button
            onClick={() => setMostrarNPanel(true)}
            title="Mostrar panel lateral (Atajo: N)"
            style={{
              backgroundColor: coloresApariencia?.fondoPaneles || "#FFFFFF",
              borderColor: coloresApariencia?.bordePaneles || "#CBD5E1",
            }}
            className="flex items-center justify-center w-5.5 h-5.5 lg:w-7 lg:h-7 rounded-full border shadow-md backdrop-blur-md transition-all cursor-pointer group hover:scale-105 box-border"
          >
            <ChevronLeft 
              style={{ color: coloresApariencia?.colorMarca || "#0891b2" }}
              className="w-3 h-3 lg:w-4 lg:h-4 group-hover:-translate-x-0.5 transition-transform" 
            />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🗂️ SIDEBAR N-PANEL REDIMENSIONABLE (Borde Izquierdo + Pestañas Verticales)   */}
      {/* ========================================================================= */}
      <aside
        style={pestanaActiva === "3d" ? { 
          width: `${ancho}px`,
          backgroundColor: coloresApariencia?.fondoPaneles,
          borderColor: coloresApariencia?.bordePaneles,
          color: coloresApariencia?.textoPrincipal
        } : {
          backgroundColor: coloresApariencia?.fondoPaneles,
          color: coloresApariencia?.textoPrincipal
        }}
        className={pestanaActiva === "3d" 
          ? `absolute top-3 bottom-3 right-3 z-40 rounded-2xl glass-panel border shadow-2xl flex flex-row overflow-hidden transition-transform ${
              isResizing ? "transition-none select-none" : "duration-300 ease-in-out"
            } ${
              mostrarNPanel 
                ? "translate-x-0 opacity-100 pointer-events-auto" 
                : "translate-x-[110%] opacity-0 pointer-events-none"
            }`
          : `absolute inset-0 z-40 rounded-xl glass-panel flex flex-row overflow-hidden transition-transform duration-300 ease-in-out ${
              mostrarNPanel 
                ? "translate-x-0 opacity-100 pointer-events-auto" 
                : "translate-x-full opacity-0 pointer-events-none"
            }`
        }
      >
        {/* ========================================================================= */}
        {/* ↔️ CONTROLADOR DE REDIMENSIÓN EN BORDE IZQUIERDO (Solo en Visor 3D)         */}
        {/* ========================================================================= */}
        {pestanaActiva === "3d" && (
          <div
            onMouseDown={handleStartResize}
            onTouchStart={handleStartResize}
            title="Arrastrar para redimensionar el ancho (Blender style)"
            className="absolute top-0 bottom-0 left-0 w-4 -translate-x-2 cursor-ew-resize z-40 group flex items-center justify-center hover:bg-cyan-500/10 transition-colors touch-none"
          >
            <div 
              className={`w-0.5 h-16 rounded-full transition-all ${
                isResizing 
                  ? "bg-cyan-500 shadow-md shadow-cyan-500/60 w-1" 
                  : "bg-transparent group-hover:bg-cyan-500/80"
              }`} 
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 📑 COLUMNA PRINCIPAL DE CONTENIDO (Ancho fluido, consistente y fijo)      */}
        {/* ========================================================================= */}
        <div 
          style={{ borderColor: coloresApariencia?.bordePaneles }}
          className="flex-1 min-w-0 flex flex-col h-full overflow-hidden border-r"
        >
          
          {/* Cabecera del Panel */}
          <div 
            style={{ 
              backgroundColor: coloresApariencia?.fondoPaneles, 
              borderColor: coloresApariencia?.bordePaneles 
            }}
            className="p-2.5 lg:p-3.5 pb-2 lg:pb-3 border-b flex items-center justify-between shrink-0"
          >
            <div className="min-w-0">
              <h2 
                style={{ color: coloresApariencia?.textoPrincipal }}
                className="text-xs lg:text-sm font-bold leading-tight truncate"
              >
                {pestanaNPanel === "componentes" ? "Biblioteca de Componentes"
                  : pestanaNPanel === "muebles" ? "Biblioteca de Muebles"
                  : pestanaNPanel === "capas" ? "Gestor de Capas"
                  : pestanaNPanel === "partes" ? "Desglose de Partes"
                  : pestanaNPanel === "materiales" ? "Editor de Materiales PBR"
                  : pestanaNPanel === "calibrar" ? "Calibración 3D"
                  : pestanaActiva === "despiece" ? "Apariencia - Despiece & Costos"
                  : pestanaActiva === "basedatos" ? "Apariencia - Base de Datos"
                  : "Apariencia & Colores"}
              </h2>
            </div>

            <button
              onClick={() => setMostrarNPanel(false)}
              title="Cerrar panel lateral (N)"
              className="p-1 lg:p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer shrink-0 ml-1"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* VISTA 1: PESTAÑA MUEBLES (Asset Browser Catálogos por Marca / Drive)       */}
          {/* ========================================================================= */}
          {pestanaNPanel === "muebles" && <FurnitureAssetBrowser />}

          {/* ========================================================================= */}
          {/* VISTA 2: PESTAÑA CAPAS (Sistema de Capas Estilo Rhino 8)                   */}
          {/* ========================================================================= */}
          {pestanaNPanel === "capas" && <LayerManagerPanel />}

          {/* ========================================================================= */}
          {/* VISTA 3: PESTAÑA PARTES (Desglose de Partes & Mallas GHX)                 */}
          {/* ========================================================================= */}
          {pestanaNPanel === "partes" && <PartBreakdownPanel />}

          {/* ========================================================================= */}
          {/* VISTA 4: PESTAÑA MATERIALES (Editor PBR Físico Estilo Rhino 8)            */}
          {/* ========================================================================= */}
          {pestanaNPanel === "materiales" && <MaterialManagerPanel />}

          {/* ========================================================================= */}
          {/* VISTA 5: PESTAÑA COMPONENTES (Definiciones GHX en Crudo)                  */}
          {/* ========================================================================= */}
          {pestanaNPanel === "componentes" && (
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              
              {/* Buscador */}
              <div className="p-1.5 lg:p-3 pb-1 lg:pb-1.5 shrink-0">
                <div className="relative flex items-center">
                  <Search 
                    style={{ color: coloresApariencia?.textoSecundario }} 
                    className="w-3 lg:w-4 h-3 lg:h-4 absolute left-2 lg:left-3 pointer-events-none opacity-60" 
                  />
                  <input
                    type="text"
                    placeholder="Buscar componentes..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{
                      backgroundColor: coloresApariencia?.fondoAplicacion,
                      borderColor: coloresApariencia?.bordePaneles,
                      color: coloresApariencia?.textoPrincipal,
                    }}
                    className="w-full pl-6.5 lg:pl-9 pr-2.5 lg:pr-3 py-1 lg:py-2 text-[11px] lg:text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Botones de Categorías Dinámicas (Estilo y colores idénticos al TopNav) */}
              <div className="flex items-center gap-1 lg:gap-1.5 px-1.5 lg:px-3 py-1 lg:py-1.5 overflow-x-auto text-[9px] lg:text-xs no-scrollbar shrink-0">
                {["Todos", ...categorias].map((cat) => {
                  const isSelected = categoriaMueble.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoriaMueble(cat)}
                      style={
                        isSelected
                          ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.bordePaneles || "#0891b2", color: "#FFFFFF" }
                          : { backgroundColor: coloresApariencia?.botonInactivo || "#E2E8F0", borderColor: coloresApariencia?.bordeBotonInactivo || "#CBD5E1", color: coloresApariencia?.textoPrincipal || "#0F172A" }
                      }
                      className={`px-2.5 lg:px-3.5 py-0.5 lg:py-1 rounded-full font-bold whitespace-nowrap transition cursor-pointer border text-[9.5px] lg:text-xs ${
                        isSelected
                          ? "shadow-2xs text-white"
                          : "hover:opacity-90 backdrop-blur-sm"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Grid de Miniaturas Blender Style (Thumbnail + Nombre) con Scroll Vertical Directo */}
              <div className="flex-1 overflow-y-auto p-1.5 lg:p-3 custom-scrollbar touch-pan-y">
                <div className="text-[9px] lg:text-[11px] text-slate-400 font-semibold px-1 mb-1.5 lg:mb-2">
                  <span>COMPONENTES ({mueblesFiltrados.length})</span>
                </div>

                <div className="flex flex-wrap gap-1.5 lg:gap-3 p-0.5 lg:p-1 content-start items-start">
                  {mueblesFiltrados.map((item) => {
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragEnd={handleDragEnd}
                        onClick={() => use3BFStore.getState().cargarDefinicion(item)}
                        onDoubleClick={() => use3BFStore.getState().cargarDefinicion(item)}
                        title={`${item.nombre} (${item.archivo}) - Haz doble clic o arrastra al visor 3D`}
                        className={`group flex flex-col items-center cursor-grab active:cursor-grabbing p-0.5 lg:p-1 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all select-none relative w-[60px] lg:w-[88px] shrink-0 ${
                          draggedItemId === item.id ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        {/* Miniatura Cuadrada Estilo Blender */}
                        <div 
                          style={{
                            backgroundColor: coloresApariencia?.fondoAplicacion || "#F1F5F9",
                            borderColor: coloresApariencia?.fondoAplicacion || coloresApariencia?.bordePaneles || "#E2E8F0",
                          }}
                          className="w-[56px] lg:w-[84px] h-[56px] lg:h-[84px] aspect-square rounded-lg overflow-hidden border shadow-2xs group-hover:border-cyan-500/80 group-hover:shadow-md transition-all relative flex items-center justify-center p-0 shrink-0"
                        >
                          {item.thumbnail ? (
                            <img 
                              src={item.thumbnail} 
                              alt={item.nombre} 
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <Box 
                              style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} 
                              className="w-6 lg:w-9 h-6 lg:h-9 opacity-70" 
                            />
                          )}

                          {/* Botón de Captura de Miniatura en Hover (Esquina superior derecha) */}
                          <button
                            onClick={(e) => handleCapturarMiniaturaComponente(item, e)}
                            title={`Capturar vista 3D actual como miniatura para ${item.nombre}`}
                            className={`absolute top-0.5 lg:top-1 right-0.5 lg:right-1 p-0.5 lg:p-1 rounded transition-all cursor-pointer shadow-xs z-10 ${
                              capturaExitosaId === item.id
                                ? "opacity-100 bg-emerald-600 text-white"
                                : "opacity-0 group-hover:opacity-100 bg-black/65 hover:bg-cyan-600 text-white"
                            }`}
                          >
                            {capturaExitosaId === item.id ? (
                              <Check className="w-2 lg:w-3.5 h-2 lg:h-3.5 text-white" />
                            ) : (
                              <Camera className={`w-2 lg:w-3.5 h-2 lg:h-3.5 ${capturandoCompId === item.id ? "animate-pulse" : ""}`} />
                            )}
                          </button>
                        </div>

                        {/* Nombre Limpio Estilo Blender */}
                        <div className="w-full mt-1 lg:mt-1.5 px-0.5 text-center">
                          <p className="text-[10px] lg:text-xs font-semibold text-slate-700 dark:text-slate-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {item.nombre}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {mueblesFiltrados.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No hay componentes en la categoría <span className="font-bold">"{categoriaMueble}"</span>.
                  </div>
                )}
              </div>
            </div>
          )}



          {/* ========================================================================= */}
          {/* VISTA 3: PESTAÑA CALIBRAR (Integración Completa del Calibrador 3D)         */}
          {/* ========================================================================= */}
          {pestanaNPanel === "calibrar" && (
            <div className="flex-1 min-w-0 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
              
              {/* Sección 1: Material del Tablero */}
              <div 
                style={{ 
                  borderColor: coloresApariencia?.bordePaneles,
                  backgroundColor: coloresApariencia?.fondoPaneles 
                }}
                className="space-y-2.5 p-3 rounded-xl border transition-colors shadow-2xs"
              >
                <div 
                  style={{ borderColor: coloresApariencia?.bordePaneles }}
                  className="flex items-center gap-1.5 font-bold border-b pb-1.5"
                >
                  <Layers style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />
                  <span style={{ color: coloresApariencia?.textoPrincipal }}>Material del Tablero</span>
                </div>

                {/* Color Sólido Base */}
                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                  }}
                  className="flex items-center justify-between p-2 rounded-lg border shadow-xs text-xs"
                >
                  <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">Color Sólido Base</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={calibracion.colorSolido}
                      onChange={(e) => setCalibracion("colorSolido", e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal 
                      }} 
                      className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border uppercase"
                    >
                      {calibracion.colorSolido}
                    </span>
                  </div>
                </div>

                {/* Carga de Bitmap / Textura */}
                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                  }}
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs"
                >
                  <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold block">Textura Bitmap (JPG/PNG)</label>
                  {calibracion.customTextureUrl ? (
                    <div 
                      style={{
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                      }}
                      className="flex items-center justify-between gap-2 p-1.5 border rounded-xl"
                    >
                      <div className="flex items-center gap-2 overflow-hidden min-w-0">
                        <img src={calibracion.customTextureUrl} alt="Bitmap cargado" className="w-7 h-7 rounded-lg border object-cover shrink-0" />
                        <span style={{ color: coloresApariencia?.textoPrincipal }} className="text-[10px] truncate font-bold">Bitmap Activo</span>
                      </div>
                      <button
                        onClick={() => setCalibracion("customTextureUrl", null)}
                        className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold shadow-xs transition cursor-pointer shrink-0"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <label 
                      style={{
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal,
                      }}
                      className="flex items-center justify-center gap-2 p-2 border-2 border-dashed rounded-xl cursor-pointer transition hover:opacity-90 font-bold text-[11px]"
                    >
                      <Upload style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />
                      <span>Cargar Bitmap (JPG / PNG)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) {
                                setCalibracion("customTextureUrl", evt.target.result as string);
                                setModoVisual("renderizado");
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Opacidad Solidez */}
                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                  }}
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs"
                >
                  <div className="flex justify-between font-medium items-center">
                    <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">Opacidad Solidez</label>
                    <DirectNumberInput
                      value={Math.round(calibracion.opacidadMadera * 100)}
                      min={0}
                      max={100}
                      unit="%"
                      onChange={(val) => setCalibracion("opacidadMadera", val / 100)}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={calibracion.opacidadMadera}
                    onChange={(e) => setCalibracion("opacidadMadera", parseFloat(e.target.value))}
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Rugosidad */}
                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                  }}
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs"
                >
                  <div className="flex justify-between font-medium items-center">
                    <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">Rugosidad (Acabado Mate / Brillo)</label>
                    <DirectNumberInput
                      value={Math.round(calibracion.rugosidadMadera * 100)}
                      min={0}
                      max={100}
                      unit="%"
                      onChange={(val) => setCalibracion("rugosidadMadera", val / 100)}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={calibracion.rugosidadMadera}
                    onChange={(e) => setCalibracion("rugosidadMadera", parseFloat(e.target.value))}
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Metalicidad */}
                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                  }}
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs"
                >
                  <div className="flex justify-between font-medium items-center">
                    <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">Metalicidad / Especular</label>
                    <DirectNumberInput
                      value={Math.round(calibracion.metalicidadMadera * 100)}
                      min={0}
                      max={100}
                      unit="%"
                      onChange={(val) => setCalibracion("metalicidadMadera", val / 100)}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={calibracion.metalicidadMadera}
                    onChange={(e) => setCalibracion("metalicidadMadera", parseFloat(e.target.value))}
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    className="w-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Sección 2: Aristas de Contorno Técnico */}
              <div 
                style={{ 
                  borderColor: coloresApariencia?.bordePaneles,
                  backgroundColor: coloresApariencia?.fondoPaneles 
                }}
                className="space-y-2.5 p-3 rounded-xl border transition-colors shadow-2xs"
              >
                <div 
                  style={{ borderColor: coloresApariencia?.bordePaneles }}
                  className="flex items-center justify-between font-bold border-b pb-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Eye style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />
                    <span style={{ color: coloresApariencia?.textoPrincipal }}>Aristas y Contornos</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calibracion.mostrarAristas}
                      onChange={(e) => setCalibracion("mostrarAristas", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div 
                      style={{ backgroundColor: calibracion.mostrarAristas ? coloresApariencia?.botonActivo : undefined }}
                      className="w-7 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all"
                    />
                  </label>
                </div>

                {calibracion.mostrarAristas && (
                  <>
                    {/* Color de Aristas */}
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                      }}
                      className="flex items-center justify-between p-2 rounded-lg border shadow-xs text-xs"
                    >
                      <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">Color de Aristas</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={calibracion.colorAristas}
                          onChange={(e) => setCalibracion("colorAristas", e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span 
                          style={{ 
                            backgroundColor: coloresApariencia?.fondoAplicacion,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal 
                          }} 
                          className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border uppercase"
                        >
                          {calibracion.colorAristas}
                        </span>
                      </div>
                    </div>

                    {/* Opacidad de Aristas */}
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                      }}
                      className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs"
                    >
                      <div className="flex justify-between font-medium items-center">
                        <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">Opacidad de Aristas</label>
                        <DirectNumberInput
                          value={Math.round(calibracion.opacidadAristas * 100)}
                          min={0}
                          max={100}
                          unit="%"
                          onChange={(val) => setCalibracion("opacidadAristas", val / 100)}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={calibracion.opacidadAristas}
                        onChange={(e) => setCalibracion("opacidadAristas", parseFloat(e.target.value))}
                        style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                        className="w-full cursor-pointer"
                      />
                    </div>

                    {/* Calibre de Aristas (Grosor hasta 200%) */}
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                      }}
                      className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs"
                    >
                      <div className="flex justify-between font-medium items-center">
                        <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">Calibre de Aristas</label>
                        <DirectNumberInput
                          value={calibracion.calibreAristas ?? 100}
                          min={50}
                          max={200}
                          unit="%"
                          onChange={(val) => setCalibracion("calibreAristas", Math.round(val))}
                        />
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        step="5"
                        value={calibracion.calibreAristas ?? 100}
                        onChange={(e) => setCalibracion("calibreAristas", parseInt(e.target.value))}
                        style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                        className="w-full cursor-pointer"
                      />
                    </div>

                    {/* Ángulo Umbral de Aristas */}
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoPaneles, 
                        borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                      }}
                      className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs"
                    >
                      <div className="flex justify-between font-medium items-center">
                        <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">Ángulo Umbral (Detección)</label>
                        <DirectNumberInput
                          value={calibracion.thresholdAristas}
                          min={1}
                          max={120}
                          unit="°"
                          onChange={(val) => setCalibracion("thresholdAristas", Math.round(val))}
                        />
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="120"
                        step="1"
                        value={calibracion.thresholdAristas}
                        onChange={(e) => setCalibracion("thresholdAristas", parseInt(e.target.value))}
                        style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                        className="w-full cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Sección 3: Iluminación de Estudio */}
              <div 
                style={{ 
                  borderColor: coloresApariencia?.bordePaneles,
                  backgroundColor: coloresApariencia?.fondoPaneles 
                }}
                className="space-y-3 p-3 rounded-xl border transition-colors shadow-2xs"
              >
                <div 
                  style={{ borderColor: coloresApariencia?.bordePaneles }}
                  className="flex items-center justify-between font-bold border-b pb-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Sun style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5 text-amber-500" />
                    <span style={{ color: coloresApariencia?.textoPrincipal }}>Iluminación de Estudio</span>
                  </div>
                  {/* Toggle Gizmos 3D */}
                  <button
                    onClick={() => toggleGizmosLuces()}
                    title="Ver o esconder iconos 3D de las lámparas en el visor"
                    style={
                      calibracion.mostrarGizmosLuces
                        ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2", color: "#FFFFFF" }
                        : { backgroundColor: coloresApariencia?.botonInactivo || "#1E293B", borderColor: coloresApariencia?.bordeBotonInactivo || "#334155", color: coloresApariencia?.textoPrincipal || "#F8FAFC" }
                    }
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer select-none ${
                      calibracion.mostrarGizmosLuces ? "text-white shadow-md" : "hover:opacity-90 backdrop-blur-sm"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>Gizmos 3D</span>
                  </button>
                </div>

                {/* 🌟 PRESETS RÁPIDOS DE ESTUDIO */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Presets de Iluminación
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(PRESETS_ILUMINACION).map(([key, p]) => {
                      const isActivo = calibracion.presetIluminacion === key;
                      return (
                        <button
                          key={key}
                          onClick={() => aplicarPresetIluminacion(key)}
                          style={
                            isActivo
                              ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", borderColor: coloresApariencia?.colorMarca || "#0891b2", color: "#FFFFFF" }
                              : { backgroundColor: coloresApariencia?.botonInactivo || "#1E293B", borderColor: coloresApariencia?.bordeBotonInactivo || "#334155", color: coloresApariencia?.textoPrincipal || "#F8FAFC" }
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border text-left transition-all truncate cursor-pointer ${
                            isActivo ? "text-white shadow-md" : "hover:opacity-90 backdrop-blur-sm"
                          }`}
                          title={p.descripcion}
                        >
                          {p.nombre.replace(" (Recomendado)", "")}
                        </button>
                      );
                    })}
                  </div>

                  {/* 💾 Botón Establecer como Predeterminado */}
                  <div className="pt-1 flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        guardarIluminacionPredeterminada();
                        setGuardadoDefaultFeedback(true);
                        setTimeout(() => setGuardadoDefaultFeedback(false), 2200);
                      }}
                      style={
                        guardadoDefaultFeedback
                          ? { backgroundColor: "#10B98125", borderColor: "#10B981", color: "#10B981" }
                          : { backgroundColor: coloresApariencia?.botonInactivo || "#1E293B", borderColor: coloresApariencia?.bordeBotonInactivo || "#334155", color: coloresApariencia?.textoPrincipal || "#F8FAFC" }
                      }
                      className="flex-1 py-1.5 px-3 rounded-full border flex items-center justify-center gap-1.5 font-bold text-[11px] shadow-xs transition cursor-pointer hover:opacity-90 active:scale-95 select-none"
                      title="Guardar la configuración actual de lámparas, intensidades y colores para que se cargue automáticamente cada vez que inicies 3dBimFab"
                    >
                      {guardadoDefaultFeedback ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="text-emerald-500 font-bold">¡Guardado como predeterminado!</span>
                        </>
                      ) : (
                        <>
                          <Bookmark style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} className="w-3.5 h-3.5 shrink-0" />
                          <span>Establecer como predeterminado</span>
                        </>
                      )}
                    </button>

                    {tieneIluminacionPredeterminada && (
                      <button
                        onClick={() => {
                          restaurarIluminacionPredeterminada();
                        }}
                        style={{
                          backgroundColor: coloresApariencia?.botonInactivo || "#1E293B",
                          borderColor: coloresApariencia?.bordeBotonInactivo || "#334155",
                          color: coloresApariencia?.textoSecundario || "#94A3B8",
                        }}
                        className="py-1.5 px-2.5 rounded-full border flex items-center justify-center text-[10px] font-semibold transition cursor-pointer hover:text-red-400 hover:border-red-400 select-none"
                        title="Restablecer iluminación de fábrica y borrar ajuste predeterminado"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 💡 MEZCLADOR DE LUCES (ENV LIGHT MIXER) */}
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Mezclador de Lámparas (Env Light Mixer)
                  </label>

                  {Object.values(calibracion.lucesEstudio || {}).map((luz) => {
                    const isSelected = calibracion.luzSeleccionadaId === luz.id;
                    return (
                      <div
                        key={luz.id}
                        style={{
                          backgroundColor: isSelected ? "rgba(8, 145, 178, 0.06)" : (coloresApariencia?.fondoPaneles || undefined),
                          borderColor: isSelected ? "#0891B2" : (coloresApariencia?.bordePaneles || "#CBD5E1"),
                        }}
                        className={`flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs transition-all ${
                          isSelected ? "ring-1 ring-[#0891B2]" : ""
                        }`}
                      >
                        <div className="flex justify-between font-medium items-center">
                          <div className="flex items-center gap-1.5">
                            {/* Switch On/Off */}
                            <button
                              onClick={() => setLuzPropiedad(luz.id, "activa", !luz.activa)}
                              className={`p-1 rounded transition-colors ${
                                luz.activa ? "text-emerald-500 hover:text-emerald-600" : "text-slate-400 hover:text-slate-600"
                              }`}
                              title={luz.activa ? "Apagar luz" : "Encender luz"}
                            >
                              <Power className="w-3 h-3" />
                            </button>

                            {/* Nombre y Selección 3D */}
                            <button
                              onClick={() => seleccionarLuzEstudio(isSelected ? null : luz.id)}
                              className="font-bold text-left hover:text-[#0891B2] transition-colors truncate max-w-[140px]"
                              style={{ color: coloresApariencia?.textoPrincipal }}
                              title="Clic para seleccionar y ver en 3D"
                            >
                              {luz.nombre}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Muestra de color/temperatura */}
                            <div
                              className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs"
                              style={{ backgroundColor: luz.color }}
                              title={`${luz.temperaturaKelvin} K`}
                            />
                            <DirectNumberInput
                              value={Number(luz.intensidad.toFixed(luz.id === "fill_light" ? 2 : 1))}
                              min={0}
                              max={luz.id === "fill_light" ? 1.0 : 10}
                              unit="x"
                              onChange={(val) => setLuzPropiedad(luz.id, "intensidad", val)}
                            />
                          </div>
                        </div>

                        {/* Slider de Intensidad de cada luz con rango adaptativo (fill_light máx 1.0) */}
                        <input
                          type="range"
                          min="0"
                          max={luz.id === "fill_light" ? "1" : "5"}
                          step={luz.id === "fill_light" ? "0.02" : "0.05"}
                          disabled={!luz.activa}
                          value={luz.intensidad}
                          onChange={(e) => setLuzPropiedad(luz.id, "intensidad", parseFloat(e.target.value))}
                          style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                          className="w-full cursor-pointer disabled:opacity-40"
                        />

                        {/* 🖼️ Configuración e Imagen HDRI exclusiva para Luz de Entorno */}
                        {luz.id === "env_hdri" && (
                          <div className="space-y-2 pt-1 border-t border-slate-200/40 dark:border-slate-700/40 text-[10px]">
                            {/* Cabecera HDRI con estado */}
                            <div className="flex items-center justify-between">
                              <span style={{ color: coloresApariencia?.textoSecundario }} className="font-semibold">
                                Mapa HDRI Activo:
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                luz.esHdriPorDefecto !== false
                                  ? "bg-slate-200/60 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300"
                                  : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                              }`}>
                                {luz.esHdriPorDefecto !== false ? "Por Defecto" : "Personalizado"}
                              </span>
                            </div>

                            {/* Tarjeta Visual: Miniatura + Nombre + Botón Subir */}
                            <div 
                              style={{ 
                                backgroundColor: coloresApariencia?.fondoAplicacion || "#F8FAFC",
                                borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                              }}
                              className="p-1.5 rounded-lg border flex items-center gap-2"
                            >
                              {/* Miniatura 2:1 */}
                              <div className="w-16 h-8 rounded border border-slate-300/60 dark:border-slate-700 overflow-hidden relative bg-slate-900 shrink-0 shadow-2xs">
                                <img
                                  src={luz.hdriThumbnailUrl || "/textures/hdri/modern_bathroom_1k_preview.jpg"}
                                  alt={luz.hdriNombre || "HDRI"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/textures/hdri/modern_bathroom_1k_preview.jpg";
                                  }}
                                />
                              </div>

                              {/* Nombre del Archivo y Subtítulo */}
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <span 
                                  style={{ color: coloresApariencia?.textoPrincipal }}
                                  className="font-mono text-[10px] font-bold truncate block"
                                  title={luz.hdriNombre || "modern_bathroom_1k.hdr"}
                                >
                                  {luz.hdriNombre || "modern_bathroom_1k.hdr"}
                                </span>
                                <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[9px] truncate">
                                  {luz.esHdriPorDefecto !== false ? "Baño Moderno 1K (Poly Haven)" : "Archivo cargado por usuario"}
                                </span>
                              </div>

                              {/* Acciones: Subir HDRI y Restaurar por Defecto */}
                              <div className="flex items-center gap-1 shrink-0">
                                <input
                                  type="file"
                                  id="hdri-file-upload-input"
                                  accept=".hdr,.exr,.jpg,.jpeg,.png,.webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                      setHdriPersonalizado(f);
                                      e.target.value = "";
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => document.getElementById("hdri-file-upload-input")?.click()}
                                  style={{
                                    backgroundColor: coloresApariencia?.botonInactivo || "#1E293B",
                                    borderColor: coloresApariencia?.bordeBotonInactivo || "#334155",
                                    color: coloresApariencia?.textoPrincipal || "#F8FAFC",
                                  }}
                                  className="px-2 py-1 rounded-full border flex items-center gap-1 font-bold text-[9px] hover:border-[#0891b2] transition cursor-pointer active:scale-95"
                                  title="Cargar un nuevo archivo HDRI (.hdr, .exr) o panorama equirrectangular (.jpg, .png)"
                                >
                                  <Upload className="w-2.5 h-2.5 text-[#0891b2]" />
                                  <span>Subir</span>
                                </button>

                                {luz.esHdriPorDefecto === false && (
                                  <button
                                    onClick={() => restablecerHdriPorDefecto()}
                                    style={{
                                      backgroundColor: coloresApariencia?.botonInactivo || "#1E293B",
                                      borderColor: coloresApariencia?.bordeBotonInactivo || "#334155",
                                      color: coloresApariencia?.textoSecundario || "#94A3B8",
                                    }}
                                    className="p-1 rounded-full border hover:text-red-400 hover:border-red-400 transition cursor-pointer active:scale-95"
                                    title="Restablecer HDRI por defecto (modern_bathroom_1k.hdr)"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Control de Orientación / Giro 360° */}
                            <div className="flex items-center justify-between pt-0.5 text-[10px]">
                              <span style={{ color: coloresApariencia?.textoSecundario }} className="font-semibold">Orientación / Giro 360°:</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="range"
                                  min="0"
                                  max="360"
                                  step="5"
                                  disabled={!luz.activa}
                                  value={luz.azimut}
                                  onChange={(e) => setLuzPropiedad(luz.id, "azimut", parseInt(e.target.value))}
                                  style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                                  className="w-24 cursor-pointer disabled:opacity-40"
                                  title="Gira de dónde proviene la luz del entorno HDRI"
                                />
                                <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-mono font-bold w-7 text-right">
                                  {luz.azimut}°
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección 4: Cámara & Encuadre del Escenario */}
              <div 
                style={{ 
                  borderColor: coloresApariencia?.bordePaneles,
                  backgroundColor: coloresApariencia?.fondoPaneles 
                }}
                className="space-y-2.5 p-3 rounded-xl border transition-colors shadow-2xs"
              >
                <div 
                  style={{ borderColor: coloresApariencia?.bordePaneles }}
                  className="flex items-center gap-1.5 font-bold border-b pb-1.5"
                >
                  <Camera style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />
                  <span style={{ color: coloresApariencia?.textoPrincipal }}>Cámara & Encuadre</span>
                </div>

                {/* Botón Centrar Cámara */}
                <button
                  onClick={() => centrarCamara()}
                  style={{
                    backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
                    borderColor: coloresApariencia?.colorMarca || "#0891b2",
                    color: "#FFFFFF",
                  }}
                  className="w-full py-2 px-3 rounded-full border flex items-center justify-center gap-2 font-bold text-xs shadow-md transition-all cursor-pointer hover:opacity-90 active:scale-95"
                >
                  <Focus className="w-4 h-4" />
                  <span>Centrar Cámara en Escenario</span>
                </button>

                {/* Zoom Mínimo (Acercamiento) */}
                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                  }}
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs"
                >
                  <div className="flex justify-between font-medium items-center">
                    <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">Zoom Mínimo (Acercamiento)</label>
                    <DirectNumberInput
                      value={Math.round((calibracion.zoomMinimoMetros ?? 0.02) * 100)}
                      min={1}
                      max={50}
                      unit="cm"
                      onChange={(val) => setCalibracion("zoomMinimoMetros", val / 100)}
                    />
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.50"
                    step="0.01"
                    value={calibracion.zoomMinimoMetros ?? 0.02}
                    onChange={(e) => setCalibracion("zoomMinimoMetros", parseFloat(e.target.value))}
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Zoom Máximo (Alejamiento) */}
                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                  }}
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs"
                >
                  <div className="flex justify-between font-medium items-center">
                    <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">Zoom Máximo (Alejamiento)</label>
                    <DirectNumberInput
                      value={Math.round(calibracion.zoomMaximoMetros ?? 30)}
                      min={2}
                      max={100}
                      unit="m"
                      onChange={(val) => setCalibracion("zoomMaximoMetros", val)}
                    />
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="50"
                    step="1"
                    value={calibracion.zoomMaximoMetros ?? 30}
                    onChange={(e) => setCalibracion("zoomMaximoMetros", parseFloat(e.target.value))}
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Campo de Visión (Lente FOV) */}
                <div 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.bordePaneles || "#CBD5E1" 
                  }}
                  className="flex flex-col gap-1.5 p-2 rounded-lg border shadow-xs text-xs"
                >
                  <div className="flex justify-between font-medium items-center">
                    <label style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">Campo de Visión (Lente / FOV)</label>
                    <DirectNumberInput
                      value={Math.round(calibracion.campoDeVisionFov ?? 45)}
                      min={25}
                      max={75}
                      unit="°"
                      onChange={(val) => setCalibracion("campoDeVisionFov", Math.round(val))}
                    />
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="75"
                    step="1"
                    value={calibracion.campoDeVisionFov ?? 45}
                    onChange={(e) => setCalibracion("campoDeVisionFov", parseInt(e.target.value))}
                    style={{ accentColor: coloresApariencia?.botonActivo || "#0891b2" }}
                    className="w-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Botón de Reset */}
              <div className="pt-1">
                <button
                  onClick={resetCalibracion}
                  style={{
                    backgroundColor: coloresApariencia?.botonInactivo || "#1E293B",
                    borderColor: coloresApariencia?.bordeBotonInactivo || "#334155",
                    color: coloresApariencia?.textoPrincipal || "#F8FAFC",
                  }}
                  className="w-full py-2 px-3 rounded-full border flex items-center justify-center gap-1.5 font-bold text-xs transition cursor-pointer hover:opacity-90 active:scale-95 shadow-xs"
                >
                  <RotateCcw style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5" />
                  <span>Restablecer Valores por Defecto</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISTA 6: PESTAÑA APARIENCIA (Personalización de Colores Rhino 8 Style)    */}
          {/* ========================================================================= */}
          {pestanaNPanel === "apariencia" && <AppearanceSettingsPanel />}

          {/* Pie de Panel Informativo */}
          <div 
            style={{ 
              backgroundColor: coloresApariencia?.fondoPaneles, 
              borderColor: coloresApariencia?.bordePaneles,
              color: coloresApariencia?.textoSecundario
            }}
            className="p-1.5 border-t text-[9px] flex items-center justify-between px-2.5 shrink-0"
          >
            <span className="flex items-center gap-1">
              <Info className="w-2.5 h-2.5" /> 3dBimFab {APP_VERSION}
            </span>
            <span className="font-mono text-[8.5px]">Atajo: [ N ]</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🏷️ TIRA DE PESTAÑAS VERTICALES ESTILO BLENDER                              */}
        {/* ========================================================================= */}
        <div 
          style={{ 
            backgroundColor: coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.bordePaneles 
          }}
          className="w-7 lg:w-9 shrink-0 flex flex-col py-1.5 lg:py-2.5 px-0.5 lg:px-1 items-center gap-1 lg:gap-1.5 border-l select-none overflow-y-auto no-scrollbar touch-pan-y overscroll-contain"
        >
            
            {/* Pestaña Vertical 1: Componentes */}
            <button
              onClick={() => setPestanaNPanel("componentes")}
              style={
                pestanaNPanel === "componentes"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }
                  : { color: coloresApariencia?.textoPrincipal }
              }
              title="Biblioteca de Componentes"
              className={`w-5.5 lg:w-7 py-2 lg:py-2.5 px-0.5 lg:px-1 rounded-full flex flex-col items-center justify-center gap-1 lg:gap-1.5 transition-all cursor-pointer ${
                pestanaNPanel === "componentes"
                  ? "shadow-sm font-bold"
                  : "hover:opacity-80"
              }`}
            >
              <Boxes className="w-3 lg:w-3.5 h-3 lg:h-3.5 shrink-0" />
              <span 
                style={{ writingMode: "vertical-rl" }}
                className="text-[8px] lg:text-[9px] tracking-wide font-sans leading-none font-semibold"
              >
                Componentes
              </span>
            </button>

            {/* Pestaña Vertical 2: Muebles */}
            <button
              onClick={() => setPestanaNPanel("muebles")}
              style={
                pestanaNPanel === "muebles"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }
                  : { color: coloresApariencia?.textoPrincipal }
              }
              title="Biblioteca de Muebles (Catálogos por Marca)"
              className={`w-5.5 lg:w-7 py-2 lg:py-2.5 px-0.5 lg:px-1 rounded-full flex flex-col items-center justify-center gap-1 lg:gap-1.5 transition-all cursor-pointer ${
                pestanaNPanel === "muebles"
                  ? "shadow-sm font-bold"
                  : "hover:opacity-80"
              }`}
            >
              <Package className="w-3 lg:w-3.5 h-3 lg:h-3.5 shrink-0" />
              <span 
                style={{ writingMode: "vertical-rl" }}
                className="text-[8px] lg:text-[9px] tracking-wide font-sans leading-none font-semibold"
              >
                Muebles
              </span>
            </button>

            {/* Pestaña Vertical 3: Partes */}
            <button
              onClick={() => setPestanaNPanel("partes")}
              style={
                pestanaNPanel === "partes"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }
                  : { color: coloresApariencia?.textoPrincipal }
              }
              title="Desglose de Partes y Mallas"
              className={`w-5.5 lg:w-7 py-2 lg:py-2.5 px-0.5 lg:px-1 rounded-full flex flex-col items-center justify-center gap-1 lg:gap-1.5 transition-all cursor-pointer ${
                pestanaNPanel === "partes"
                  ? "shadow-sm font-bold"
                  : "hover:opacity-80"
              }`}
            >
              <ListTree className="w-3 lg:w-3.5 h-3 lg:h-3.5 shrink-0" />
              <span 
                style={{ writingMode: "vertical-rl" }}
                className="text-[8px] lg:text-[9px] tracking-wide font-sans leading-none font-semibold"
              >
                Partes
              </span>
            </button>

            {/* Pestaña Vertical 4: Capas */}
            <button
              onClick={() => setPestanaNPanel("capas")}
              style={
                pestanaNPanel === "capas"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }
                  : { color: coloresApariencia?.textoPrincipal }
              }
              title="Gestor de Capas y Materiales Asignados"
              className={`w-5.5 lg:w-7 py-2 lg:py-2.5 px-0.5 lg:px-1 rounded-full flex flex-col items-center justify-center gap-1 lg:gap-1.5 transition-all cursor-pointer ${
                pestanaNPanel === "capas"
                  ? "shadow-sm font-bold"
                  : "hover:opacity-80"
              }`}
            >
              <Layers className="w-3 lg:w-3.5 h-3 lg:h-3.5 shrink-0" />
              <span 
                style={{ writingMode: "vertical-rl" }}
                className="text-[8px] lg:text-[9px] tracking-wide font-sans leading-none font-semibold"
              >
                Capas
              </span>
            </button>

            {/* Pestaña Vertical 5: Materiales */}
            <button
              onClick={() => setPestanaNPanel("materiales")}
              style={
                pestanaNPanel === "materiales"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }
                  : { color: coloresApariencia?.textoPrincipal }
              }
              title="Paleta de Materiales PBR"
              className={`w-5.5 lg:w-7 py-2 lg:py-2.5 px-0.5 lg:px-1 rounded-full flex flex-col items-center justify-center gap-1 lg:gap-1.5 transition-all cursor-pointer ${
                pestanaNPanel === "materiales"
                  ? "shadow-sm font-bold"
                  : "hover:opacity-80"
              }`}
            >
              <Palette className="w-3 lg:w-3.5 h-3 lg:h-3.5 shrink-0" />
              <span 
                style={{ writingMode: "vertical-rl" }}
                className="text-[8px] lg:text-[9px] tracking-wide font-sans leading-none font-semibold"
              >
                Materiales
              </span>
            </button>

            {/* Pestaña Vertical 6: Render IA */}
            <button
              onClick={() => setModalRenderIAAbierto(true)}
              style={
                modalRenderIAAbierto
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }
                  : { color: coloresApariencia?.textoPrincipal }
              }
              title="3BF AI Render Studio: Generar render fotorrealista con IA"
              className={`w-5.5 lg:w-7 py-2 lg:py-2.5 px-0.5 lg:px-1 rounded-full flex flex-col items-center justify-center gap-1 lg:gap-1.5 transition-all cursor-pointer ${
                modalRenderIAAbierto
                  ? "shadow-sm font-bold"
                  : "hover:opacity-80"
              }`}
            >
              <Camera className="w-3 lg:w-3.5 h-3 lg:h-3.5 shrink-0" />
              <span 
                style={{ writingMode: "vertical-rl" }}
                className="text-[8px] lg:text-[9px] tracking-wide font-sans leading-none font-semibold"
              >
                Render IA
              </span>
            </button>

            {/* Separador sutil */}
            <div className="w-3 lg:w-4 h-px bg-slate-200 dark:bg-slate-700 my-0.5 lg:my-1" />

            {/* Pestaña Vertical 7: Apariencia */}
            <button
              onClick={() => setPestanaNPanel("apariencia")}
              style={
                pestanaNPanel === "apariencia"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }
                  : { color: coloresApariencia?.textoPrincipal }
              }
              title="Personalización de Apariencia y Colores (Estilo Rhinoceros 8)"
              className={`w-5.5 lg:w-7 py-2 lg:py-2.5 px-0.5 lg:px-1 rounded-full flex flex-col items-center justify-center gap-1 lg:gap-1.5 transition-all cursor-pointer ${
                pestanaNPanel === "apariencia"
                  ? "shadow-sm font-bold"
                  : "hover:opacity-80"
              }`}
            >
              <Paintbrush className="w-3 lg:w-3.5 h-3 lg:h-3.5 shrink-0" />
              <span 
                style={{ writingMode: "vertical-rl" }}
                className="text-[8px] lg:text-[9px] tracking-wide font-sans leading-none font-semibold"
              >
                Apariencia
              </span>
            </button>

            {/* Pestaña Vertical 8: Calibrar */}
            <button
              onClick={() => setPestanaNPanel("calibrar")}
              style={
                pestanaNPanel === "calibrar"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }
                  : { color: coloresApariencia?.textoPrincipal }
              }
              title="Calibración de Renderizado 3D"
              className={`w-5.5 lg:w-7 py-2 lg:py-2.5 px-0.5 lg:px-1 rounded-full flex flex-col items-center justify-center gap-1 lg:gap-1.5 transition-all cursor-pointer ${
                pestanaNPanel === "calibrar"
                  ? "shadow-sm font-bold"
                  : "hover:opacity-80"
              }`}
            >
              <Sliders className="w-3 lg:w-3.5 h-3 lg:h-3.5 shrink-0" />
              <span 
                style={{ writingMode: "vertical-rl" }}
                className="text-[8px] lg:text-[9px] tracking-wide font-sans leading-none font-semibold"
              >
                Calibrar
              </span>
            </button>
          </div>
      </aside>
    </>
  );
}

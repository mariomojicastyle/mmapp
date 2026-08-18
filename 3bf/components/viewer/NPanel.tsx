"use client";

import React, { useState, useEffect } from "react";
import { use3BFStore, defaultCalibracion } from "@/lib/store";
import { 
  ChevronLeft, 
  ChevronRight, 
  Box, 
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
  Copy
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

const CATEGORIAS_FALLBACK = ["Armarios", "Comodas", "Cubiertas", "Escritorios"];

const DEFINICIONES_FALLBACK: DefinicionItem[] = [
  {
    id: "Cubierta",
    nombre: "Cubierta",
    categoria: "Cubiertas",
    archivo: "Cubierta.ghx",
    rutaRelativa: "Cubiertas/Cubierta.ghx",
    thumbnail: "/thumbnails/cubierta_render.svg",
  },
  {
    id: "Cubierta [Aug-13 '26, 1428]",
    nombre: "Cubierta v1.2",
    categoria: "Cubiertas",
    archivo: "Cubierta [Aug-13 '26, 1428].ghx",
    rutaRelativa: "Cubiertas/Cubierta [Aug-13 '26, 1428].ghx",
    thumbnail: "/thumbnails/cubierta_render.svg",
  },
  {
    id: "Cajon_Experimento_3DBimFab",
    nombre: "Cajonera 3BF",
    categoria: "Comodas",
    archivo: "Cajon_Experimento_3DBimFab.ghx",
    rutaRelativa: "Comodas/Cajon_Experimento_3DBimFab.ghx",
    thumbnail: "/thumbnails/comoda_render.svg",
  },
  {
    id: "Armario_Modular_180",
    nombre: "Armario 180",
    categoria: "Armarios",
    archivo: "Armario_Modular_180.ghx",
    rutaRelativa: "Armarios/Armario_Modular_180.ghx",
    thumbnail: "/thumbnails/armario_render.svg",
  },
  {
    id: "Escritorio_HomeOffice",
    nombre: "Escritorio Studio",
    categoria: "Escritorios",
    archivo: "Escritorio_HomeOffice.ghx",
    rutaRelativa: "Escritorios/Escritorio_HomeOffice.ghx",
    thumbnail: "/thumbnails/escritorio_render.svg",
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
    eliminarInstancia
  } = use3BFStore();

  const [ancho, setAncho] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaMueble, setCategoriaMueble] = useState<string>("Todos");
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<string[]>(CATEGORIAS_FALLBACK);
  const [definiciones, setDefiniciones] = useState<DefinicionItem[]>(DEFINICIONES_FALLBACK);

  const [timestamp, setTimestamp] = useState(Date.now());

  const cargarDefiniciones = () => {
    fetch("/api/definitions")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && data.categories.length > 0) {
          setCategorias(data.categories);
        }
        if (data.items && data.items.length > 0) {
          const mapped = data.items.map((item: DefinicionItem) => {
            const catLower = (item.categoria || "").toLowerCase();
            const idLower = (item.id || "").toLowerCase();
            
            // Prioridad a imagen PNG real si es Cubierta o existe captura
            let thumb = "/thumbnails/cubierta_render.svg";
            if (idLower.includes("cubierta")) {
              thumb = `/thumbnails/Cubierta.png?t=${Date.now()}`;
            } else if (catLower.includes("comoda") || catLower.includes("cajon")) {
              thumb = "/thumbnails/comoda_render.svg";
            } else if (catLower.includes("armario") || catLower.includes("closet")) {
              thumb = "/thumbnails/armario_render.svg";
            } else if (catLower.includes("escritorio") || catLower.includes("mesa")) {
              thumb = "/thumbnails/escritorio_render.svg";
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

  // Redimensionador de ancho en el borde izquierdo (Estilo Blender)
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = ancho;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX; // Mover a la izquierda ensancha
      const newWidth = Math.max(260, Math.min(650, startWidth + deltaX));
      setAncho(newWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
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
      {/* 🔘 BOTÓN PESTAÑA CHEVRON ESTILO BLENDER (<) EN ESQUINA SUPERIOR DERECHA     */}
      {/* ========================================================================= */}
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
          className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/90 dark:bg-[#131B2E]/90 hover:bg-cyan-50 dark:hover:bg-cyan-950/80 border border-slate-300/80 dark:border-cyan-800/60 shadow-lg backdrop-blur-md text-slate-700 dark:text-cyan-300 transition-all cursor-pointer group hover:scale-105"
        >
          <ChevronLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 🗂️ SIDEBAR N-PANEL REDIMENSIONABLE (Borde Izquierdo + Pestañas Verticales)   */}
      {/* ========================================================================= */}
      <aside
        style={{ width: `${ancho}px` }}
        className={`absolute top-3 bottom-3 right-3 z-20 rounded-2xl glass-panel border border-slate-200/90 dark:border-cyan-900/60 shadow-2xl flex flex-row overflow-hidden transition-transform ${
          isResizing ? "transition-none select-none" : "duration-300 ease-in-out"
        } ${
          mostrarNPanel 
            ? "translate-x-0 opacity-100 pointer-events-auto" 
            : "translate-x-[110%] opacity-0 pointer-events-none"
        }`}
      >
        {/* ========================================================================= */}
        {/* ↔️ CONTROLADOR DE REDIMENSIÓN EN BORDE IZQUIERDO (Estilo Blender)           */}
        {/* ========================================================================= */}
        <div
          onMouseDown={handleMouseDownResize}
          title="Arrastrar para redimensionar el ancho (Blender style)"
          className="absolute top-0 bottom-0 left-0 w-3 -translate-x-1.5 cursor-ew-resize z-40 group flex items-center justify-center hover:bg-cyan-500/10 transition-colors"
        >
          <div 
            className={`w-0.5 h-16 rounded-full transition-all ${
              isResizing 
                ? "bg-cyan-500 shadow-md shadow-cyan-500/60 w-1" 
                : "bg-transparent group-hover:bg-cyan-500/80"
            }`} 
          />
        </div>

        {/* ========================================================================= */}
        {/* 📑 COLUMNA PRINCIPAL DE CONTENIDO (Ancho fluido, consistente y fijo)      */}
        {/* ========================================================================= */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden border-r border-slate-200/80 dark:border-cyan-900/40">
          
          {/* Cabecera del Panel */}
          <div className="p-3 pb-2.5 border-b border-slate-200/80 dark:border-cyan-900/40 bg-slate-50/50 dark:bg-[#0B0F17]/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-cyan-600/10 dark:bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                {pestanaNPanel === "muebles" && <Box className="w-3.5 h-3.5" />}
                {pestanaNPanel === "materiales" && <Palette className="w-3.5 h-3.5" />}
                {pestanaNPanel === "calibrar" && <Sliders className="w-3.5 h-3.5" />}
                {pestanaNPanel === "escenario" && <Grid3X3 className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 truncate">
                  {pestanaNPanel === "muebles" && "Biblioteca de Muebles"}
                  {pestanaNPanel === "materiales" && "Paleta de Materiales"}
                  {pestanaNPanel === "calibrar" && "Calibración 3D"}
                  {pestanaNPanel === "escenario" && "Malla del Escenario"}
                  <span className="text-[9px] px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-normal shrink-0">N</span>
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {pestanaNPanel === "muebles" && "Definiciones GHX por Categoría"}
                  {pestanaNPanel === "materiales" && "Muestrario PBR & Melaminas"}
                  {pestanaNPanel === "calibrar" && "Renderizado, Luces & Aristas"}
                  {pestanaNPanel === "escenario" && "Cuadrícula, Ejes & Suelo"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setMostrarNPanel(false)}
              title="Cerrar panel lateral (N)"
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer shrink-0 ml-1"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* VISTA 1: PESTAÑA MUEBLES (Asset Browser Grid Estilo Blender)              */}
          {/* ========================================================================= */}
          {pestanaNPanel === "muebles" && (
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              
              {/* Buscador */}
              <div className="p-2.5 pb-1 shrink-0">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar en definiciones..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-[#0B0F17]/80 border border-slate-200 dark:border-cyan-900/40 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>

              {/* Botones de Categorías Dinámicas (Orden Alfabético de Carpetas) */}
              <div className="flex items-center gap-1 px-2.5 py-1.5 overflow-x-auto text-[10px] no-scrollbar shrink-0">
                {["Todos", ...categorias].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaMueble(cat)}
                    className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                      categoriaMueble.toLowerCase() === cat.toLowerCase()
                        ? "bg-cyan-600 text-white shadow-xs"
                        : "bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid de Miniaturas Blender Style (Thumbnail + Nombre) */}
              <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar">
                <div className="text-[10px] text-slate-400 font-semibold px-1 mb-2 flex items-center justify-between">
                  <span>DEFINICIONES ({mueblesFiltrados.length})</span>
                  <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-mono">Arrastrar al Escenario</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {mueblesFiltrados.map((item) => {
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragEnd={handleDragEnd}
                        onClick={() => use3BFStore.getState().cargarDefinicion(item)}
                        onDoubleClick={() => use3BFStore.getState().cargarDefinicion(item)}
                        title={`${item.nombre} (${item.archivo}) - Doble clic o arrastra al 3D para abrir`}
                        className={`p-1.5 rounded-xl border border-slate-200/90 dark:border-cyan-900/40 hover:border-cyan-400 dark:hover:border-cyan-500 flex flex-col items-center justify-between transition-all cursor-grab active:cursor-grabbing group bg-white/70 dark:bg-[#131B2E]/70 hover:bg-white dark:hover:bg-[#131B2E] hover:shadow-md ${
                          draggedItemId === item.id ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        {/* Miniatura Cuadrada de Previsualización (Render Blender Style) */}
                        <div className="w-full aspect-square bg-[#15191E] rounded-lg overflow-hidden border border-slate-700/50 relative flex items-center justify-center p-1 shadow-inner group-hover:scale-[1.02] transition-transform">
                          {item.thumbnail ? (
                            <img 
                              src={item.thumbnail} 
                              alt={item.nombre} 
                              className="w-full h-full object-contain pointer-events-none"
                            />
                          ) : (
                            <Box className="w-8 h-8 text-cyan-500 opacity-80" />
                          )}

                          {/* Badge de Categoría Discreto */}
                          <span className="absolute bottom-1 right-1 text-[8px] font-mono px-1 py-0.2 rounded bg-black/70 text-slate-300 font-semibold backdrop-blur-xs">
                            {item.categoria}
                          </span>
                        </div>

                        {/* Nombre del GHX Centrado y Limpio */}
                        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 text-center truncate w-full group-hover:text-cyan-600 dark:group-hover:text-cyan-400 mt-1.5 px-0.5 leading-tight">
                          {item.nombre}
                        </h4>
                      </div>
                    );
                  })}
                </div>

                {mueblesFiltrados.length === 0 && (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No hay definiciones en la categoría <span className="font-bold">"{categoriaMueble}"</span>.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISTA 2: PESTAÑA MATERIALES (Paleta PBR & Melaminas)                       */}
          {/* ========================================================================= */}
          {pestanaNPanel === "materiales" && (
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden p-2.5 space-y-3">
              <div className="text-[10px] text-slate-400 font-semibold px-1 flex items-center justify-between shrink-0">
                <span>MELAMINAS & ACABADOS PBR</span>
                <span className="text-[9px] text-cyan-600 dark:text-cyan-400">Clic para aplicar</span>
              </div>

              {/* Grid de Materiales */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <div className="grid grid-cols-2 gap-2">
                  {materialesFiltrados.map((mat) => {
                    const isActivo = parametros.color_acabado?.toLowerCase() === mat.colorHex.toLowerCase();
                    return (
                      <button
                        key={mat.id}
                        onClick={() => aplicarMaterial(mat)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer group bg-white/70 dark:bg-[#131B2E]/70 hover:bg-white dark:hover:bg-[#131B2E] ${
                          isActivo
                            ? "border-cyan-500 ring-2 ring-cyan-500/20 shadow-md"
                            : "border-slate-200 dark:border-cyan-900/40 hover:border-cyan-400/60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            style={{ backgroundColor: mat.colorHex }}
                            className="w-6 h-6 rounded-lg border border-black/10 shadow-xs flex items-center justify-center shrink-0"
                          >
                            {isActivo && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-400 truncate">
                            {mat.proveedor}
                          </span>
                        </div>

                        <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                          {mat.nombre}
                        </h5>
                        <span className="text-[9px] text-slate-400 mt-0.5 truncate">
                          {mat.tipo}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISTA 3: PESTAÑA CALIBRAR (Integración Completa del Calibrador 3D)         */}
          {/* ========================================================================= */}
          {pestanaNPanel === "calibrar" && (
            <div className="flex-1 min-w-0 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
              
              {/* Sección 1: Material del Tablero */}
              <div className="space-y-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-[#0B0F17]/60 border border-slate-200/80 dark:border-cyan-900/40">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold border-b border-slate-200/60 dark:border-gray-800/60 pb-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Material del Tablero</span>
                </div>

                {/* Color Sólido Base */}
                <div className="flex items-center justify-between">
                  <label className="text-slate-600 dark:text-slate-400 font-medium">Color Sólido Base</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={calibracion.colorSolido}
                      onChange={(e) => setCalibracion("colorSolido", e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-slate-500 uppercase">{calibracion.colorSolido}</span>
                  </div>
                </div>

                {/* Carga de Bitmap / Textura */}
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-medium block mb-1">Textura Bitmap (JPG/PNG)</label>
                  {calibracion.customTextureUrl ? (
                    <div className="flex items-center justify-between gap-2 p-1.5 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                      <div className="flex items-center gap-2 overflow-hidden min-w-0">
                        <img src={calibracion.customTextureUrl} alt="Bitmap cargado" className="w-7 h-7 rounded border object-cover shrink-0" />
                        <span className="text-[10px] text-cyan-700 dark:text-cyan-300 truncate font-semibold">Bitmap Activo</span>
                      </div>
                      <button
                        onClick={() => setCalibracion("customTextureUrl", null)}
                        className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold shadow transition cursor-pointer shrink-0"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-cyan-300 dark:border-cyan-800 hover:border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-lg cursor-pointer transition text-cyan-700 dark:text-cyan-300 font-semibold text-[11px]">
                      <Upload className="w-3.5 h-3.5" />
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

                {/* Opacidad Madera */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Opacidad Solidez</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {Math.round(calibracion.opacidadMadera * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={calibracion.opacidadMadera}
                    onChange={(e) => setCalibracion("opacidadMadera", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>

                {/* Rugosidad */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Rugosidad (Roughness)</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {calibracion.rugosidadMadera.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={calibracion.rugosidadMadera}
                    onChange={(e) => setCalibracion("rugosidadMadera", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>

                {/* Metalicidad */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Metalicidad (Metalness)</span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {calibracion.metalicidadMadera.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={calibracion.metalicidadMadera}
                    onChange={(e) => setCalibracion("metalicidadMadera", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>
              </div>

              {/* Sección 2: Aristas de Contorno Técnico */}
              <div className="space-y-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-[#0B0F17]/60 border border-slate-200/80 dark:border-cyan-900/40">
                <div className="flex items-center justify-between text-slate-900 dark:text-white font-bold border-b border-slate-200/60 dark:border-gray-800/60 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Aristas y Contornos</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calibracion.mostrarAristas}
                      onChange={(e) => setCalibracion("mostrarAristas", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>

                {calibracion.mostrarAristas && (
                  <>
                    {/* Color de Aristas */}
                    <div className="flex items-center justify-between">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Color de Aristas</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={calibracion.colorAristas}
                          onChange={(e) => setCalibracion("colorAristas", e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="font-mono text-[10px] text-slate-500 uppercase">{calibracion.colorAristas}</span>
                      </div>
                    </div>

                    {/* Opacidad de Aristas */}
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                        <span>Opacidad de Aristas</span>
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {Math.round(calibracion.opacidadAristas * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={calibracion.opacidadAristas}
                        onChange={(e) => setCalibracion("opacidadAristas", parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                      />
                    </div>

                    {/* Ángulo Umbral de Aristas */}
                    <div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                        <span>Ángulo Umbral (Detección)</span>
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {calibracion.thresholdAristas}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="89"
                        step="1"
                        value={calibracion.thresholdAristas}
                        onChange={(e) => setCalibracion("thresholdAristas", parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Sección 3: Iluminación de Estudio */}
              <div className="space-y-2.5 p-3 rounded-xl bg-slate-50/70 dark:bg-[#0B0F17]/60 border border-slate-200/80 dark:border-cyan-900/40">
                <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold border-b border-slate-200/60 dark:border-gray-800/60 pb-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Iluminación de Estudio</span>
                </div>

                {/* Luz Directa */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Luz Directa Principal</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {calibracion.intensidadLuzDirecta.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={calibracion.intensidadLuzDirecta}
                    onChange={(e) => setCalibracion("intensidadLuzDirecta", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Luz Ambiental */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Luz Ambiental Global</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {calibracion.intensidadLuzAmbiental.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={calibracion.intensidadLuzAmbiental}
                    onChange={(e) => setCalibracion("intensidadLuzAmbiental", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Botón de Reset */}
              <div className="pt-1">
                <button
                  onClick={resetCalibracion}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 font-bold transition-all shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Valores por Defecto</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISTA 4: PESTAÑA ESCENARIO (Outliner + Control de Malla / Grid)             */}
          {/* ========================================================================= */}
          {pestanaNPanel === "escenario" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs custom-scrollbar">
              {/* 🌲 OUTLINER: OBJETOS EN ESCENA */}
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B0F17]/80 border border-slate-200 dark:border-cyan-900/40 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Objetos en Escena</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-bold">
                    {Object.keys(instancias).length} {Object.keys(instancias).length === 1 ? "objeto" : "objetos"}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pt-1">
                  {Object.values(instancias).map((inst) => {
                    const isActivo = inst.id === objetoActivoId;
                    return (
                      <div
                        key={inst.id}
                        onClick={() => seleccionarInstancia(inst.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                          isActivo
                            ? "bg-cyan-500/15 border-cyan-500 text-cyan-950 dark:text-cyan-200 font-bold shadow-xs"
                            : "bg-white/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-cyan-400/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full ${isActivo ? "bg-cyan-500 animate-pulse" : "bg-slate-400"}`} />
                          <div className="truncate">
                            <span className="text-xs truncate block">{inst.nombreVisible}</span>
                            <span className="text-[9px] text-slate-400 font-mono block">{inst.definitionId}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => duplicarInstancia(inst.id)}
                            title="Duplicar objeto (Ctrl+D)"
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-cyan-600 transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => eliminarInstancia(inst.id)}
                            title="Eliminar objeto"
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/60 text-slate-500 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {Object.keys(instancias).length === 0 && (
                    <div className="p-3 text-center text-slate-400 text-[11px]">
                      No hay objetos en la escena. Arrastra una pieza desde la pestaña de muebles.
                    </div>
                  )}
                </div>
              </div>

              {/* Activar / Desactivar Malla */}
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B0F17]/80 border border-slate-200 dark:border-cyan-900/40 space-y-2.5">
                <label className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Mostrar Malla del Escenario</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={calibracion.mostrarGrilla}
                    onChange={(e) => setCalibracion("mostrarGrilla", e.target.checked)}
                    className="w-4 h-4 text-cyan-600 rounded cursor-pointer accent-cyan-600"
                  />
                </label>
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                <label className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 to-green-500" />
                    <span>Mostrar Ejes Principales (X / Y)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={calibracion.mostrarEjesCoordenadas}
                    onChange={(e) => setCalibracion("mostrarEjesCoordenadas", e.target.checked)}
                    className="w-4 h-4 text-cyan-600 rounded cursor-pointer accent-cyan-600"
                  />
                </label>
              </div>

              {/* Cuadrícula Fina */}
              <div className="space-y-3.5 p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B0F17]/80 border border-slate-200 dark:border-cyan-900/40">
                <div className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>Cuadrícula Fina (Celdas)</span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                    {(calibracion.distanciaCuadricula * 1000).toFixed(0)} mm
                  </span>
                </div>

                {/* Distancia de Cuadrícula Fina */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Espaciado Celda Fina</span>
                    <span className="font-mono font-bold">{calibracion.distanciaCuadricula} m</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.5"
                    step="0.01"
                    value={calibracion.distanciaCuadricula}
                    onChange={(e) => setCalibracion("distanciaCuadricula", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>

                {/* Grosor Grilla Delgada */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Grosor Línea Fina</span>
                    <span className="font-mono font-bold">{calibracion.grosorGrillaDelgada.toFixed(1)} px</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.5"
                    value={calibracion.grosorGrillaDelgada}
                    onChange={(e) => setCalibracion("grosorGrillaDelgada", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>

                {/* Color Grilla Delgada */}
                <div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 mb-1.5">
                    <span>Color Grilla Delgada</span>
                    <span className="font-mono text-[10px] uppercase">{calibracion.colorGrillaDelgada}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={calibracion.colorGrillaDelgada}
                      onChange={(e) => setCalibracion("colorGrillaDelgada", e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                    <div className="flex gap-1.5 flex-1 overflow-x-auto">
                      {["#E5E7EB", "#D1D5DB", "#9CA3AF", "#30363D", "#1E293B", "#0088aa"].map((col) => (
                        <button
                          key={col}
                          onClick={() => setCalibracion("colorGrillaDelgada", col)}
                          style={{ backgroundColor: col }}
                          className="w-5 h-5 rounded-md border border-slate-300/80 dark:border-slate-600 cursor-pointer shrink-0"
                          title={col}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cuadrícula Gruesa / Secciones */}
              <div className="space-y-3.5 p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B0F17]/80 border border-slate-200 dark:border-cyan-900/40">
                <div className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>Cuadrícula Gruesa (Secciones)</span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                    {(calibracion.distanciaSeccion * 1000).toFixed(0)} mm
                  </span>
                </div>

                {/* Distancia de Sección */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Espaciado Sección Gruesa</span>
                    <span className="font-mono font-bold">{calibracion.distanciaSeccion} m</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={calibracion.distanciaSeccion}
                    onChange={(e) => setCalibracion("distanciaSeccion", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>

                {/* Grosor Grilla Gruesa */}
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Grosor Línea Gruesa</span>
                    <span className="font-mono font-bold">{calibracion.grosorGrillaGruesa.toFixed(1)} px</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.5"
                    value={calibracion.grosorGrillaGruesa}
                    onChange={(e) => setCalibracion("grosorGrillaGruesa", parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                  />
                </div>

                {/* Color Grilla Gruesa */}
                <div>
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 mb-1.5">
                    <span>Color Grilla Gruesa</span>
                    <span className="font-mono text-[10px] uppercase">{calibracion.colorGrillaGruesa}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={calibracion.colorGrillaGruesa}
                      onChange={(e) => setCalibracion("colorGrillaGruesa", e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                    <div className="flex gap-1.5 flex-1 overflow-x-auto">
                      {["#0088aa", "#00C9A7", "#0ea5e9", "#64748b", "#3b82f6", "#f59e0b"].map((col) => (
                        <button
                          key={col}
                          onClick={() => setCalibracion("colorGrillaGruesa", col)}
                          style={{ backgroundColor: col }}
                          className="w-5 h-5 rounded-md border border-slate-300/80 dark:border-slate-600 cursor-pointer shrink-0"
                          title={col}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Colores y Visibilidad de los Ejes X / Y */}
              <div className="space-y-3.5 p-2.5 rounded-xl bg-slate-100 dark:bg-[#0B0F17]/80 border border-slate-200 dark:border-cyan-900/40">
                <div className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                  <span>Ejes de Coordenadas (X / Y)</span>
                  <label className="flex items-center gap-1.5 font-normal text-[10px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={calibracion.mostrarEjesCoordenadas}
                      onChange={(e) => setCalibracion("mostrarEjesCoordenadas", e.target.checked)}
                      className="w-3.5 h-3.5 text-cyan-600 rounded cursor-pointer accent-cyan-600"
                    />
                    <span>Ambos</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 font-bold text-red-500 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={calibracion.mostrarEjeX}
                          onChange={(e) => setCalibracion("mostrarEjeX", e.target.checked)}
                          className="w-3.5 h-3.5 rounded cursor-pointer accent-red-500"
                        />
                        <span>Eje X</span>
                      </label>
                      <span className="font-mono text-[9px]">{calibracion.colorEjeX}</span>
                    </div>
                    <input
                      type="color"
                      value={calibracion.colorEjeX}
                      onChange={(e) => setCalibracion("colorEjeX", e.target.value)}
                      className="w-full h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 font-bold text-green-500 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={calibracion.mostrarEjeY}
                          onChange={(e) => setCalibracion("mostrarEjeY", e.target.checked)}
                          className="w-3.5 h-3.5 rounded cursor-pointer accent-green-500"
                        />
                        <span>Eje Y</span>
                      </label>
                      <span className="font-mono text-[9px]">{calibracion.colorEjeY}</span>
                    </div>
                    <input
                      type="color"
                      value={calibracion.colorEjeY}
                      onChange={(e) => setCalibracion("colorEjeY", e.target.value)}
                      className="w-full h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de Reset */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    setCalibracion("mostrarGrilla", true);
                    setCalibracion("mostrarEjesCoordenadas", true);
                    setCalibracion("mostrarEjeX", true);
                    setCalibracion("mostrarEjeY", true);
                    setCalibracion("distanciaCuadricula", 0.1);
                    setCalibracion("grosorGrillaDelgada", 1.0);
                    setCalibracion("colorGrillaDelgada", "#E5E7EB");
                    setCalibracion("distanciaSeccion", 0.5);
                    setCalibracion("grosorGrillaGruesa", 1.5);
                    setCalibracion("colorGrillaGruesa", "#CBD5E1");
                    setCalibracion("colorEjeX", "#ef4444");
                    setCalibracion("colorEjeY", "#22c55e");
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 font-bold transition-all shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Escenario por Defecto</span>
                </button>
              </div>
            </div>
          )}

          {/* Pie de Panel Informativo */}
          <div className="p-2 border-t border-slate-200/80 dark:border-cyan-900/40 bg-slate-50/50 dark:bg-[#0B0F17]/40 text-[10px] text-slate-400 flex items-center justify-between px-3 shrink-0">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" /> 3DBimFab Hub
            </span>
            <span className="font-mono text-[9px]">Atajo: [ N ]</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🏷️ TIRA DE PESTAÑAS VERTICALES ESTILO BLENDER (Derecha del N-Panel)       */}
        {/* ========================================================================= */}
        <div className="w-8 shrink-0 flex flex-col py-3 items-center gap-2 bg-slate-100/80 dark:bg-[#090D14]/90 border-l border-slate-200/60 dark:border-cyan-900/30 select-none">
          
          {/* Pestaña Vertical 1: Muebles */}
          <button
            onClick={() => setPestanaNPanel("muebles")}
            title="Biblioteca de Muebles"
            className={`w-7 py-3 px-1 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pestanaNPanel === "muebles"
                ? "bg-cyan-600 text-white shadow-md font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <Box className="w-3.5 h-3.5 shrink-0" />
            <span 
              style={{ writingMode: "vertical-rl" }}
              className="text-[10px] tracking-wide font-sans leading-none"
            >
              Muebles
            </span>
          </button>

          {/* Pestaña Vertical 2: Materiales */}
          <button
            onClick={() => setPestanaNPanel("materiales")}
            title="Paleta de Materiales PBR"
            className={`w-7 py-3 px-1 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pestanaNPanel === "materiales"
                ? "bg-cyan-600 text-white shadow-md font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <Palette className="w-3.5 h-3.5 shrink-0" />
            <span 
              style={{ writingMode: "vertical-rl" }}
              className="text-[10px] tracking-wide font-sans leading-none"
            >
              Materiales
            </span>
          </button>

          {/* Pestaña Vertical 3: Calibrar */}
          <button
            onClick={() => setPestanaNPanel("calibrar")}
            title="Calibración de Renderizado 3D"
            className={`w-7 py-3 px-1 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pestanaNPanel === "calibrar"
                ? "bg-cyan-600 text-white shadow-md font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span 
              style={{ writingMode: "vertical-rl" }}
              className="text-[10px] tracking-wide font-sans leading-none"
            >
              Calibrar
            </span>
          </button>

          {/* Pestaña Vertical 4: Escenario */}
          <button
            onClick={() => setPestanaNPanel("escenario")}
            title="Personalización del Escenario y Malla"
            className={`w-7 py-3 px-1 rounded-lg flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pestanaNPanel === "escenario"
                ? "bg-cyan-600 text-white shadow-md font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800"
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5 shrink-0" />
            <span 
              style={{ writingMode: "vertical-rl" }}
              className="text-[10px] tracking-wide font-sans leading-none"
            >
              Escenario
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

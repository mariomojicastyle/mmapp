"use client";

import React, { useState, useEffect } from "react";
import { use3BFStore, CarpetaMuebleNode, MuebleGuardadoItem } from "@/lib/store";
import {
  Folder,
  FolderPlus,
  FolderOpen,
  Search,
  Save,
  Box,
  Layers,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Tag,
  RefreshCw,
  Check
} from "lucide-react";

function getMuebleThumbnail(mueble: MuebleGuardadoItem): string {
  if (mueble.thumbnail) return mueble.thumbnail;
  const n = (mueble.nombre || "").toLowerCase();
  const t = (mueble.tipologia || "").toLowerCase();
  if (n.includes("cubierta") || t.includes("cubierta")) {
    return "/thumbnails/Cubierta.png";
  }
  if (n.includes("comoda") || n.includes("cajon") || n.includes("cajón") || t.includes("comoda") || t.includes("cajon")) {
    return "/thumbnails/comoda_render.svg";
  }
  if (n.includes("armario") || n.includes("closet") || t.includes("armario") || t.includes("closet")) {
    return "/thumbnails/armario_render.svg";
  }
  if (n.includes("escritorio") || n.includes("mesa") || t.includes("escritorio") || t.includes("mesa")) {
    return "/thumbnails/escritorio_render.svg";
  }
  return "/thumbnails/cubierta_render.svg";
}

export default function FurnitureAssetBrowser() {
  const {
    arbolCarpetasMuebles,
    mueblesGuardados,
    cargarArbolMuebles,
    carpetaSeleccionadaId,
    setCarpetaSeleccionadaId,
    abrirMueble,
    setModalGuardarComoAbierto,
    crearCarpetaMueble,
    renombrarMuebleGuardado,
    eliminarMuebleGuardado,
    urlGoogleDrive,
    coloresApariencia,
    anchoNPanel,
  } = use3BFStore();

  const ancho = anchoNPanel || 380;
  const esMinimo = ancho < 340;
  const esUltraCompacto = ancho < 420;
  const esCompacto = ancho < 520;

  const [busqueda, setBusqueda] = useState("");
  const [carpetasExpandidas, setCarpetasExpandidas] = useState<Record<string, boolean>>({});
  const [creandoMarca, setCreandoMarca] = useState(false);
  const [nombreNuevaMarca, setNombreNuevaMarca] = useState("");
  const [creandoSubcarpetaPara, setCreandoSubcarpetaPara] = useState<string | null>(null);
  const [nombreNuevaSubcarpeta, setNombreNuevaSubcarpeta] = useState("");

  // Estado para edición inline del nombre de mueble
  const [editandoMuebleId, setEditandoMuebleId] = useState<string | null>(null);
  const [nombreTemporal, setNombreTemporal] = useState("");
  const [sincronizando, setSincronizando] = useState(false);

  // Redimensión interactiva horizontal del módulo del árbol de carpetas
  const [anchoArbolCarpetas, setAnchoArbolCarpetas] = useState<number>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("3bf_ancho_arbol_muebles");
      if (saved) return Math.max(70, Math.min(500, Number(saved))) || 140;
    }
    return 140;
  });

  const [isResizingArbol, setIsResizingArbol] = useState(false);

  const startResizingArbol = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizingArbol(true);

    const startX = mouseDownEvent.clientX;
    const startWidth = anchoArbolCarpetas;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Dejar SIEMPRE al menos 84px para la galería de la derecha (para 1 miniatura completa)
      const maxAllowed = Math.max(70, (anchoNPanel || 380) - 48 - 84);
      const newWidth = Math.max(70, Math.min(maxAllowed, startWidth + deltaX));
      setAnchoArbolCarpetas(newWidth);
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_ancho_arbol_muebles", String(newWidth));
      }
    };

    const onMouseUp = () => {
      setIsResizingArbol(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [anchoArbolCarpetas, anchoNPanel]);

  // Espacio efectivo para el árbol garantizando SIEMPRE 84px mínimos para 1 columna de miniaturas
  const anchoDisponibleTotal = Math.max(160, ancho - 48);
  const anchoArbolEfectivo = Math.min(Math.max(70, anchoArbolCarpetas), Math.max(70, anchoDisponibleTotal - 84));

  useEffect(() => {
    cargarArbolMuebles();

    const handleThumbUpdated = () => {
      cargarArbolMuebles();
    };

    window.addEventListener("3bf-thumbnail-updated", handleThumbUpdated);
    return () => window.removeEventListener("3bf-thumbnail-updated", handleThumbUpdated);
  }, []);

  const toggleExpandir = (id: string) => {
    setCarpetasExpandidas((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const handleCrearMarca = async () => {
    if (!nombreNuevaMarca.trim()) return;
    await crearCarpetaMueble(nombreNuevaMarca.trim(), "marca", null);
    setNombreNuevaMarca("");
    setCreandoMarca(false);
  };

  const handleCrearSubcarpeta = async (padreId: string) => {
    if (!nombreNuevaSubcarpeta.trim()) return;
    await crearCarpetaMueble(nombreNuevaSubcarpeta.trim(), "tipologia", padreId);
    setNombreNuevaSubcarpeta("");
    setCreandoSubcarpetaPara(null);
  };

  const handleIniciarEdicion = (mueble: MuebleGuardadoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditandoMuebleId(mueble.id);
    setNombreTemporal(mueble.nombre);
  };

  const handleGuardarEdicion = async (id: string) => {
    if (nombreTemporal.trim()) {
      await renombrarMuebleGuardado(id, nombreTemporal.trim());
    }
    setEditandoMuebleId(null);
  };

  const handleEliminarMueble = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Estás seguro de eliminar este mueble del catálogo?")) {
      await eliminarMuebleGuardado(id);
    }
  };

  const handleSincronizarDrive = async () => {
    setSincronizando(true);
    await cargarArbolMuebles();
    setTimeout(() => setSincronizando(false), 600);
  };

  // Filtrado de Muebles según la carpeta seleccionada y búsqueda
  const mueblesFiltrados = mueblesGuardados.filter((m) => {
    // Filtro por búsqueda
    const coincideBusqueda =
      !busqueda.trim() ||
      m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.tipologia.toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideBusqueda) return false;

    // Filtro por carpeta
    if (carpetaSeleccionadaId === "all") return true;

    // Si la carpeta seleccionada es una marca
    const esMarca = arbolCarpetasMuebles.find((marca) => marca.id === carpetaSeleccionadaId);
    if (esMarca) {
      return m.marca.toLowerCase() === esMarca.nombre.toLowerCase();
    }

    // Si la carpeta seleccionada es una subcarpeta tipológica (ej: "rta-design/escritorios")
    for (const marca of arbolCarpetasMuebles) {
      const sub = marca.subcarpetas?.find((s) => s.id === carpetaSeleccionadaId);
      if (sub) {
        return (
          m.marca.toLowerCase() === marca.nombre.toLowerCase() &&
          m.tipologia.toLowerCase() === sub.nombre.toLowerCase()
        );
      }
    }

    return true;
  });

  return (
    <div 
      style={{ 
        backgroundColor: coloresApariencia?.fondoPaneles, 
        color: coloresApariencia?.textoPrincipal 
      }} 
      className="flex-1 min-w-0 flex flex-col h-full overflow-hidden transition-colors"
    >
      
      {/* ========================================================================= */}
      {/* 🔍 BARRA SUPERIOR BLENDER STYLE: BÚSQUEDA & BOTÓN GUARDAR COMO            */}
      {/* ========================================================================= */}
      <div 
        style={{ 
          backgroundColor: coloresApariencia?.fondoPaneles, 
          borderColor: coloresApariencia?.bordePaneles 
        }} 
        className="p-2.5 border-b flex items-center justify-between gap-2 shrink-0 transition-colors"
      >
        
        {/* Input Buscador */}
        <div className="relative flex-1 flex items-center">
          <Search 
            style={{ color: coloresApariencia?.textoSecundario }} 
            className="w-3.5 h-3.5 absolute left-2.5 pointer-events-none opacity-60" 
          />
          <input
            type="text"
            placeholder="Buscar muebles o marcas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              backgroundColor: coloresApariencia?.fondoAplicacion,
              borderColor: coloresApariencia?.bordePaneles,
              color: coloresApariencia?.textoPrincipal,
            }}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
          />
        </div>

        {/* Botón Principal: Guardar Como */}
        <button
          onClick={() => setModalGuardarComoAbierto(true)}
          title="Guardar el diseño actual como un mueble en el catálogo de Google Drive"
          style={{
            backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
            color: "#FFFFFF",
          }}
          className="px-3.5 py-1.5 rounded-full font-semibold text-xs flex items-center gap-1.5 shadow-xs transition hover:opacity-90 cursor-pointer shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{esUltraCompacto ? "Guardar" : "Guardar como"}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 📁 CUERPO DEL ASSET BROWSER: PANEL IZQUIERDO (ÁRBOL) + DERECHO (GRID/LIST) */}
      {/* ========================================================================= */}
      <div className="flex-1 min-w-0 flex overflow-hidden">
        
        {/* PANEL IZQUIERDO: Árbol de Catálogos / Marcas (Estilo Blender Asset Browser) */}
        <div 
          style={{ 
            width: `${anchoArbolEfectivo}px`,
            backgroundColor: coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.bordePaneles 
          }} 
          className="border-r flex flex-col shrink-0 overflow-y-auto custom-scrollbar select-none"
        >
          
          {/* Cabecera del Árbol */}
          <div 
            style={{ 
              borderColor: coloresApariencia?.bordePaneles, 
              color: coloresApariencia?.textoSecundario 
            }} 
            className="p-2 border-b flex items-center justify-between text-[10px] font-bold uppercase tracking-wider"
          >
            <span className="truncate">{esUltraCompacto ? "Catálogos" : "Catálogos & Marcas"}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleSincronizarDrive}
                title="Sincronizar carpetas con Google Drive"
                style={{ color: coloresApariencia?.textoSecundario }}
                className="p-0.5 rounded hover:opacity-80 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sincronizando ? "animate-spin text-cyan-600" : ""}`} />
              </button>
              {!creandoMarca && (
                <button
                  onClick={() => setCreandoMarca(true)}
                  title="Agregar nueva marca"
                  style={{ color: coloresApariencia?.colorMarca || coloresApariencia?.textoPrincipal }}
                  className="p-0.5 rounded hover:opacity-80 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Formulario rápido para crear nueva marca */}
          {creandoMarca && (
            <div 
              style={{ 
                backgroundColor: coloresApariencia?.fondoAplicacion, 
                borderColor: coloresApariencia?.bordePaneles 
              }} 
              className="p-2 border-b flex flex-col gap-1.5"
            >
              <input
                type="text"
                placeholder="Nombre de marca..."
                value={nombreNuevaMarca}
                onChange={(e) => setNombreNuevaMarca(e.target.value)}
                style={{
                  backgroundColor: coloresApariencia?.fondoPaneles,
                  borderColor: coloresApariencia?.bordePaneles,
                  color: coloresApariencia?.textoPrincipal,
                }}
                className="px-2 py-1 text-[11px] rounded border focus:outline-none"
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={handleCrearMarca}
                  style={{
                    backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
                    color: "#FFFFFF",
                  }}
                  className="px-2 py-0.5 text-[9px] rounded font-bold hover:opacity-90"
                >
                  Agregar
                </button>
                <button
                  onClick={() => setCreandoMarca(false)}
                  style={{ color: coloresApariencia?.textoSecundario }}
                  className="px-1.5 py-0.5 text-[9px] hover:opacity-80"
                >
                  X
                </button>
              </div>
            </div>
          )}

          {/* Opción "All / Todos los Muebles" */}
          <div className="p-1">
            <button
              onClick={() => setCarpetaSeleccionadaId("all")}
              style={
                carpetaSeleccionadaId === "all"
                  ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }
                  : { color: coloresApariencia?.textoPrincipal }
              }
              className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between font-semibold transition cursor-pointer ${
                carpetaSeleccionadaId === "all" ? "shadow-xs font-bold" : "hover:opacity-80"
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>Todos los Muebles</span>
              </span>
              <span 
                style={
                  carpetaSeleccionadaId === "all"
                    ? { backgroundColor: "rgba(0,0,0,0.2)", color: "#FFFFFF" }
                    : { backgroundColor: coloresApariencia?.fondoAplicacion, color: coloresApariencia?.textoSecundario }
                }
                className="text-[10px] font-mono px-1.5 py-0.2 rounded"
              >
                {mueblesGuardados.length}
              </span>
            </button>
          </div>

          {/* Lista de Marcas y Subcarpetas */}
          <div className="flex-1 p-1 flex flex-col gap-0.5">
            {arbolCarpetasMuebles.map((marca) => {
              const expandida = carpetasExpandidas[marca.id] !== false;
              const isSelectedMarca = carpetaSeleccionadaId === marca.id;
              const countMarca = mueblesGuardados.filter(
                (m) => m.marca.toLowerCase() === marca.nombre.toLowerCase()
              ).length;

              return (
                <div key={marca.id} className="flex flex-col">
                  {/* Fila de la Marca */}
                  <div
                    style={
                      isSelectedMarca
                        ? { 
                            backgroundColor: coloresApariencia?.fondoAplicacion, 
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal,
                            fontWeight: "bold",
                          }
                        : { 
                            color: coloresApariencia?.textoPrincipal 
                          }
                    }
                    className={`group flex items-center justify-between px-2 py-1 rounded-lg text-xs transition cursor-pointer border ${
                      isSelectedMarca ? "shadow-2xs" : "border-transparent hover:opacity-80"
                    }`}
                  >
                    <div 
                      onClick={() => setCarpetaSeleccionadaId(marca.id)}
                      className="flex-1 flex items-center gap-1.5 truncate"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandir(marca.id);
                        }}
                        style={{ color: coloresApariencia?.textoSecundario }}
                        className="p-0.5 rounded hover:opacity-80"
                      >
                        {expandida ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                      <Folder 
                        style={{ color: isSelectedMarca ? (coloresApariencia?.botonActivo || "#0891b2") : "#F59E0B" }} 
                        className={`w-3.5 h-3.5 shrink-0 ${isSelectedMarca ? "fill-current" : ""}`} 
                      />
                      <span className="truncate">{marca.nombre}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {countMarca > 0 && (
                        <span 
                          style={{ color: coloresApariencia?.textoSecundario }}
                          className="text-[9px] font-mono"
                        >
                          {countMarca}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreandoSubcarpetaPara(marca.id);
                        }}
                        title={`Agregar subcarpeta a ${marca.nombre}`}
                        style={{ color: coloresApariencia?.textoSecundario }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:opacity-100 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Input rápido para crear subcarpeta tipológica */}
                  {creandoSubcarpetaPara === marca.id && (
                    <div 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoAplicacion, 
                        borderColor: coloresApariencia?.bordePaneles 
                      }} 
                      className="ml-5 my-1 p-1 rounded border flex flex-col gap-1"
                    >
                      <input
                        type="text"
                        placeholder="Ej: Escritorios..."
                        value={nombreNuevaSubcarpeta}
                        onChange={(e) => setNombreNuevaSubcarpeta(e.target.value)}
                        style={{
                          backgroundColor: coloresApariencia?.fondoPaneles,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.textoPrincipal,
                        }}
                        className="px-1.5 py-0.5 text-[10px] rounded border focus:outline-none"
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleCrearSubcarpeta(marca.id)}
                          style={{
                            backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
                            color: "#FFFFFF",
                          }}
                          className="px-1.5 py-0.5 text-[8px] rounded font-bold"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setCreandoSubcarpetaPara(null)}
                          style={{ color: coloresApariencia?.textoSecundario }}
                          className="px-1 py-0.5 text-[8px] hover:opacity-80"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subcarpetas por Tipología */}
                  {expandida && marca.subcarpetas && (
                    <div 
                      style={{ borderColor: coloresApariencia?.bordePaneles }} 
                      className="ml-4 pl-1 border-l flex flex-col gap-0.5 my-0.5"
                    >
                      {marca.subcarpetas.map((sub) => {
                        const isSelectedSub = carpetaSeleccionadaId === sub.id;
                        const countSub = mueblesGuardados.filter(
                          (m) =>
                            m.marca.toLowerCase() === marca.nombre.toLowerCase() &&
                            m.tipologia.toLowerCase() === sub.nombre.toLowerCase()
                        ).length;

                        return (
                          <button
                            key={sub.id}
                            onClick={() => setCarpetaSeleccionadaId(sub.id)}
                            style={
                              isSelectedSub
                                ? { backgroundColor: coloresApariencia?.botonActivo || "#0891b2", color: "#FFFFFF" }
                                : { color: coloresApariencia?.textoSecundario || coloresApariencia?.textoPrincipal }
                            }
                            className={`px-2 py-1 rounded text-left text-[11px] flex items-center justify-between transition cursor-pointer ${
                              isSelectedSub ? "font-bold shadow-xs" : "hover:opacity-80"
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Folder className="w-3 h-3 shrink-0 opacity-70" />
                              <span className="truncate">{sub.nombre}</span>
                            </span>
                            {countSub > 0 && (
                              <span 
                                style={
                                  isSelectedSub
                                    ? { color: "#FFFFFF" }
                                    : { color: coloresApariencia?.textoSecundario }
                                }
                                className="text-[9px] font-mono"
                              >
                                {countSub}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ↔️ Tirador de Redimensión Horizontal entre Árbol y Galería */}
        <div
          onMouseDown={startResizingArbol}
          title="Arrastra para redimensionar el ancho del árbol de carpetas"
          style={{
            backgroundColor: isResizingArbol 
              ? (coloresApariencia?.botonActivo || "#0891b2") 
              : "transparent"
          }}
          className={`w-1.5 hover:w-2 -ml-[3px] z-10 hover:bg-cyan-500/80 cursor-col-resize flex items-center justify-center transition-all group select-none shrink-0 ${
            isResizingArbol ? "bg-cyan-500! w-2" : ""
          }`}
        >
          <div 
            style={{ backgroundColor: coloresApariencia?.bordePaneles || "#94A3B8" }}
            className="w-0.5 h-6 rounded-full group-hover:bg-white transition-colors" 
          />
        </div>

        {/* PANEL DERECHO: Galería de Muebles / Assets (Auto-Fill Grid: 1 Columna Vertical en estrecho, 2+ Columnas en amplio) */}
        <div 
          style={{ 
            backgroundColor: coloresApariencia?.fondoPaneles,
            minWidth: "84px"
          }} 
          className="flex-1 min-w-[84px] p-1.5 sm:p-2.5 overflow-y-auto custom-scrollbar flex flex-col transition-colors"
        >
          
          <div 
            style={{ color: coloresApariencia?.textoSecundario }} 
            className="text-[10px] font-semibold px-1 mb-2 flex items-center justify-between gap-1 shrink-0"
          >
            <span className="flex items-center gap-1 min-w-0 truncate font-bold">
              <Box 
                style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} 
                className="w-3.5 h-3.5 shrink-0" 
              />
              <span className="truncate">
                {esUltraCompacto ? `(${mueblesFiltrados.length})` : `MUEBLES (${mueblesFiltrados.length})`}
              </span>
            </span>
            
            {/* Acciones de Google Drive */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleSincronizarDrive}
                title="Refrescar y sincronizar cambios desde Google Drive"
                style={{ color: coloresApariencia?.textoPrincipal }}
                className="flex items-center gap-1 text-[10px] font-semibold p-1 rounded-md hover:opacity-80 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${sincronizando ? "animate-spin text-cyan-600" : ""}`} />
                {!esUltraCompacto && <span>Sincronizar</span>}
              </button>

              <a
                href={urlGoogleDrive}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir la carpeta raíz de Google Drive en una nueva pestaña"
                style={{
                  backgroundColor: coloresApariencia?.fondoAplicacion,
                  borderColor: coloresApariencia?.bordePaneles,
                  color: coloresApariencia?.textoPrincipal,
                }}
                className="flex items-center gap-1 text-[10px] font-bold hover:underline px-1.5 py-0.5 rounded-lg border shadow-2xs transition cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                {!esUltraCompacto && <span>Drive</span>}
              </a>
            </div>
          </div>

          {/* 🖼️ MODO GRID DE MINIATURAS (Uniforme y constante: se envuelven en filas o columna única sin sobresaltos de escala) */}
          <div className="flex flex-wrap gap-2 p-1 content-start items-start">
            {mueblesFiltrados.map((mueble) => {
              const isEditing = editandoMuebleId === mueble.id;
              const thumbSrc = getMuebleThumbnail(mueble);

              return (
                <div
                  key={mueble.id}
                  onClick={() => !isEditing && abrirMueble(mueble)}
                  title={`${mueble.nombre} (${mueble.tipologia})\nHaz clic para abrir en 3D o doble clic para renombrar`}
                  className="group flex flex-col items-center cursor-pointer p-0.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all select-none relative w-[78px] shrink-0"
                >
                  {/* Miniatura Cuadrada Estilo Componentes (Tamaño uniforme y constante sin deformarse) */}
                  <div 
                    style={{
                      backgroundColor: coloresApariencia?.fondoAplicacion || "#F1F5F9",
                      borderColor: coloresApariencia?.fondoAplicacion || coloresApariencia?.bordePaneles || "#E2E8F0",
                    }}
                    className="w-[74px] h-[74px] aspect-square rounded-xl overflow-hidden border shadow-2xs group-hover:border-cyan-500/80 group-hover:shadow-md transition-all relative flex items-center justify-center p-0 shrink-0"
                  >
                    {thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt={mueble.nombre}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 opacity-60">
                        <Box 
                          style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} 
                          className="w-8 h-8 group-hover:scale-105 transition-transform" 
                        />
                      </div>
                    )}

                    {/* Botón de Eliminar en Hover */}
                    <button
                      onClick={(e) => handleEliminarMueble(mueble.id, e)}
                      title="Eliminar este mueble del catálogo"
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs z-10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Nombre Limpio Centrado Abajo Estilo Componentes */}
                  <div className="w-full mt-1.5 px-0.5 text-center">
                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={nombreTemporal}
                          onChange={(e) => setNombreTemporal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleGuardarEdicion(mueble.id);
                            if (e.key === "Escape") setEditandoMuebleId(null);
                          }}
                          onBlur={() => handleGuardarEdicion(mueble.id)}
                          autoFocus
                          style={{
                            backgroundColor: coloresApariencia?.fondoAplicacion,
                            borderColor: coloresApariencia?.bordePaneles,
                            color: coloresApariencia?.textoPrincipal,
                          }}
                          className="w-full px-1 py-0.5 text-[10px] font-semibold rounded border text-center focus:outline-none shadow-2xs"
                        />
                        <button
                          onClick={() => handleGuardarEdicion(mueble.id)}
                          style={{
                            backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
                            color: "#FFFFFF",
                          }}
                          className="p-0.5 rounded hover:opacity-90 shrink-0"
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <p
                        onDoubleClick={(e) => handleIniciarEdicion(mueble, e)}
                        style={{ color: coloresApariencia?.textoPrincipal }}
                        className="text-xs font-semibold truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-tight"
                      >
                        {mueble.nombre}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Estado Vacío */}
          {mueblesFiltrados.length === 0 && (
            <div 
              style={{ color: coloresApariencia?.textoSecundario }} 
              className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3"
            >
              <div 
                style={{ backgroundColor: coloresApariencia?.fondoAplicacion }} 
                className="w-12 h-12 rounded-2xl flex items-center justify-center opacity-70"
              >
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="max-w-xs">
                <h4 
                  style={{ color: coloresApariencia?.textoPrincipal }} 
                  className="text-xs font-bold"
                >
                  No hay muebles en esta carpeta
                </h4>
                <p 
                  style={{ color: coloresApariencia?.textoSecundario }} 
                  className="text-[11px] mt-1"
                >
                  Diseña una composición en el Visor 3D y pulsa{" "}
                  <strong 
                    style={{ color: coloresApariencia?.botonActivo || "#0891b2" }} 
                    className="font-semibold"
                  >
                    Guardar como
                  </strong>{" "}
                  para añadir tu primer mueble.
                </p>
              </div>
              <button
                onClick={() => setModalGuardarComoAbierto(true)}
                style={{
                  backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
                  color: "#FFFFFF",
                }}
                className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition hover:opacity-90 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Mueble Actual</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

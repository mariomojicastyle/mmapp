"use client";

import React, { useState, useEffect, useMemo } from "react";
import { use3BFStore, BloqueEstandarDef } from "@/lib/store";
import {
  Folder,
  FolderOpen,
  Search,
  Plus,
  Boxes,
  Layers,
  Clock,
  Volume2,
  Check,
  ChevronRight,
  Info,
  Sparkles,
  ExternalLink,
  Wrench,
  HelpCircle,
  Upload,
  Sliders,
  Copy,
  Trash2,
  Loader2,
  X
} from "lucide-react";

const MARCAS_DISPONIBLES = [
  { id: "Universales", nombre: "Universales / Genéricos", icon: Boxes },
  { id: "Móveis Henn", nombre: "Móveis Henn", icon: Folder },
  { id: "Politorno", nombre: "Politorno Móveis", icon: Folder },
  { id: "RTA Design", nombre: "RTA Design", icon: Folder },
];

export default function BloquesEstandarAssetBrowser() {
  const {
    bloquesEstandar,
    carpetaBloquesSeleccionada,
    setCarpetaBloquesSeleccionada,
    cargarBloquesEstandar,
    insertarBloqueEstandarComoPaso,
    cargarBloqueEstandarParaEdicion,
    guardarNuevoBloqueEstandar,
    eliminarBloqueEstandar,
    coloresApariencia,
    anchoNPanel,
  } = use3BFStore();

  const ancho = anchoNPanel || 380;
  const esCompacto = ancho < 450;

  const [busqueda, setBusqueda] = useState("");
  const [insertadoId, setInsertadoId] = useState<string | null>(null);
  const [carpetaAbiertaId, setCarpetaAbiertaId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [rutasEditadas, setRutasEditadas] = useState<Record<string, string>>({});
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [bloqueAEliminar, setBloqueAEliminar] = useState<BloqueEstandarDef | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Formulario para nuevo bloque estándar
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaMarca, setNuevaMarca] = useState("Universales");
  const [nuevaSubcat, setNuevaSubcat] = useState("Herrajes");
  const [nuevaDesc, setNuevaDesc] = useState("");
  const [nuevaDuracion, setNuevaDuracion] = useState(8.0);
  const [nuevoGuionEs, setNuevoGuionEs] = useState("");
  const [nuevoGuionPt, setNuevoGuionPt] = useState("");
  const [nuevoGuionEn, setNuevoGuionEn] = useState("");
  const [traduciendoGuion, setTraduciendoGuion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [archivosGlb, setArchivosGlb] = useState<File[]>([]);

  const handleTraducirGuion = async () => {
    if (!nuevoGuionEs.trim()) return;
    setTraduciendoGuion(true);
    try {
      // Traducir a Português
      const resPt = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nuevoGuionEs.trim(), targetLang: "pt" }),
      });
      if (resPt.ok) {
        const dataPt = await resPt.json();
        if (dataPt.translation) setNuevoGuionPt(dataPt.translation);
      }

      // Traducir a English
      const resEn = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nuevoGuionEs.trim(), targetLang: "en" }),
      });
      if (resEn.ok) {
        const dataEn = await resEn.json();
        if (dataEn.translation) setNuevoGuionEn(dataEn.translation);
      }
    } catch (err) {
      console.error("Error traduciendo guiones en bloque:", err);
    } finally {
      setTraduciendoGuion(false);
    }
  };

  // Ancho interactivo del árbol lateral de marcas (por defecto en su extensión máxima para legibilidad total)
  const [anchoArbol, setAnchoArbol] = useState<number>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const guardado = localStorage.getItem("3bf_ancho_arbol_bloques");
      if (guardado) return Math.max(140, Math.min(260, Number(guardado)));
    }
    return 220; // Extensión máxima por defecto según solicitud de usuario
  });
  const [isResizingArbol, setIsResizingArbol] = useState(false);

  useEffect(() => {
    cargarBloquesEstandar();
  }, [cargarBloquesEstandar]);

  const startResizingArbol = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizingArbol(true);
    const startX = mouseDownEvent.clientX;
    const startWidth = anchoArbol;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nuevo = Math.max(120, Math.min(260, startWidth + delta));
      setAnchoArbol(nuevo);
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("3bf_ancho_arbol_bloques", String(nuevo));
      }
    };

    const onMouseUp = () => {
      setIsResizingArbol(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [anchoArbol]);

  // Filtrado de bloques
  const bloquesFiltrados = useMemo(() => {
    return (bloquesEstandar || []).filter((b) => {
      const matchCarpeta =
        !carpetaBloquesSeleccionada ||
        carpetaBloquesSeleccionada === "Todos" ||
        b.categoriaMarca === carpetaBloquesSeleccionada;

      const matchTexto =
        !busqueda.trim() ||
        b.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (b.descripcion && b.descripcion.toLowerCase().includes(busqueda.toLowerCase())) ||
        (b.subcategoria && b.subcategoria.toLowerCase().includes(busqueda.toLowerCase()));

      return matchCarpeta && matchTexto;
    });
  }, [bloquesEstandar, carpetaBloquesSeleccionada, busqueda]);

  const handleInsertar = (bloque: BloqueEstandarDef) => {
    insertarBloqueEstandarComoPaso(bloque);
    setInsertadoId(bloque.id);
    setTimeout(() => setInsertadoId(null), 2000);
  };

  const handleEditarBloque = (bloque: BloqueEstandarDef) => {
    cargarBloqueEstandarParaEdicion(bloque);
  };

  const getRutaFisica = (bloque: BloqueEstandarDef) => {
    if (bloque.rutaFisica) return bloque.rutaFisica;
    const carpeta = bloque.carpetaModelos?.replace(/^\/+/, "").replace(/\//g, "\\");
    if (carpeta) {
      return `C:\\Desarrollo\\mmapp\\3bf\\public\\${carpeta}`;
    }
    return `C:\\Desarrollo\\mmapp\\3bf\\public\\library\\bloques\\modelos\\${bloque.id}`;
  };

  const handleCopiarRuta = async (bloque: BloqueEstandarDef) => {
    const ruta = rutasEditadas[bloque.id] ?? getRutaFisica(bloque);
    try {
      await navigator.clipboard.writeText(ruta);
      setCopiadoId(bloque.id);
      setTimeout(() => setCopiadoId(null), 2500);
    } catch (err) {
      console.warn("Error copiando ruta:", err);
    }
  };

  const handleAbrirCarpeta = async (bloque: BloqueEstandarDef) => {
    const ruta = rutasEditadas[bloque.id] ?? getRutaFisica(bloque);
    try {
      setCarpetaAbiertaId(bloque.id);
      await fetch("/api/bloques/open-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bloque.id,
          carpetaModelos: bloque.carpetaModelos,
          ruta: ruta,
        }),
      });
      setTimeout(() => setCarpetaAbiertaId(null), 2500);
    } catch (err) {
      console.warn("Error abriendo carpeta:", err);
      setCarpetaAbiertaId(null);
    }
  };

  const handleCrearBloque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    setGuardando(true);

    const slug = nuevoNombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    let partesGlbSubidas: any[] = [];
    let carpetaModelosRuta = "";

    // Subir archivos GLB si el usuario los seleccionó
    if (archivosGlb.length > 0) {
      const fd = new FormData();
      fd.append("carpeta", slug);
      archivosGlb.forEach((f) => fd.append("files", f));

      try {
        const uploadRes = await fetch("/api/bloques/upload", {
          method: "POST",
          body: fd,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.success && uploadData.archivos) {
            carpetaModelosRuta = uploadData.carpetaModelos;
            partesGlbSubidas = uploadData.archivos.map((a: any) => ({
              id: a.nombre.replace(/\.glb$/i, "").toLowerCase(),
              nombre: a.nombre.replace(/\.glb$/i, ""),
              archivo: a.ruta,
            }));
          }
        }
      } catch (uploadErr) {
        console.warn("[3dBimFab] Error subiendo modelos GLB:", uploadErr);
      }
    }

    const payload: BloqueEstandarDef = {
      id: slug || `bloque_${Date.now()}`,
      nombre: nuevoNombre.trim(),
      categoriaMarca: nuevaMarca,
      subcategoria: nuevaSubcat.trim() || "Herrajes",
      descripcion: nuevaDesc.trim() || "Bloque estándar de armado interactivo.",
      archivo: `${slug}.3bb.json`,
      thumbnail: "/thumbnails/bloque_corredera_desacople.svg",
      duracion: Number(nuevaDuracion) || 8.0,
      guionEs: nuevoGuionEs.trim() || `Paso: ${nuevoNombre.trim()}.`,
      guionPt: nuevoGuionPt.trim() || `Passo: ${nuevoNombre.trim()}.`,
      guionEn: nuevoGuionEn.trim() || `Step: ${nuevoNombre.trim()}.`,
      carpetaModelos: carpetaModelosRuta || undefined,
      partesGlb: partesGlbSubidas.length > 0 ? partesGlbSubidas : undefined,
      fechaCreacion: new Date().toISOString(),
    };

    const ok = await guardarNuevoBloqueEstandar(payload);
    setGuardando(false);
    if (ok) {
      setModalCrearAbierto(false);
      setNuevoNombre("");
      setNuevaDesc("");
      setNuevoGuionEs("");
      setNuevoGuionPt("");
      setNuevoGuionEn("");
      setArchivosGlb([]);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!bloqueAEliminar) return;
    setEliminando(true);
    try {
      const ok = await eliminarBloqueEstandar(
        bloqueAEliminar.id,
        bloqueAEliminar.categoriaMarca,
        bloqueAEliminar.archivo
      );
      if (ok) {
        setBloqueAEliminar(null);
      } else {
        alert("No se pudo eliminar el archivo del bloque estándar.");
      }
    } catch (err) {
      console.error("Error eliminando bloque estándar:", err);
    } finally {
      setEliminando(false);
    }
  };

  const colorBoton = coloresApariencia?.botonActivo || "#0284c7";

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs select-none">
      {/* ── BARRA SUPERIOR: BUSCADOR & ACCIÓN CREAR ──────────────────────────── */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar bloque estándar (corredera, minifix...)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] outline-none focus:border-cyan-500 transition shadow-inner"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setModalCrearAbierto(true)}
          style={{ backgroundColor: colorBoton }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-[10.5px] shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          {!esCompacto && <span>Crear Bloque</span>}
        </button>
      </div>

      {/* ── CUERPO PRINCIPAL DIVIDIDO: ÁRBOL DE MARCAS + TARJETAS DE BLOQUES ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Columna Izquierda: Árbol de Marcas */}
        <div
          style={{ width: `${anchoArbol}px` }}
          className="h-full border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 bg-slate-50/30 dark:bg-slate-900/20 overflow-y-auto custom-scrollbar p-1.5 gap-1"
        >
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 py-1">
            Marcas & Categorías
          </span>

          {MARCAS_DISPONIBLES.map((cat) => {
            const esActiva = carpetaBloquesSeleccionada === cat.id;
            const Icono = cat.icon;
            const count = (bloquesEstandar || []).filter((b) => b.categoriaMarca === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setCarpetaBloquesSeleccionada(cat.id)}
                style={esActiva ? { backgroundColor: colorBoton, color: "#ffffff" } : {}}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-full text-[10.5px] font-medium transition cursor-pointer text-left ${
                  esActiva
                    ? "shadow-sm font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                  <Icono className={`w-3.5 h-3.5 shrink-0 ${esActiva ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{cat.nombre}</span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ml-1 ${
                    esActiva
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <div className="mt-auto pt-2 border-t border-slate-200 dark:border-slate-800 px-1">
            <div className="flex items-center gap-1 text-[9.5px] text-slate-400">
              <Info className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="leading-tight">
                Los bloques estándar se insertan en cualquier manual sin afectar despieces ni costos.
              </span>
            </div>
          </div>
        </div>

        {/* Barra de redimensión del árbol */}
        <div
          onMouseDown={startResizingArbol}
          title="Arrastra para redimensionar el árbol de marcas"
          className="w-1.5 h-full cursor-col-resize flex items-center justify-center hover:bg-cyan-500/20 active:bg-cyan-500/40 transition shrink-0 z-10 select-none"
        >
          <div className="w-0.5 h-6 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Columna Derecha: Tarjetas de Bloques */}
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-2.5 flex flex-col gap-2.5 bg-white dark:bg-slate-950/40">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Mostrando <strong>{bloquesFiltrados.length}</strong> bloques estándar
            </span>
            <span className="text-[10px] font-mono opacity-70">
              {carpetaBloquesSeleccionada}
            </span>
          </div>

          {bloquesFiltrados.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-2">
              <Boxes className="w-8 h-8 opacity-40 text-cyan-600" />
              <p className="text-xs font-semibold">No se encontraron bloques en esta carpeta</p>
              <p className="text-[10px] opacity-70 max-w-xs">
                Crea un nuevo bloque reutilizable o cambia la categoría seleccionada en el menú lateral.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bloquesFiltrados.map((bloque) => {
                const fueInsertado = insertadoId === bloque.id;

                return (
                  <div
                    key={bloque.id}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:border-cyan-500/40 transition-all flex flex-col gap-2 shadow-xs group"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Thumbnail SVG / PNG */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-center p-1 shadow-inner group-hover:scale-105 transition">
                        {bloque.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={bloque.thumbnail}
                            alt={bloque.nombre}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Boxes className="w-6 h-6 text-cyan-500 opacity-60" />
                        )}
                      </div>

                      {/* Info & Etiquetas */}
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                            {bloque.categoriaMarca}
                          </span>
                          {bloque.subcategoria && (
                            <span className="text-[9px] font-medium px-2 py-0.2 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {bloque.subcategoria}
                            </span>
                          )}
                          <span className="text-[9px] font-mono text-slate-400 flex items-center gap-0.5 ml-auto">
                            <Clock className="w-2.5 h-2.5" />
                            {bloque.duracion || 8.0}s
                          </span>
                        </div>

                        <h3 className="font-bold text-[11.5px] text-slate-800 dark:text-slate-100 leading-snug mt-0.5 truncate">
                          {bloque.nombre}
                        </h3>

                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                          {bloque.descripcion}
                        </p>
                      </div>
                    </div>

                    {/* Guion TTS preview sutil */}
                    {bloque.guionEs && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/[0.02] dark:bg-white/[0.02] border border-slate-200/50 dark:border-slate-800/50 text-[9.5px] text-slate-600 dark:text-slate-400 truncate">
                        <Volume2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span className="truncate italic">“{bloque.guionEs}”</span>
                      </div>
                    )}

                    {/* 📁 Ruta Completa en Disco, Copiar & Ir a Carpeta */}
                    <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center justify-between text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 px-1">
                        <span className="flex items-center gap-1.5 truncate">
                          <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>Ruta en disco (Modelos GLB):</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-inner">
                        <input
                          type="text"
                          value={rutasEditadas[bloque.id] ?? getRutaFisica(bloque)}
                          onChange={(e) =>
                            setRutasEditadas((prev) => ({ ...prev, [bloque.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAbrirCarpeta(bloque);
                          }}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="flex-1 bg-transparent border-none outline-none font-mono text-[10px] text-slate-700 dark:text-slate-200 select-all px-2.5 py-0.5 min-w-0 truncate"
                          title="Ruta física en tu disco. Haz clic para seleccionarla toda o presiona Enter para abrir."
                        />

                        {/* Botón Copiar Ruta */}
                        <button
                          type="button"
                          onClick={() => handleCopiarRuta(bloque)}
                          className={`px-3 py-1 rounded-full font-bold text-[10px] flex items-center gap-1 border transition cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                            copiadoId === bloque.id
                              ? "border-emerald-500 bg-emerald-500 text-white shadow-emerald-500/20"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                          }`}
                          title="Copiar ruta al portapapeles para pegarla en Windows Explorer (Ctrl+V)"
                        >
                          {copiadoId === bloque.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>

                        {/* Botón Ir a Carpeta */}
                        <button
                          type="button"
                          onClick={() => handleAbrirCarpeta(bloque)}
                          className={`px-3.5 py-1 rounded-full font-bold text-[10px] flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                            carpetaAbiertaId === bloque.id
                              ? "bg-amber-500 text-white shadow-amber-500/20"
                              : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          }`}
                          title="Abrir directamente esta ruta en el Explorador de Windows"
                        >
                          <FolderOpen className={`w-3.5 h-3.5 ${carpetaAbiertaId === bloque.id ? "animate-pulse" : "text-amber-600 dark:text-amber-400"}`} />
                          <span>{carpetaAbiertaId === bloque.id ? "¡Abierta!" : "Ir a Carpeta"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Botones de Acción en Cápsula Pura */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* 🗑️ Botón Eliminar Bloque Estándar */}
                      <button
                        type="button"
                        onClick={() => setBloqueAEliminar(bloque)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-500/15 border border-rose-200/80 dark:border-rose-900/40 transition-all cursor-pointer shadow-xs active:scale-90 shrink-0"
                        title={`Eliminar bloque estándar "${bloque.nombre}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {/* Botón Editar Bloque en 3D */}
                        <button
                          type="button"
                          onClick={() => handleEditarBloque(bloque)}
                          className="px-3 py-1.5 rounded-full font-bold text-[10.5px] flex items-center gap-1.5 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-95 transition cursor-pointer shadow-xs"
                          title={`Inspeccionar y editar el bloque "${bloque.nombre}" en el visor 3D`}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Editar Bloque</span>
                        </button>

                        {/* Botón Insertar en Manual */}
                        <button
                          type="button"
                          onClick={() => handleInsertar(bloque)}
                          style={
                            fueInsertado
                              ? { backgroundColor: "#10b981", color: "#ffffff" }
                              : { backgroundColor: colorBoton, color: "#ffffff" }
                          }
                          className="px-3.5 py-1.5 rounded-full font-bold text-[10.5px] flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
                        >
                          {fueInsertado ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>¡Insertado en Manual!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Insertar en Manual</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: CONFIRMACIÓN PARA ELIMINAR BLOQUE ESTÁNDAR ──────────────────── */}
      {bloqueAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-4 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-500">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                ¿Eliminar bloque estándar?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente el bloque <strong className="text-slate-900 dark:text-white">“{bloqueAEliminar.nombre}”</strong>? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setBloqueAEliminar(null)}
                disabled={eliminando}
                className="px-4 py-1.5 rounded-full font-bold text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
                className="px-4 py-1.5 rounded-full font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {eliminando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR NUEVO BLOQUE ESTÁNDAR ─────────────────────────────────── */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                  Crear Nuevo Bloque Estándar (.3bb.json)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalCrearAbierto(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCrearBloque} className="p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  Título del Bloque *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Desacople de Corredera Oculta"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                    Marca / Carpeta
                  </label>
                  <select
                    value={nuevaMarca}
                    onChange={(e) => setNuevaMarca(e.target.value)}
                    className="px-2.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 text-[11px]"
                  >
                    {MARCAS_DISPONIBLES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                    Duración (segundos)
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    step={0.5}
                    value={nuevaDuracion}
                    onChange={(e) => setNuevaDuracion(parseFloat(e.target.value) || 8.0)}
                    className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 text-center font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  Descripción Técnica Pedagógica
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalla la acción didáctica (separación de guías, accionamiento de clips, etc.)."
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                  className="px-3 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 resize-none text-[11px]"
                />
              </div>

              {/* 📦 ZONA DE CARGA DE MODELOS 3D (.GLB) */}
              <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-dashed border-cyan-500/40">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-[11px] flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Modelos 3D del Bloque (.GLB)
                  </span>
                  <span className="text-[10px] text-slate-400">Recomendado</span>
                </div>

                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                  Selecciona los archivos GLB de las piezas (ej: Fija.glb, Intermedia.glb, Movil.glb, Seguro.glb).
                </p>

                <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-cyan-500/50 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] cursor-pointer shadow-xs transition active:scale-95">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Seleccionar archivos .GLB</span>
                  <input
                    type="file"
                    multiple
                    accept=".glb"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const seleccionados = Array.from(e.target.files).filter((f) =>
                          f.name.toLowerCase().endsWith(".glb")
                        );
                        setArchivosGlb((prev) => [...prev, ...seleccionados]);
                      }
                    }}
                  />
                </label>

                {/* Lista de archivos seleccionados */}
                {archivosGlb.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {archivosGlb.map((file, idx) => (
                      <div
                        key={`${file.name}_${idx}`}
                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-200 text-[10px] font-medium border border-cyan-300 dark:border-cyan-700"
                      >
                        <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          onClick={() => setArchivosGlb(archivosGlb.filter((_, i) => i !== idx))}
                          className="hover:text-rose-500 text-slate-400 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-400">
                    Guiones de Locución TTS
                  </span>
                  <button
                    type="button"
                    disabled={traduciendoGuion || !nuevoGuionEs.trim()}
                    onClick={handleTraducirGuion}
                    style={{ borderColor: colorBoton, color: colorBoton }}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-bold transition cursor-pointer disabled:opacity-40"
                    title="Traducir automáticamente de Español a Portugués e Inglés"
                  >
                    {traduciendoGuion ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Traduciendo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Traducir Automáticamente</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    Español (ES)
                  </span>
                  <input
                    type="text"
                    placeholder="Instrucción en voz en off para armador hispano..."
                    value={nuevoGuionEs}
                    onChange={(e) => setNuevoGuionEs(e.target.value)}
                    className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    Português (PT-BR)
                  </span>
                  <input
                    type="text"
                    placeholder="Instrução em voz em off para montador brasileiro..."
                    value={nuevoGuionPt}
                    onChange={(e) => setNuevoGuionPt(e.target.value)}
                    className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    English (EN)
                  </span>
                  <input
                    type="text"
                    placeholder="Voice-over instruction for English assembler..."
                    value={nuevoGuionEn}
                    onChange={(e) => setNuevoGuionEn(e.target.value)}
                    className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalCrearAbierto(false)}
                  className="px-4 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-[11px] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{ backgroundColor: colorBoton }}
                  className="px-5 py-1.5 rounded-full text-white font-bold text-[11px] shadow-sm hover:opacity-90 active:scale-95 transition disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar Bloque"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

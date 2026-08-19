"use client";

import React, { useState } from "react";
import { use3BFStore, CarpetaMuebleNode } from "@/lib/store";
import { 
  Folder, 
  FolderPlus, 
  Save, 
  X, 
  Check, 
  Layers, 
  Package, 
  ChevronRight, 
  ChevronDown, 
  Sparkles,
  Loader2
} from "lucide-react";

export default function SaveFurnitureModal() {
  const {
    modalGuardarComoAbierto,
    setModalGuardarComoAbierto,
    arbolCarpetasMuebles,
    crearCarpetaMueble,
    guardarMuebleComo,
    guardandoMueble,
    instancias,
    getDespieceGlobal,
  } = use3BFStore();

  const [nombreMueble, setNombreMueble] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("RTA Design");
  const [tipologiaSeleccionada, setTipologiaSeleccionada] = useState("Escritorios");
  const [descripcion, setDescripcion] = useState("");
  const [creandoNuevaCarpeta, setCreandoNuevaCarpeta] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState("");
  const [mensajeExito, setMensajeExito] = useState(false);

  if (!modalGuardarComoAbierto) return null;

  const totalInstancias = Object.keys(instancias).length;
  const despiece = getDespieceGlobal();
  const totalPiezas = despiece.reduce((acc, p) => acc + (p.cantidad || 1), 0);

  // Obtener subcarpetas para la marca seleccionada
  const marcaActual = arbolCarpetasMuebles.find((m) => m.nombre === marcaSeleccionada) || arbolCarpetasMuebles[0];
  const tipologiasDisponibles = marcaActual?.subcarpetas?.map((s) => s.nombre) || ["Escritorios", "Armarios", "Mesas de noche"];

  const handleCrearSubcarpeta = async () => {
    if (!nombreNuevaCarpeta.trim()) return;
    const ok = await crearCarpetaMueble(nombreNuevaCarpeta.trim(), "tipologia", marcaActual.id);
    if (ok) {
      setTipologiaSeleccionada(nombreNuevaCarpeta.trim());
      setNombreNuevaCarpeta("");
      setCreandoNuevaCarpeta(false);
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreMueble.trim()) return;

    const ok = await guardarMuebleComo({
      nombre: nombreMueble.trim(),
      marca: marcaSeleccionada,
      tipologia: tipologiaSeleccionada,
      descripcion: descripcion.trim(),
    });

    if (ok) {
      setMensajeExito(true);
      setTimeout(() => {
        setMensajeExito(false);
        setModalGuardarComoAbierto(false);
        setNombreMueble("");
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-slate-200 dark:border-cyan-900/60 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-[#0B0F17]/70 border-b border-slate-200 dark:border-cyan-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Save className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Guardar como Mueble
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Guardar en Google Drive & Catálogo de Marcas
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalGuardarComoAbierto(false)}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="p-5 flex flex-col gap-4 text-xs">
          
          {/* Nombre del Mueble */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Nombre Oficial del Mueble *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Escritorio Gamer X1, Mesa de Noche Nórdica..."
              value={nombreMueble}
              onChange={(e) => setNombreMueble(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#090D14] border border-slate-300 dark:border-cyan-900/50 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-cyan-500 transition shadow-inner"
            />
          </div>

          {/* Selección de Marca Primaria */}
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              Marca / Catálogo Primario
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {arbolCarpetasMuebles.map((marca) => {
                const isSelected = marcaSeleccionada === marca.nombre;
                return (
                  <button
                    type="button"
                    key={marca.id}
                    onClick={() => {
                      setMarcaSeleccionada(marca.nombre);
                      const sub = marca.subcarpetas?.[0]?.nombre || "General";
                      setTipologiaSeleccionada(sub);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-cyan-600 text-white border-cyan-500 shadow-sm"
                        : "bg-slate-50 dark:bg-[#131B2E]/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-cyan-900/40 hover:border-cyan-400"
                    }`}
                  >
                    <span className="text-[11px] truncate w-full">{marca.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selección de Tipología / Subcarpeta */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Tipología / Subcarpeta de {marcaSeleccionada}
              </label>
              {!creandoNuevaCarpeta && (
                <button
                  type="button"
                  onClick={() => setCreandoNuevaCarpeta(true)}
                  className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <FolderPlus className="w-3 h-3" /> + Nueva Carpeta
                </button>
              )}
            </div>

            {/* Input para crear nueva carpeta inline */}
            {creandoNuevaCarpeta && (
              <div className="flex items-center gap-1.5 p-1.5 bg-cyan-50/60 dark:bg-cyan-950/30 rounded-xl border border-cyan-300 dark:border-cyan-800">
                <input
                  type="text"
                  placeholder="Nombre de la nueva carpeta..."
                  value={nombreNuevaCarpeta}
                  onChange={(e) => setNombreNuevaCarpeta(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-[#0B0F17] border border-cyan-400 text-slate-800 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCrearSubcarpeta}
                  className="px-2.5 py-1 bg-cyan-600 text-white rounded-lg font-bold text-[10px] hover:bg-cyan-500 cursor-pointer"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setCreandoNuevaCarpeta(false)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-800 text-[10px] cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-1">
              {tipologiasDisponibles.map((tip) => {
                const isSelected = tipologiaSeleccionada === tip;
                return (
                  <button
                    type="button"
                    key={tip}
                    onClick={() => setTipologiaSeleccionada(tip)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-cyan-600/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold shadow-xs"
                        : "bg-slate-100 dark:bg-[#0B0F17]/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    <Folder className={`w-3 h-3 ${isSelected ? "text-cyan-600 fill-cyan-600" : "text-slate-400"}`} />
                    {tip}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen del Contenido a Guardar */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F17]/60 border border-slate-200 dark:border-cyan-900/30 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600" />
              <span className="text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-white font-mono">{totalInstancias}</strong> objetos 3D en escena
              </span>
            </div>
            <div className="text-slate-500 font-mono">
              Total Tableros: <strong className="text-cyan-700 dark:text-cyan-300">{totalPiezas} u</strong>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-cyan-900/40">
            <button
              type="button"
              onClick={() => setModalGuardarComoAbierto(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoMueble || !nombreMueble.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardandoMueble ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : mensajeExito ? (
                <>
                  <Check className="w-4 h-4 text-white" /> ¡Guardado con Éxito!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Guardar Mueble
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

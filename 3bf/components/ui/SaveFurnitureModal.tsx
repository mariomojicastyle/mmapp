"use client";

import React, { useState } from "react";
import { use3BFStore } from "@/lib/store";
import { 
  Folder, 
  FolderPlus, 
  Save, 
  X, 
  Check, 
  Layers, 
  Package, 
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
    esquemaColor,
    coloresApariencia,
  } = use3BFStore();

  const esOscuro = esquemaColor === "oscuro";
  const colorBotonActivo = esOscuro ? "#1368AA" : (coloresApariencia?.botonActivo || "#0891B2");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none">
      <div 
        style={{
          backgroundColor: esOscuro ? "#131B2E" : "#FFFFFF",
          borderColor: esOscuro ? "#1E293B" : "#CBD5E1",
          color: esOscuro ? "#F8FAFC" : "#0F172A",
        }}
        className="w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div 
          style={{
            backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
            borderColor: esOscuro ? "#1E293B" : "#E2E8F0",
          }}
          className="px-5 py-4 border-b flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div 
              style={{ backgroundColor: colorBotonActivo }}
              className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold shadow-xs shrink-0"
            >
              <Save className="w-4 h-4" />
            </div>
            <div>
              <h3 
                style={{ color: esOscuro ? "#F8FAFC" : "#0F172A" }}
                className="text-sm font-bold leading-tight"
              >
                Guardar como Proyecto
              </h3>
              <p 
                style={{ color: esOscuro ? "#94A3B8" : "#64748B" }}
                className="text-[11px] mt-0.5"
              >
                Guarda simultáneamente .3bf.json (3D) y .3bm.json (Manual) en la misma carpeta
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalGuardarComoAbierto(false)}
            style={{
              color: esOscuro ? "#94A3B8" : "#64748B",
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleGuardar} className="p-5 flex flex-col gap-4 text-xs">
          
          {/* Nombre del Mueble */}
          <div className="flex flex-col gap-1.5">
            <label 
              style={{ color: esOscuro ? "#CBD5E1" : "#334155" }}
              className="font-bold flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Nombre Oficial del Mueble *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Comoda Ravenna, Escritorio Gamer X1..."
              value={nombreMueble}
              onChange={(e) => setNombreMueble(e.target.value)}
              style={{
                backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
                borderColor: esOscuro ? "#1E293B" : "#CBD5E1",
                color: esOscuro ? "#F8FAFC" : "#0F172A",
              }}
              className="w-full px-3.5 py-2 rounded-full border text-xs font-semibold focus:outline-none transition"
            />
          </div>

          {/* Selección de Marca Primaria */}
          <div className="flex flex-col gap-1.5">
            <label 
              style={{ color: esOscuro ? "#CBD5E1" : "#334155" }}
              className="font-bold flex items-center gap-1.5"
            >
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
                    style={{
                      backgroundColor: isSelected 
                        ? colorBotonActivo 
                        : (esOscuro ? "#0B0F17" : "#F1F5F9"),
                      borderColor: isSelected 
                        ? colorBotonActivo 
                        : (esOscuro ? "#1E293B" : "#CBD5E1"),
                      color: isSelected 
                        ? "#FFFFFF" 
                        : (esOscuro ? "#CBD5E1" : "#334155"),
                    }}
                    className="py-1.5 px-3 rounded-full border text-center font-bold text-xs transition flex items-center justify-center cursor-pointer shadow-xs hover:opacity-90"
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
              <label 
                style={{ color: esOscuro ? "#CBD5E1" : "#334155" }}
                className="font-bold flex items-center gap-1.5"
              >
                <Folder className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Tipología / Subcarpeta de {marcaSeleccionada}
              </label>
              {!creandoNuevaCarpeta && (
                <button
                  type="button"
                  onClick={() => setCreandoNuevaCarpeta(true)}
                  style={{ color: colorBotonActivo }}
                  className="text-[11px] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" /> + Nueva Carpeta
                </button>
              )}
            </div>

            {/* Input para crear nueva carpeta inline */}
            {creandoNuevaCarpeta && (
              <div 
                style={{
                  backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
                  borderColor: esOscuro ? "#1E293B" : "#CBD5E1",
                }}
                className="flex items-center gap-1.5 p-1.5 rounded-full border"
              >
                <input
                  type="text"
                  placeholder="Nombre de la nueva carpeta..."
                  value={nombreNuevaCarpeta}
                  onChange={(e) => setNombreNuevaCarpeta(e.target.value)}
                  style={{
                    backgroundColor: esOscuro ? "#131B2E" : "#FFFFFF",
                    borderColor: esOscuro ? "#334155" : "#E2E8F0",
                    color: esOscuro ? "#F8FAFC" : "#0F172A",
                  }}
                  className="flex-1 px-3 py-1 text-xs rounded-full border focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCrearSubcarpeta}
                  style={{ backgroundColor: colorBotonActivo }}
                  className="px-3 py-1 text-white rounded-full font-bold text-[10.5px] cursor-pointer hover:opacity-90 transition"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setCreandoNuevaCarpeta(false)}
                  style={{ color: esOscuro ? "#94A3B8" : "#64748B" }}
                  className="px-2 py-1 text-[10.5px] cursor-pointer hover:opacity-80 transition"
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
                    style={{
                      backgroundColor: isSelected 
                        ? colorBotonActivo 
                        : (esOscuro ? "#0B0F17" : "#F1F5F9"),
                      borderColor: isSelected 
                        ? colorBotonActivo 
                        : (esOscuro ? "#1E293B" : "#CBD5E1"),
                      color: isSelected 
                        ? "#FFFFFF" 
                        : (esOscuro ? "#94A3B8" : "#475569"),
                    }}
                    className="px-3 py-1 rounded-full border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs hover:opacity-90"
                  >
                    <Folder className={`w-3 h-3 ${isSelected ? "text-white fill-white" : "text-slate-400"}`} />
                    <span>{tip}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumen del Contenido a Guardar */}
          <div 
            style={{
              backgroundColor: esOscuro ? "#0B0F17" : "#F8FAFC",
              borderColor: esOscuro ? "#1E293B" : "#E2E8F0",
            }}
            className="p-3 rounded-2xl border flex items-center justify-between text-[11px]"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span style={{ color: esOscuro ? "#94A3B8" : "#64748B" }}>
                <strong style={{ color: esOscuro ? "#F8FAFC" : "#0F172A" }} className="font-mono">{totalInstancias}</strong> objetos 3D en escena
              </span>
            </div>
            <div style={{ color: esOscuro ? "#94A3B8" : "#64748B" }} className="font-mono">
              Total Tableros: <strong style={{ color: colorBotonActivo }}>{totalPiezas} u</strong>
            </div>
          </div>

          {/* Botones de Acción */}
          <div 
            style={{ borderColor: esOscuro ? "#1E293B" : "#E2E8F0" }}
            className="flex items-center justify-end gap-2 pt-2 border-t"
          >
            <button
              type="button"
              onClick={() => setModalGuardarComoAbierto(false)}
              style={{ color: esOscuro ? "#94A3B8" : "#64748B" }}
              className="px-4 py-2 rounded-full text-xs font-semibold hover:opacity-80 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoMueble || !nombreMueble.trim()}
              style={{ backgroundColor: colorBotonActivo }}
              className="px-5 py-2 rounded-full text-white text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
            >
              {guardandoMueble ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                </>
              ) : mensajeExito ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" /> ¡Guardado con Éxito!
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Guardar Proyecto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

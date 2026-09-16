"use client";

import React from "react";
import { use3BFStore } from "@/lib/store";
import { Sliders, X, Upload, Sparkles, Loader2, Check, CheckCircle2, Boxes } from "lucide-react";

export const MARCAS_DISPONIBLES = [
  { id: "Universales", nombre: "Universales / Genéricos" },
  { id: "Móveis Henn", nombre: "Móveis Henn" },
  { id: "Politorno", nombre: "Politorno Móveis" },
  { id: "RTA Design", nombre: "RTA Design" },
];

interface BloqueEstandarEditorFormProps {
  botonActivoColor: string;
}

export default function BloqueEstandarEditorForm({
  botonActivoColor,
}: BloqueEstandarEditorFormProps) {
  const { bloqueEstandarEnEdicion, setBloqueEstandarEnEdicion } = use3BFStore();

  // Estados locales para el formulario de Editar Bloque Estándar
  const [editNombre, setEditNombre] = React.useState("");
  const [editMarca, setEditMarca] = React.useState("Universales");
  const [editDuracion, setEditDuracion] = React.useState(8.0);
  const [editDesc, setEditDesc] = React.useState("");
  const [editGuionEs, setEditGuionEs] = React.useState("");
  const [editGuionPt, setEditGuionPt] = React.useState("");
  const [editGuionEn, setEditGuionEn] = React.useState("");
  const [editArchivosGlb, setEditArchivosGlb] = React.useState<File[]>([]);
  const [traduciendoEditGuion, setTraduciendoEditGuion] = React.useState(false);
  const [guardandoEdicionBloque, setGuardandoEdicionBloque] = React.useState(false);
  const [mensajeEdicionBloque, setMensajeEdicionBloque] = React.useState<string | null>(null);

  // Sincronizar formulario cada vez que se carga un bloque para edición
  React.useEffect(() => {
    if (bloqueEstandarEnEdicion) {
      setEditNombre(bloqueEstandarEnEdicion.nombre || "");
      setEditMarca(bloqueEstandarEnEdicion.categoriaMarca || "Universales");
      setEditDuracion(bloqueEstandarEnEdicion.duracion || 8.0);
      setEditDesc(bloqueEstandarEnEdicion.descripcion || "");
      setEditGuionEs(bloqueEstandarEnEdicion.guionEs || "");
      setEditGuionPt(bloqueEstandarEnEdicion.guionPt || "");
      setEditGuionEn(bloqueEstandarEnEdicion.guionEn || "");
      setEditArchivosGlb([]);
      setMensajeEdicionBloque(null);
    }
  }, [bloqueEstandarEnEdicion]);

  if (!bloqueEstandarEnEdicion) return null;

  // Traducir guiones en formulario de edición
  const handleTraducirEditGuion = async () => {
    if (!editGuionEs.trim()) return;
    setTraduciendoEditGuion(true);
    try {
      // Português
      const resPt = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editGuionEs.trim(), targetLang: "pt" }),
      });
      if (resPt.ok) {
        const dataPt = await resPt.json();
        if (dataPt.translation) setEditGuionPt(dataPt.translation);
      }

      // Inglés
      const resEn = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editGuionEs.trim(), targetLang: "en" }),
      });
      if (resEn.ok) {
        const dataEn = await resEn.json();
        if (dataEn.translation) setEditGuionEn(dataEn.translation);
      }
    } catch (err) {
      console.error("Error traduciendo guiones en edición de bloque:", err);
    } finally {
      setTraduciendoEditGuion(false);
    }
  };

  // Guardar formulario inferior de Edición de Bloque (.3bb.json)
  const handleGuardarEdicionBloque = async () => {
    if (!bloqueEstandarEnEdicion || !editNombre.trim()) return;
    setGuardandoEdicionBloque(true);
    try {
      let partesGlbSubidas = bloqueEstandarEnEdicion.partesGlb || [];
      let carpetaModelosRuta = bloqueEstandarEnEdicion.carpetaModelos || "";

      // Subir nuevos archivos GLB si el usuario seleccionó alguno
      if (editArchivosGlb.length > 0) {
        const slug = editNombre
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");

        const fd = new FormData();
        fd.append("carpeta", slug || bloqueEstandarEnEdicion.id);
        editArchivosGlb.forEach((f) => fd.append("files", f));

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
          console.warn("[3dBimFab] Error subiendo modelos GLB en edición:", uploadErr);
        }
      }

      const bloqueActualizado = {
        ...bloqueEstandarEnEdicion,
        nombre: editNombre.trim(),
        categoriaMarca: editMarca,
        duracion: Number(editDuracion) || 8.0,
        descripcion: editDesc.trim(),
        guionEs: editGuionEs.trim(),
        guionPt: editGuionPt.trim(),
        guionEn: editGuionEn.trim(),
        carpetaModelos: carpetaModelosRuta || undefined,
        partesGlb: partesGlbSubidas.length > 0 ? partesGlbSubidas : undefined,
        fechaModificacion: new Date().toISOString(),
      };

      // 1. Guardar en disco vía API
      const res = await fetch("/api/bloques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bloqueActualizado),
      });

      if (res.ok) {
        // 2. Si el manual padre previo contiene este bloque estándar en alguno de sus pasos, sincronizarlo
        const padre = use3BFStore.getState().manualPadrePrevioEdicionBloque;
        if (padre) {
          const pasosActualizados = padre.pasos.map((p) => {
            if (p.tipo === "bloque_estandar" && (p.bloqueEstandar?.id === bloqueActualizado.id || p.titulo === bloqueActualizado.nombre)) {
              return {
                ...p,
                titulo: editNombre.trim(),
                duracionTotal: Number(editDuracion) || 8.0,
                duracionAudioSegundos: Number(editDuracion) || 8.0,
                descripcion: editDesc.trim(),
                guionEs: editGuionEs.trim(),
                guionPt: editGuionPt.trim(),
                guionEn: editGuionEn.trim(),
                bloqueEstandar: {
                  ...(p.bloqueEstandar || {}),
                  ...bloqueActualizado,
                },
              };
            }
            return p;
          });
          use3BFStore.setState({
            manualPadrePrevioEdicionBloque: {
              ...padre,
              pasos: pasosActualizados,
            },
          });
        }

        // 3. Recargar biblioteca de bloques
        use3BFStore.getState().cargarBloquesEstandar();

        // 4. El formulario desaparece automáticamente tras guardar con éxito
        setBloqueEstandarEnEdicion(null);
      } else {
        setMensajeEdicionBloque("Error al guardar cambios");
        setTimeout(() => setMensajeEdicionBloque(null), 3500);
      }
    } catch (err) {
      console.error("Error guardando edición de bloque estándar:", err);
      setMensajeEdicionBloque("Error de conexión");
      setTimeout(() => setMensajeEdicionBloque(null), 3500);
    } finally {
      setGuardandoEdicionBloque(false);
    }
  };

  return (
        <div className="flex flex-col gap-3 p-3.5 rounded-2xl border border-cyan-500/40 bg-white dark:bg-slate-900 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Cabecera del Formulario de Edición */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span
                style={{ backgroundColor: botonActivoColor }}
                className="w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0"
              >
                <Sliders className="w-3.5 h-3.5" />
              </span>
              <div className="flex items-center">
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                  Editar Bloque Estándar
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBloqueEstandarEnEdicion(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Cerrar editor de bloque estándar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {/* 1. Título del Bloque */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                Título del Bloque *
              </label>
              <input
                type="text"
                required
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                placeholder="Ej. Desacople de Corredera Telescópica"
                className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 font-medium text-xs"
              />
            </div>

            {/* 2. Marca / Carpeta y Duración */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  Marca / Carpeta
                </label>
                <select
                  value={editMarca}
                  onChange={(e) => setEditMarca(e.target.value)}
                  className="px-2.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 text-[11px] cursor-pointer"
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
                  max={300}
                  step={0.5}
                  value={editDuracion}
                  onChange={(e) => setEditDuracion(parseFloat(e.target.value) || 8.0)}
                  className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 text-center font-mono text-xs"
                />
              </div>
            </div>

            {/* 3. Descripción Técnica Pedagógica */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                Descripción Técnica Pedagógica
              </label>
              <textarea
                rows={2}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Detalla la acción didáctica (separación de guías, accionamiento de clips, etc.)."
                className="px-3 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-cyan-500 resize-none text-[11px]"
              />
            </div>

            {/* 4. Modelos 3D del Bloque (.GLB) */}
            <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-dashed border-cyan-500/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-200 text-[11px] flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  Modelos 3D del Bloque (.GLB)
                </span>
                <span className="text-[10px] text-slate-400">
                  {bloqueEstandarEnEdicion.partesGlb?.length || 0} cargados
                </span>
              </div>

              {/* Lista actual de piezas GLB registradas */}
              {(bloqueEstandarEnEdicion.partesGlb || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {bloqueEstandarEnEdicion.partesGlb!.map((parte) => (
                    <div
                      key={parte.id}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-100/70 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-200 text-[10px] font-medium border border-cyan-300 dark:border-cyan-700"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>{parte.nombre || parte.id}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
                Selecciona nuevos archivos .GLB si deseas reemplazar o actualizar las piezas en disco.
              </p>

              <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-cyan-500/50 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] cursor-pointer shadow-xs transition active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                <span>Reemplazar / Seleccionar archivos .GLB</span>
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
                      setEditArchivosGlb((prev) => [...prev, ...seleccionados]);
                    }
                  }}
                />
              </label>

              {/* Archivos nuevos seleccionados pendientes de subida */}
              {editArchivosGlb.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {editArchivosGlb.map((file, idx) => (
                    <div
                      key={`${file.name}_${idx}`}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[10px] font-medium border border-amber-300 dark:border-amber-700"
                    >
                      <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => setEditArchivosGlb(editArchivosGlb.filter((_, i) => i !== idx))}
                        className="hover:text-rose-500 text-slate-400 ml-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Guiones de Locución TTS con Botón Traducir Automáticamente */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-400">
                  Guiones de Locución TTS
                </span>
                <button
                  type="button"
                  disabled={traduciendoEditGuion || !editGuionEs.trim()}
                  onClick={handleTraducirEditGuion}
                  style={{ borderColor: botonActivoColor, color: botonActivoColor }}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-bold transition cursor-pointer disabled:opacity-40"
                  title="Traducir automáticamente de Español a Portugués e Inglés"
                >
                  {traduciendoEditGuion ? (
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
                  value={editGuionEs}
                  onChange={(e) => setEditGuionEs(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px] outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  Português (PT-BR)
                </span>
                <input
                  type="text"
                  placeholder="Instrução em voz em off para montador brasileiro..."
                  value={editGuionPt}
                  onChange={(e) => setEditGuionPt(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px] outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  English (EN)
                </span>
                <input
                  type="text"
                  placeholder="Voice-over instruction for English assembler..."
                  value={editGuionEn}
                  onChange={(e) => setEditGuionEn(e.target.value)}
                  className="px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10.5px] outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Mensaje de feedback si hubo error */}
            {mensajeEdicionBloque && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-[10.5px] font-medium text-center">
                {mensajeEdicionBloque}
              </div>
            )}

            {/* Botones de Acción al Final del Formulario */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setBloqueEstandarEnEdicion(null)}
                className="px-4 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-[11px] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardandoEdicionBloque || !editNombre.trim()}
                onClick={handleGuardarEdicionBloque}
                style={{ backgroundColor: botonActivoColor }}
                className="px-5 py-1.5 rounded-full text-white font-bold text-[11px] shadow-sm hover:opacity-90 active:scale-95 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {guardandoEdicionBloque ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando Cambios...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
  );
}

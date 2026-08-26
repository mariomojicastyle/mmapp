"use client";

import React, { useState } from "react";
import { Plus, Trash2, Users, Globe, Building2, FileText, ArrowRight, X, Check, BookmarkPlus } from "lucide-react";

export interface RoomConfigData {
  empresa: string;
  titulo: string;
  idioma1: string;
  idioma2: string;
  participantes1: string[];
  participantes2: string[];
}

export function ModalConfiguracionSala({
  isOpen,
  initialData,
  onSave,
  onCreateOnly,
  onClose
}: {
  isOpen: boolean;
  initialData: RoomConfigData;
  onSave: (config: RoomConfigData) => void;
  onCreateOnly?: (config: RoomConfigData) => void;
  onClose: () => void;
}) {
  const [empresa, setEmpresa] = useState(initialData.empresa || "");
  const [titulo, setTitulo] = useState(initialData.titulo || "Mesa de Trabajo Bilingüe B2B");
  const [idioma1, setIdioma1] = useState(initialData.idioma1 || "es");
  const [idioma2, setIdioma2] = useState(initialData.idioma2 || "pt");

  const [participantes1, setParticipantes1] = useState<string[]>(
    initialData.participantes1 && initialData.participantes1.length > 0
      ? initialData.participantes1
      : ["Mario Mojica"]
  );
  const [participantes2, setParticipantes2] = useState<string[]>(
    initialData.participantes2 && initialData.participantes2.length > 0
      ? initialData.participantes2
      : ["Interlocutor"]
  );

  const [newPart1, setNewPart1] = useState("");
  const [newPart2, setNewPart2] = useState("");

  if (!isOpen) return null;

  const handleUpdatePart1 = (index: number, val: string) => {
    const updated = [...participantes1];
    updated[index] = val;
    setParticipantes1(updated);
  };

  const handleRemovePart1 = (index: number) => {
    setParticipantes1(participantes1.filter((_, i) => i !== index));
  };

  const handleAddPart1 = () => {
    if (newPart1.trim()) {
      setParticipantes1([...participantes1, newPart1.trim()]);
      setNewPart1("");
    }
  };

  const handleUpdatePart2 = (index: number, val: string) => {
    const updated = [...participantes2];
    updated[index] = val;
    setParticipantes2(updated);
  };

  const handleRemovePart2 = (index: number) => {
    setParticipantes2(participantes2.filter((_, i) => i !== index));
  };

  const handleAddPart2 = () => {
    if (newPart2.trim()) {
      setParticipantes2([...participantes2, newPart2.trim()]);
      setNewPart2("");
    }
  };

  const getConfigPayload = (): RoomConfigData => {
    const validP1 = participantes1.map(p => p.trim()).filter(Boolean);
    const validP2 = participantes2.map(p => p.trim()).filter(Boolean);
    const finalEmpresa = empresa.trim() || "Cliente B2B";

    return {
      empresa: finalEmpresa,
      titulo: titulo.trim() || `Mesa de Trabajo Bilingüe ${finalEmpresa}`,
      idioma1,
      idioma2,
      participantes1: validP1.length > 0 ? validP1 : ["Mario Mojica"],
      participantes2: validP2.length > 0 ? validP2 : ["Interlocutor"]
    };
  };

  const handleCreateOnlySubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    const config = getConfigPayload();
    if (onCreateOnly) {
      onCreateOnly(config);
    } else {
      onSave(config);
    }
  };

  const handleEnterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(getConfigPayload());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center font-extrabold text-sm">
              MM
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base leading-tight">
                Configurar Mesa de Trabajo Bilingüe B2B
              </h2>
              <p className="text-[11px] text-slate-300">
                Define la empresa, el título y los nombres de las personas en cada lado.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleEnterSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* 1. Empresa y Título */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                <span>Empresa / Cliente B2B:</span>
              </label>
              <input
                type="text"
                value={empresa}
                onChange={e => {
                  setEmpresa(e.target.value);
                  setTitulo(`Mesa de Trabajo Bilingüe ${e.target.value}`);
                }}
                placeholder="Ej. Móveis Henn, Politorno, Kappesberg..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-600" />
                <span>Título de la Reunión:</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ej. Mesa de Trabajo Bilingüe Móveis Henn"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          {/* 2. Columnas Bilingües con Edición Libre de Nombres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* LADO 1: Tu Lado (Español) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span>Tu Lado / Anfitrión</span>
                </span>
                <select
                  value={idioma1}
                  onChange={e => setIdioma1(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-[11px] text-slate-700 outline-none"
                >
                  <option value="es">Español (ES)</option>
                  <option value="pt">Português (PT)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>

              {/* Lista de Participantes Editables Lado 1 */}
              <div className="space-y-1.5">
                <label className="font-bold text-[11px] text-slate-600">Participantes (Toca para editar):</label>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {participantes1.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        value={p}
                        onChange={e => handleUpdatePart1(idx, e.target.value)}
                        placeholder="Nombre de la persona..."
                        className="flex-1 font-semibold text-slate-800 text-xs px-1.5 py-0.5 outline-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePart1(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 transition"
                        title="Eliminar participante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Input agregar nuevo */}
                <div className="flex gap-1 pt-1">
                  <input
                    type="text"
                    value={newPart1}
                    onChange={e => setNewPart1(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddPart1(); } }}
                    placeholder="+ Agregar otro nombre..."
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPart1}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1 rounded font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* LADO 2: Lado Cliente (Portugués) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Lado Cliente ({empresa || "Cliente"})</span>
                </span>
                <select
                  value={idioma2}
                  onChange={e => setIdioma2(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-[11px] text-slate-700 outline-none"
                >
                  <option value="pt">Português (PT)</option>
                  <option value="es">Español (ES)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>

              {/* Lista de Participantes Editables Lado 2 */}
              <div className="space-y-1.5">
                <label className="font-bold text-[11px] text-slate-600">Participantes del Cliente (Toca para editar):</label>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {participantes2.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        value={p}
                        onChange={e => handleUpdatePart2(idx, e.target.value)}
                        placeholder="Ej. Juan Carlos, Everton, Alexia..."
                        className="flex-1 font-semibold text-slate-800 text-xs px-1.5 py-0.5 outline-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePart2(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 transition"
                        title="Eliminar participante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Input agregar nuevo */}
                <div className="flex gap-1 pt-1">
                  <input
                    type="text"
                    value={newPart2}
                    onChange={e => setNewPart2(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddPart2(); } }}
                    placeholder="+ Agregar interlocutor..."
                    className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPart2}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1 rounded font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2">
              {/* Botón 1: Solo Crear Ficha y Cerrar */}
              <button
                type="button"
                onClick={handleCreateOnlySubmit}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 border border-slate-300 transition"
              >
                <BookmarkPlus className="w-4 h-4 text-slate-600" />
                <span>Crear Mesa de Trabajo</span>
              </button>

              {/* Botón 2: Crear y Entrar Inmediatamente */}
              <button
                type="submit"
                className="bg-cyan-700 hover:bg-cyan-800 text-white font-extrabold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-900/10 transition"
              >
                <span>Entrar a la Mesa de Trabajo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

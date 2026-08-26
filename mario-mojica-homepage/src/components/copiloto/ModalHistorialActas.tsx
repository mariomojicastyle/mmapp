"use client";

import React, { useState, useEffect } from "react";
import { FolderOpen, Download, FileText, Calendar, Clock, Building2, X } from "lucide-react";

export function ModalHistorialActas({
  isOpen,
  sala = "henn",
  onClose
}: {
  isOpen: boolean;
  sala?: string;
  onClose: () => void;
}) {
  const [actas, setActas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/copiloto/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_saved_sessions" })
      })
        .then(res => res.json())
        .then(data => {
          setActas(data.actas || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 text-cyan-300 rounded-xl">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base">Historial de Actas y Notas Guardadas</h2>
              <p className="text-[11px] text-slate-400">
                Almacén seguro en <code className="text-cyan-300">Clientes/[Empresa]/reuniones/</code> y Supabase Cloud
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto space-y-2.5 text-xs">
          {loading && (
            <div className="py-8 text-center text-slate-400">Cargando actas guardadas...</div>
          )}

          {!loading && actas.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">No hay actas guardadas todavía.</p>
              <p className="text-[11px] mt-1">Haz clic en el botón "Guardar" o descarga las notas para archivar la sesión.</p>
            </div>
          )}

          {actas.map((item, idx) => {
            let data: any = {};
            try {
              data = JSON.parse(item.resumen_es || "{}");
            } catch (e) {}

            return (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-extrabold text-xs text-slate-900 block truncate">
                    {data.titulo || data.empresa || "Mesa de Trabajo"}
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                    <span>• {data.totalMessages || 0} frases</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono mt-1">
                    Archivo: {data.filename || "reunion.json"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Archivada
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-3 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

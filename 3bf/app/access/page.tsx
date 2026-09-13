"use client";

import React, { useState, useEffect } from "react";
import { Lock, ShieldCheck, ArrowRight, AlertCircle, Sparkles, KeyRound } from "lucide-react";

export default function AccessPage() {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Si viene redirigido con error en URL (?error=invalid_key)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "invalid_key") {
        setError("El enlace de acceso utilizado contiene una clave inválida o expirada.");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError("Por favor ingrese su clave de acceso.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("Dispositivo autorizado exitosamente. Conectando al motor 3D...");
        setTimeout(() => {
          window.location.href = "/";
        }, 700);
      } else {
        setError(data.error || "Clave no válida. Acceso restringido a 3dBimFab.");
      }
    } catch (err) {
      setError("Error de red intentando validar credenciales con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100/80 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-white">
      {/* Contenedor Principal Tech Ethos */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/60 p-8 sm:p-10 relative overflow-hidden backdrop-blur-sm">
        {/* Detalle de Acento Superior Tech Ethos */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#bb0f0f] via-cyan-600 to-indigo-600" />

        {/* Logotipo Oficial Canónico 3dBimFab */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="py-2 px-3 flex items-center justify-center">
            {/* Logotipo SVG Canónico Oficial */}
            <img
              src="/Logo_3BF.svg"
              alt="3dBimFab - Powered by MARIO MOJICA"
              className="h-16 sm:h-20 w-auto object-contain transition-transform hover:scale-[1.02] duration-300"
            />
          </div>

          {/* Badge de Seguridad en Cápsula Pura */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold tracking-wide mt-3 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span>BLINDAJE DE PROPIEDAD INTELECTUAL</span>
          </div>

          <h1 className="text-lg font-bold text-slate-800 mt-4 tracking-tight">
            Acceso Autorizado al Motor 3D
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
            Plataforma privada de manufactura paramétrica digital. Ingrese su clave para autorizar este equipo.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block px-1">
              Clave de Seguridad
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Ingrese la clave autorizada"
                autoFocus
                disabled={loading || !!success}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-300 text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-600 transition-all bg-slate-50/60 hover:bg-white"
              />
            </div>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="p-3 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 px-4 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Mensaje de Éxito */}
          {success && (
            <div className="p-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 px-4 shadow-xs">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 animate-spin" />
              <span className="font-medium">{success}</span>
            </div>
          )}

          {/* Botón de Ingreso en Cápsula Pura */}
          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full py-2.5 px-6 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-semibold tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="inline-block animate-pulse">Verificando autorización...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Autorizar Dispositivo</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

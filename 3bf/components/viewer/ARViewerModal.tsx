"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  X,
  Smartphone,
  Copy,
  ExternalLink,
  Check,
  Download,
} from "lucide-react";
import ViewInArIcon from "@/components/icons/ViewInArIcon";
import { use3BFStore } from "@/lib/store";

interface ARViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  arId: string | null;
  modelName: string;
  sizeBefore?: number;
  sizeAfter?: number;
  onDownloadCompressed?: () => void;
}

export default function ARViewerModal({
  isOpen,
  onClose,
  arId,
  modelName,
  sizeBefore,
  sizeAfter,
  onDownloadCompressed,
}: ARViewerModalProps) {
  const { tema } = use3BFStore();
  const isDark = tema === "obsidian";

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fullArUrl, setFullArUrl] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !arId) return;

    // Determinar la URL base accesible
    let baseUrl = window.location.origin;
    
    // Si estamos en localhost, usamos el túnel Cloudflare permanente para que el móvil acceda desde cualquier red
    const tunnelDomain = "https://engine.mariomojica.com";
    const targetBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
      ? tunnelDomain 
      : baseUrl;

    const url = `${targetBase}/ar?id=${arId}&name=${encodeURIComponent(modelName)}`;
    setFullArUrl(url);

    QRCode.toDataURL(url, {
      width: 260,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((data) => setQrDataUrl(data))
      .catch((err) => console.error("Error al generar QR:", err));
  }, [isOpen, arId, modelName]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (fullArUrl) {
      navigator.clipboard.writeText(fullArUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mbBefore = sizeBefore ? (sizeBefore / (1024 * 1024)).toFixed(1) : null;
  const mbAfter = sizeAfter ? (sizeAfter / (1024 * 1024)).toFixed(1) : null;
  const pct = sizeBefore && sizeAfter ? Math.round((1 - sizeAfter / sizeBefore) * 100) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md ${
          isDark
            ? "bg-[#131B2E] border-[#1E293B] text-[#F8FAFC]"
            : "bg-white border-slate-200 text-slate-900"
        } rounded-3xl shadow-2xl border overflow-hidden flex flex-col`}
      >
        {/* Cabecera */}
        <div
          className={`flex items-center justify-between px-6 pt-5 pb-3 border-b ${
            isDark ? "border-[#1E293B]" : "border-slate-100"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-full ${
                isDark ? "bg-[#1368AA] shadow-md" : "bg-[#0088AA] shadow-md shadow-[#0088AA]/20"
              } flex items-center justify-center text-white`}
            >
              <ViewInArIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDark ? "text-[#F8FAFC]" : "text-slate-800"}`}>
                Experiencia AR
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark
                ? "text-slate-400 hover:text-white hover:bg-[#1E293B]"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con Código QR */}
        <div className="p-6 flex flex-col items-center text-center">
          <div
            className={`relative p-3 ${
              isDark ? "bg-[#0B0F17] border-[#1E293B]" : "bg-slate-50 border-slate-200"
            } border-2 border-dashed rounded-2xl shadow-inner mb-4 flex items-center justify-center`}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Código QR para Realidad Aumentada"
                className="w-56 h-56 rounded-xl shadow-sm bg-white p-2"
              />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
                <div
                  className={`w-8 h-8 border-2 ${
                    isDark ? "border-[#1368AA]" : "border-[#0088AA]"
                  } border-t-transparent rounded-full animate-spin mb-2`}
                />
                Generando QR de Realidad Aumentada...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Smartphone className={`w-4 h-4 ${isDark ? "text-[#1368AA]" : "text-[#0088AA]"}`} />
            <span
              className={`text-xs font-bold uppercase tracking-wide ${
                isDark ? "text-[#F8FAFC]" : "text-slate-800"
              }`}
            >
              Escanea con tu iPhone o Android
            </span>
          </div>

          <p
            className={`text-xs ${
              isDark ? "text-[#94A3B8]" : "text-slate-600"
            } max-w-[340px] leading-relaxed mb-5`}
          >
            Apunta la cámara de tu teléfono para colocar la <b>{modelName}</b> en el suelo de tu habitación a tamaño real (escala 1:1).
          </p>

          {/* Acciones Rápidas (Estilo Cápsula rounded-full) */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopy}
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border ${
                isDark
                  ? "border-[#1E293B] text-[#F8FAFC] hover:bg-[#1E293B]"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50"
              } text-xs font-semibold transition-colors`}
            >
              {copied ? (
                <>
                  <Check className={`w-3.5 h-3.5 ${isDark ? "text-[#1368AA]" : "text-[#0088AA]"}`} /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar Enlace
                </>
              )}
            </button>

            <a
              href={fullArUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full ${
                isDark
                  ? "bg-[#1368AA] hover:bg-[#10568c] shadow-md text-white"
                  : "bg-[#0088AA] hover:bg-[#007492] text-white shadow-md shadow-[#0088AA]/20"
              } text-xs font-bold transition-all`}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Abrir en Web
            </a>
          </div>

          {onDownloadCompressed && (
            <button
              onClick={onDownloadCompressed}
              className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full ${
                isDark
                  ? "text-[#1368AA] hover:bg-[#1368AA]/10 border border-[#1368AA]/40"
                  : "text-[#0088AA] hover:bg-[#0088AA]/10 border border-[#0088AA]/40"
              } text-xs font-bold transition-colors`}
            >
              <Download className={`w-3.5 h-3.5 ${isDark ? "text-[#1368AA]" : "text-[#0088AA]"}`} /> Descargar GLB Comprimido ({mbAfter || "2.1"} MB)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

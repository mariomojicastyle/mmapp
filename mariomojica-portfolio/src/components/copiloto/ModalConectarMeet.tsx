"use client";

import React, { useState } from "react";
import { Copy, Check, Link2, X, Sparkles, Video } from "lucide-react";

export function ModalConectarMeet({
  isOpen,
  sala = "henn",
  onClose
}: {
  isOpen: boolean;
  sala?: string;
  onClose: () => void;
}) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  if (!isOpen) return null;

  const rawScript = `(function(){
  console.log("%c[Meet Bridge Activo]%c Sincronizando subtítulos con https://mariomojica.com/traductor-vivo/` + sala + `", "color:#06b6d4;font-weight:bold;font-size:14px;", "color:#333;font-size:13px;");
  
  let lastCapturedText = "";
  let debounceTimer = null;

  function captureAndSend(text, speakerName) {
    const cleanText = text.trim();
    if (!cleanText || cleanText.length < 2 || cleanText === lastCapturedText) return;
    lastCapturedText = cleanText;

    console.log("%c[Meet Bridge Capturado] %c" + (speakerName || "Participante") + ": " + cleanText, "color:#10b981;font-weight:bold;", "color:#000;");

    fetch("https://mariomojica.com/api/copiloto/traducir", {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, fromLang: "auto", toLang: "es" })
    })
    .then(function(r) { return r.json(); })
    .then(function(transData) {
      const translated = transData.translation || cleanText;
      const fromLang = transData.fromLang || "pt";
      const isClient = fromLang === "pt" || !(speakerName || "").toLowerCase().includes("mario");

      return fetch("https://mariomojica.com/api/copiloto/sesion", {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_message",
          sala: "` + sala + `",
          message: {
            id: "msg_meet_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
            speaker: isClient ? "cliente" : "mario",
            speakerName: speakerName || (isClient ? "Marcos Unnass" : "Mario Mojica"),
            originalText: cleanText,
            translatedText: translated,
            fromLang: fromLang,
            toLang: fromLang === "pt" ? "es" : "pt",
            timestamp: Date.now()
          }
        })
      });
    })
    .catch(function(err) { console.error("[Meet Bridge Error]", err); });
  }

  // Observador continuo de subtítulos de Google Meet
  const observer = new MutationObserver(function() {
    const captionContainers = document.querySelectorAll('div[jsname="YSxPdn"], div.iTTPOb, span.yg15Mc, span.CNusmb, div.bh44bd, div[aria-live="polite"]');
    
    if (captionContainers && captionContainers.length > 0) {
      const lastContainer = captionContainers[captionContainers.length - 1];
      const text = (lastContainer.innerText || lastContainer.textContent || "").trim();
      
      const parent = lastContainer.closest('div[class*="T4LgNb"], div[class*="nMx0wf"]') || lastContainer.parentElement;
      const speakerEl = parent ? parent.querySelector('.zs75Ib, .FwR7Pc, div[class*="speaker"], span[class*="speaker"]') : null;
      const speaker = speakerEl ? speakerEl.textContent.trim() : "";

      if (text && text !== lastCapturedText) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          captureAndSend(text, speaker);
        }, 600);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  alert("✅ ¡Google Meet Conectado con Éxito! Los subtítulos aparecerán en tiempo real traducidos en tu sala.");
})();`;

  const bookmarkletCode = `javascript:${encodeURIComponent(rawScript)}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(rawScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200 select-none">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-cyan-700 to-cyan-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-300" />
            <div>
              <h2 className="font-extrabold text-sm leading-tight">
                Conectar Subtítulos de Google Meet
              </h2>
              <p className="text-[11px] text-cyan-100">
                Sincronización 100% precisa directo desde los servidores de Google
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-3.5 text-xs text-slate-700">
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-[11.5px] text-cyan-950 leading-relaxed">
            <p className="font-bold mb-1 flex items-center gap-1.5 text-cyan-900">
              <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
              ¿Cómo funciona?
            </p>
            Al activar los subtítulos (<strong>CC</strong>) en tu llamada de Google Meet, este puente lee el texto directamente y lo proyecta traducido en tu pantalla en tiempo real, sin depender del micrófono ni del ruido de la sala.
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-xs">
              Opción 1 (Más rápida - 1 Clic): Pegar en la Consola de Meet
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
              <li>En la pestaña de <strong>Google Meet</strong>, activa los subtítulos (botón <strong>CC</strong> en portugués o español).</li>
              <li>Presiona la tecla <strong>F12</strong> (o Clic derecho ➔ Inspeccionar) y ve a la pestaña <strong>Consola</strong> (Console).</li>
              <li>Pega el siguiente código y presiona <strong>Enter</strong>:</li>
            </ol>

            <button
              onClick={handleCopyScript}
              className="w-full bg-slate-900 hover:bg-black text-white font-extrabold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
            >
              {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copiedScript ? "¡Código Copiado al Portapapeles!" : "Copiar Código del Puente"}</span>
            </button>
          </div>

          <div className="border-t border-slate-200 pt-2.5">
            <h3 className="font-bold text-slate-900 text-xs mb-1">
              Opción 2: Marcador Permanente de 1 Clic
            </h3>
            <p className="text-[11px] text-slate-500 mb-2">
              Copia este enlace y guárdalo como un favorito en tu barra de Chrome. Cuando estés en cualquier reunión de Google Meet, solo le haces 1 clic a tu favorito y listo.
            </p>
            <button
              onClick={handleCopyBookmarklet}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold py-1.5 px-3 rounded-xl flex items-center justify-center gap-2 transition text-[11px]"
            >
              {copiedBookmarklet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Link2 className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copiedBookmarklet ? "¡Marcador Copiado!" : "Copiar Marcador (Bookmarklet)"}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex justify-end">
          <button
            onClick={onClose}
            className="bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

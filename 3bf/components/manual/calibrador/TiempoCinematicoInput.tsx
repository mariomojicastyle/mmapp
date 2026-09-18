"use client";

import React, { useState, useEffect } from "react";

/**
 * Input para definir el segundo exacto de aparición o fin de herrajes (de herrajes o capas/piezas).
 * - Al tocarlo o recibir foco, selecciona automáticamente todo el texto.
 * - Permite digitar inmediatamente el nuevo número.
 * - Al presionar Enter o salir del campo (blur), asigna y guarda el nuevo número.
 */
export function TiempoCinematicoInput({
  valorInicial,
  onGuardar,
  className = "w-6 text-[8px]",
}: {
  valorInicial: number;
  onGuardar: (val: number) => void;
  className?: string;
}) {
  const [texto, setTexto] = useState(String(valorInicial));

  useEffect(() => {
    setTexto(String(valorInicial));
  }, [valorInicial]);

  const confirmar = () => {
    const num = parseFloat(texto);
    const finalVal = isNaN(num) || num < 0 ? 0 : num;
    setTexto(String(finalVal));
    if (finalVal !== valorInicial) {
      onGuardar(finalVal);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={texto}
      onClick={(e) => {
        e.stopPropagation();
        e.currentTarget.select();
      }}
      onFocus={(e) => {
        e.currentTarget.select();
      }}
      onChange={(e) => {
        setTexto(e.target.value);
      }}
      onBlur={confirmar}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          confirmar();
          e.currentTarget.blur();
        }
      }}
      className={`${className} font-mono font-bold text-center bg-transparent text-slate-700 dark:text-slate-200 outline-none p-0 cursor-text select-all`}
    />
  );
}

export const TiempoHerrajeInput = TiempoCinematicoInput;

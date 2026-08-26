"use client";

import React, { useState, useEffect } from "react";
import { Calculator, TrendingDown, Layers, Laptop, DollarSign, ShieldCheck, Plus, Trash2, RotateCcw, Wrench } from "lucide-react";

export function HennOperationCostEngine({
  uiLang = "es",
  onSummaryChange
}: {
  uiLang?: "es" | "pt";
  onSummaryChange?: (data: any) => void;
}) {
  const isPt = uiLang === "pt";

  // 1. MACRO OPERACIÓN ANUAL DE HENN (100% EDITABLE)
  const [manualesAno, setManualesAno] = useState(200); // Volumen anual total de manuales
  const [personasPed, setPersonasPed] = useState(2.0); // Personas en P&D dedicadas a manuales
  const [salarioCltMes, setSalarioCltMes] = useState(6000); // Salario CLT + Cargas Sociales

  // Licencias Separadas al Año por Estación de Trabajo
  const [licenciaSketchUpAno, setLicenciaSketchUpAno] = useState(2400); // SketchUp Studio/Pro
  const [licenciaAdobeAno, setLicenciaAdobeAno] = useState(3600); // Adobe Creative Cloud (InDesign + Illustrator)
  const [licenciaOtrosAno, setLicenciaOtrosAno] = useState(0); // Otros software CAD/Render

  // Porcentaje de Ahorro Garantizado de Mario
  const [ahorroPct, setAhorroPct] = useState(30);

  // Desglose por Complejidad de Muebles (Pesos Relativos / Horas)
  const [horasPequeno, setHorasPequeno] = useState(8);   // < 10 piezas (1 día)
  const [horasMediano, setHorasMediano] = useState(12);  // 11 a 25 piezas (1.5 días)
  const [horasGrande, setHorasGrande] = useState(16);    // 26 a 40 piezas (2 días)

  // Costo de Asistencia Técnica y Garantías (Horas dedicadas a soporte por fallas de ensamble)
  const [horasSacMes, setHorasSacMes] = useState(20);

  // --- CÁLCULOS MATEMÁTICOS DE LA OPERACIÓN ANUAL ---
  const totalSalariosAno = personasPed * salarioCltMes * 12;
  const totalLicenciasPorPersonaAno = licenciaSketchUpAno + licenciaAdobeAno + licenciaOtrosAno;
  const totalLicenciasAno = Math.ceil(personasPed) * totalLicenciasPorPersonaAno;

  // Costo por hora base
  const costoHoraClt = salarioCltMes / 176;
  const costoSacAno = horasSacMes * costoHoraClt * 12;

  // Costo Operativo Total Anual de Henn
  const costoTotalOperacionHennAno = totalSalariosAno + totalLicenciasAno + costoSacAno;
  const costoTotalOperacionHennMes = costoTotalOperacionHennAno / 12;

  // COSTO ESTÁNDAR PROMEDIO POR MANUAL (HENN)
  const costoEstandarManualHenn = manualesAno > 0 ? costoTotalOperacionHennAno / manualesAno : 0;

  // DESGLOSE UNITARIO POR TAMAÑO DE MUEBLE (Horas ponderadas sobre promedio 12h)
  const ratioPequeno = horasPequeno / 12;
  const ratioMediano = horasMediano / 12;
  const ratioGrande = horasGrande / 12;

  const costoManualPequenoHenn = costoEstandarManualHenn * ratioPequeno;
  const costoManualMedianoHenn = costoEstandarManualHenn * ratioMediano;
  const costoManualGrandeHenn = costoEstandarManualHenn * ratioGrande;

  // PROPUESTA MARIO MOJICA (-30% AHORRO)
  const costoEstandarManualMario = costoEstandarManualHenn * ((100 - ahorroPct) / 100);
  const costoManualPequenoMario = costoManualPequenoHenn * ((100 - ahorroPct) / 100);
  const costoManualMedianoMario = costoManualMedianoHenn * ((100 - ahorroPct) / 100);
  const costoManualGrandeMario = costoManualGrandeHenn * ((100 - ahorroPct) / 100);

  const propuestaMarioTotalAno = costoTotalOperacionHennAno * ((100 - ahorroPct) / 100);
  const propuestaMarioTotalMes = propuestaMarioTotalAno / 12;

  // Ahorros Consolidados
  const ahorroNetoTotalAno = costoTotalOperacionHennAno - propuestaMarioTotalAno;
  const ahorroNetoTotalMes = ahorroNetoTotalAno / 12;

  useEffect(() => {
    if (onSummaryChange) {
      onSummaryChange({
        manualesAno,
        personasPed,
        salarioCltMes,
        costoTotalOperacionHennAno,
        costoTotalOperacionHennMes,
        costoEstandarManualHenn,
        propuestaMarioTotalAno,
        propuestaMarioTotalMes,
        costoEstandarManualMario,
        ahorroNetoTotalAno,
        ahorroNetoTotalMes,
        ahorroPct
      });
    }
  }, [
    manualesAno,
    personasPed,
    salarioCltMes,
    costoTotalOperacionHennAno,
    costoTotalOperacionHennMes,
    costoEstandarManualHenn,
    propuestaMarioTotalAno,
    propuestaMarioTotalMes,
    costoEstandarManualMario,
    ahorroNetoTotalAno,
    ahorroNetoTotalMes,
    ahorroPct,
    onSummaryChange
  ]);

  const resetDefault = () => {
    setManualesAno(200);
    setPersonasPed(2.0);
    setSalarioCltMes(6000);
    setLicenciaSketchUpAno(2400);
    setLicenciaAdobeAno(3600);
    setLicenciaOtrosAno(0);
    setAhorroPct(30);
    setHorasPequeno(8);
    setHorasMediano(12);
    setHorasGrande(16);
    setHorasSacMes(20);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3.5 text-slate-800 text-xs h-full overflow-y-auto">
      {/* Header del Cotizador */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-100 text-cyan-800 rounded-lg font-bold">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-900 leading-tight">
              {isPt
                ? "Cotizador da Operação Anual de P&D | Móveis Henn"
                : "Cotizador de la Operación Anual de P&D | Móveis Henn"}
            </h2>
            <p className="text-[11px] text-slate-500">
              {isPt
                ? "Validação técnica com Marcos Unnass para determinar o custo padrão por manual e calibrar o 30% de economia."
                : "Validación técnica con Marcos Unnass para determinar el costo estándar por manual y calibrar el 30% de ahorro."}
            </p>
          </div>
        </div>

        <button
          onClick={resetDefault}
          className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition"
          title={isPt ? "Restaurar valores de referência" : "Restablecer valores de referencia"}
        >
          <RotateCcw className="w-3 h-3" />
          <span>{isPt ? "Restaurar" : "Restablecer"}</span>
        </button>
      </div>

      {/* KPI CARDS: Cifras Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-500">
            {isPt ? "Custo Operação Henn:" : "Costo Operación Henn:"}
          </span>
          <div>
            <span className="text-base font-extrabold text-slate-900 block">
              R$ {costoTotalOperacionHennAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              <span className="text-[9px] font-normal text-slate-500"> {isPt ? "/ano" : "/año"}</span>
            </span>
            <span className="text-[10px] font-bold text-slate-700">
              R$ {costoEstandarManualHenn.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="font-normal text-slate-400">{isPt ? "/ manual méd." : "/ manual prom."}</span>
            </span>
          </div>
        </div>

        <div className="bg-cyan-50/70 p-2.5 rounded-lg border border-cyan-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-900">
              {isPt ? "Proposta Mario:" : "Propuesta Mario:"}
            </span>
            <span className="bg-cyan-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
              -{ahorroPct}%
            </span>
          </div>
          <div>
            <span className="text-base font-extrabold text-cyan-700 block">
              R$ {propuestaMarioTotalAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              <span className="text-[9px] font-normal text-cyan-800"> {isPt ? "/ano" : "/año"}</span>
            </span>
            <span className="text-[10px] font-bold text-cyan-800">
              R$ {costoEstandarManualMario.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="font-normal text-cyan-600">{isPt ? "/ manual méd." : "/ manual prom."}</span>
            </span>
          </div>
        </div>

        <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-800">
            {isPt ? "Economia Líquida Anual:" : "Ahorro Neto Anual:"}
          </span>
          <div>
            <span className="text-base font-extrabold text-emerald-600 block">
              +R$ {ahorroNetoTotalAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">
              +R$ {(costoEstandarManualHenn - costoEstandarManualMario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} <span className="font-normal text-emerald-600">{isPt ? "economia/manual" : "ahorro/manual"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: MACRO OPERACIÓN ANUAL DE HENN */}
      <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5">
        <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-600" />
          {isPt
            ? "1. Parâmetros da Operação Anual da Henn (Valores a Validar com Marcos)"
            : "1. Parámetros de la Operación Anual de Henn (Valores a Validar con Marcos)"}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Volumen Anual */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-700">{isPt ? "📦 Total Manuais / Lançamentos ao Ano:" : "📦 Total Manuales / Lanzamientos al Año:"}</span>
              <span className="text-[10px] text-slate-500 font-normal">(~{(manualesAno/12).toFixed(1)}{isPt ? "/mês" : "/mes"})</span>
            </div>
            <input
              type="number"
              value={manualesAno}
              onChange={e => setManualesAno(Math.max(1, Number(e.target.value)))}
              className="w-full font-extrabold text-base text-slate-900 bg-white border border-slate-300 rounded px-2 py-0.5 outline-none focus:border-cyan-500 text-center"
            />
          </div>

          {/* Personas en P&D */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-700">{isPt ? "👥 Pessoas em P&D dedicadas a manuais:" : "👥 Personas en P&D dedicadas a manuales:"}</span>
              <span className="text-[10px] text-slate-500 font-normal">{isPt ? "designers" : "diseñadores"}</span>
            </div>
            <input
              type="number"
              step="0.5"
              value={personasPed}
              onChange={e => setPersonasPed(Math.max(0.5, Number(e.target.value)))}
              className="w-full font-extrabold text-base text-slate-900 bg-white border border-slate-300 rounded px-2 py-0.5 outline-none focus:border-cyan-500 text-center"
            />
          </div>

          {/* Salario CLT */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-700">{isPt ? "💵 Salário Médio CLT + Encargos Sociais:" : "💵 Salario Promedio CLT + Cargas Sociales:"}</span>
              <span className="text-[10px] text-slate-500 font-normal">R$/mês/pessoa</span>
            </div>
            <input
              type="number"
              step="500"
              value={salarioCltMes}
              onChange={e => setSalarioCltMes(Number(e.target.value))}
              className="w-full font-extrabold text-base text-slate-900 bg-white border border-slate-300 rounded px-2 py-0.5 outline-none focus:border-cyan-500 text-center"
            />
          </div>

          {/* Total Salarios Año */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col justify-between">
            <span className="font-bold text-slate-700 text-[11px]">{isPt ? "💰 Folha Salarial P&D ao Ano:" : "💰 Masa Salarial P&D al Año:"}</span>
            <span className="font-extrabold text-base text-slate-900 text-center py-0.5">
              R$ {totalSalariosAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} {isPt ? "/ ano" : "/ año"}
            </span>
          </div>
        </div>

        {/* Licencias de Software Separadas */}
        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-800">
            <span className="flex items-center gap-1">
              <Laptop className="w-3.5 h-3.5 text-cyan-600" />
              {isPt ? "Custo de Licenças de Software por Designer (R$ / Ano):" : "Costo de Licencias de Software por Diseñador (R$ / Año):"}
            </span>
            <span className="text-cyan-700 font-extrabold">
              Total: R$ {totalLicenciasAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} {isPt ? "/ ano" : "/ año"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-medium block">SketchUp Pro / Studio:</label>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                <span className="text-[10px] text-slate-400">R$</span>
                <input
                  type="number"
                  value={licenciaSketchUpAno}
                  onChange={e => setLicenciaSketchUpAno(Number(e.target.value))}
                  className="w-full text-xs font-bold text-slate-800 outline-none"
                />
                <span className="text-[9px] text-slate-400">{isPt ? "/ano" : "/año"}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-medium block">Adobe CC (InDesign/Illustrator):</label>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                <span className="text-[10px] text-slate-400">R$</span>
                <input
                  type="number"
                  value={licenciaAdobeAno}
                  onChange={e => setLicenciaAdobeAno(Number(e.target.value))}
                  className="w-full text-xs font-bold text-slate-800 outline-none"
                />
                <span className="text-[9px] text-slate-400">{isPt ? "/ano" : "/año"}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-medium block">{isPt ? "Outros Softwares (CAD/Render):" : "Otros Software (CAD/Render):"}</label>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                <span className="text-[10px] text-slate-400">R$</span>
                <input
                  type="number"
                  value={licenciaOtrosAno}
                  onChange={e => setLicenciaOtrosAno(Number(e.target.value))}
                  className="w-full text-xs font-bold text-slate-800 outline-none"
                />
                <span className="text-[9px] text-slate-400">{isPt ? "/ano" : "/año"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: COSTO ESTÁNDAR Y DESGLOSE POR COMPLEJIDAD */}
      <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2.5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
          <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            {isPt ? "2. Custo Padrão e Desdobramento por Tamanho do Móvel" : "2. Costo Estándar y Desglose por Tamaño de Mueble"}
          </h3>
          <span className="bg-emerald-100 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded">
            {isPt
              ? `Méd. Henn: R$ ${costoEstandarManualHenn.toFixed(2)} ➔ Mario: R$ ${costoEstandarManualMario.toFixed(2)}`
              : `Prom. Henn: R$ ${costoEstandarManualHenn.toFixed(2)} ➔ Mario: R$ ${costoEstandarManualMario.toFixed(2)}`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Mueble Pequeño */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                <span>{isPt ? "Manual Pequeno (< 10 peças)" : "Manual Pequeño (< 10 piezas)"}</span>
                <span className="text-slate-400">~{horasPequeno}h</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">{isPt ? "Mesas de cabeceira, nichos, gaveteiros." : "Mesas de noche, repisas, cajoneras."}</p>
            </div>
            <div className="mt-2 pt-1 border-t border-slate-200">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">{isPt ? "Custo Henn:" : "Costo Henn:"}</span>
                <span className="font-bold text-slate-900">R$ {costoManualPequenoHenn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-cyan-700">
                <span>Mario (-30%):</span>
                <span>R$ {costoManualPequenoMario.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Mueble Mediano */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                <span>{isPt ? "Manual Médio (11 a 25 peças)" : "Manual Mediano (11 a 25 piezas)"}</span>
                <span className="text-slate-400">~{horasMediano}h</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">{isPt ? "Cômodas, racks de TV, escrivaninhas." : "Cómodas, racks de TV, escritorios."}</p>
            </div>
            <div className="mt-2 pt-1 border-t border-slate-200">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">{isPt ? "Custo Henn:" : "Costo Henn:"}</span>
                <span className="font-bold text-slate-900">R$ {costoManualMedianoHenn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-cyan-700">
                <span>Mario (-30%):</span>
                <span>R$ {costoManualMedianoMario.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Mueble Grande */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                <span>{isPt ? "Manual Grande (26 a 40+ peças)" : "Manual Grande (26 a 40+ piezas)"}</span>
                <span className="text-slate-400">~{horasGrande}h</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">{isPt ? "Roupeiros, cozinhas moduladas, closets." : "Roperos, cocinas moduladas, clósets."}</p>
            </div>
            <div className="mt-2 pt-1 border-t border-slate-200">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">{isPt ? "Custo Henn:" : "Costo Henn:"}</span>
                <span className="font-bold text-slate-900">R$ {costoManualGrandeHenn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-cyan-700">
                <span>Mario (-30%):</span>
                <span>R$ {costoManualGrandeMario.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: CONTROL DE AHORRO Y ARGUMENTO COMERCIAL */}
      <div className="bg-cyan-50/60 border border-cyan-200 rounded-xl p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-cyan-950 text-xs">
            {isPt ? "Percentual de Economia Garantida:" : "Porcentaje de Ahorro Garantizado:"}
          </span>
          <div className="flex items-center gap-1">
            {[20, 25, 30, 35, 40].map(pct => (
              <button
                key={pct}
                onClick={() => setAhorroPct(pct)}
                className={`px-2 py-0.5 rounded font-bold text-xs transition ${
                  ahorroPct === pct
                    ? "bg-cyan-700 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-cyan-200 hover:bg-cyan-100"
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-700 flex items-center gap-1.5 pt-1 border-t border-cyan-200">
          <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0" />
          <span>
            {isPt ? (
              <>
                <strong>Argumento para a Diretoria da Henn:</strong> Cotamos a operação anual de P&D em <strong>R$ {costoTotalOperacionHennAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}/ano</strong> e garantimos uma economia direta de <strong>+R$ {ahorroNetoTotalAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}/ano</strong> com os manuais interativos 3D.
              </>
            ) : (
              <>
                <strong>Argumento para Marcos:</strong> Cotizamos la operación anual de Henn en <strong>R$ {costoTotalOperacionHennAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}/año</strong> y garantizamos un ahorro directo de <strong>+R$ {ahorroNetoTotalAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}/año</strong> para presentar a la Junta Directiva.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

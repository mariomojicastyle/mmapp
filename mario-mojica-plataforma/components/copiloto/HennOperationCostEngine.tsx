"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calculator,
  Layers,
  Laptop,
  RotateCcw,
  Users,
  Package,
  CircleDollarSign,
  TrendingDown
} from "lucide-react";

export interface CostParameters {
  manualesAno: number;
  personasPed: number;
  salarioCltMes: number;
  licenciaSketchUpAno: number;
  licenciaAdobeAno: number;
  licenciaOtrosAno: number;
  ahorroPct: number;
  horasPequeno: number;
  horasMediano: number;
  horasGrande: number;
  horasSacMes: number;
}

export function HennOperationCostEngine({
  uiLang = "es",
  initialParams,
  onParamChange,
  onSummaryChange
}: {
  uiLang?: "es" | "pt";
  initialParams?: Partial<CostParameters>;
  onParamChange?: (newParams: CostParameters) => void;
  onSummaryChange?: (data: any) => void;
}) {
  const isPt = uiLang === "pt";

  // 1. Parámetros Editables Colaborativos
  const [manualesAno, setManualesAno] = useState(initialParams?.manualesAno ?? 200);
  const [personasPed, setPersonasPed] = useState(initialParams?.personasPed ?? 2.0);
  const [salarioCltMes, setSalarioCltMes] = useState(initialParams?.salarioCltMes ?? 6000);

  const [licenciaSketchUpAno, setLicenciaSketchUpAno] = useState(initialParams?.licenciaSketchUpAno ?? 2400);
  const [licenciaAdobeAno, setLicenciaAdobeAno] = useState(initialParams?.licenciaAdobeAno ?? 3600);
  const [licenciaOtrosAno, setLicenciaOtrosAno] = useState(initialParams?.licenciaOtrosAno ?? 0);

  const [ahorroPct, setAhorroPct] = useState(initialParams?.ahorroPct ?? 30);
  const [horasPequeno, setHorasPequeno] = useState(initialParams?.horasPequeno ?? 8);
  const [horasMediano, setHorasMediano] = useState(initialParams?.horasMediano ?? 12);
  const [horasGrande, setHorasGrande] = useState(initialParams?.horasGrande ?? 16);
  const [horasSacMes, setHorasSacMes] = useState(initialParams?.horasSacMes ?? 20);

  // Sincronizar cuando lleguen cambios remotos desde otro usuario
  useEffect(() => {
    if (initialParams) {
      if (initialParams.manualesAno !== undefined && initialParams.manualesAno !== manualesAno) setManualesAno(initialParams.manualesAno);
      if (initialParams.personasPed !== undefined && initialParams.personasPed !== personasPed) setPersonasPed(initialParams.personasPed);
      if (initialParams.salarioCltMes !== undefined && initialParams.salarioCltMes !== salarioCltMes) setSalarioCltMes(initialParams.salarioCltMes);
      if (initialParams.licenciaSketchUpAno !== undefined && initialParams.licenciaSketchUpAno !== licenciaSketchUpAno) setLicenciaSketchUpAno(initialParams.licenciaSketchUpAno);
      if (initialParams.licenciaAdobeAno !== undefined && initialParams.licenciaAdobeAno !== licenciaAdobeAno) setLicenciaAdobeAno(initialParams.licenciaAdobeAno);
      if (initialParams.licenciaOtrosAno !== undefined && initialParams.licenciaOtrosAno !== licenciaOtrosAno) setLicenciaOtrosAno(initialParams.licenciaOtrosAno);
      if (initialParams.ahorroPct !== undefined && initialParams.ahorroPct !== ahorroPct) setAhorroPct(initialParams.ahorroPct);
    }
  }, [initialParams]);

  // Notificar al padre para broadcast en tiempo real
  const notifyChange = (updated: Partial<CostParameters>) => {
    const current: CostParameters = {
      manualesAno: updated.manualesAno ?? manualesAno,
      personasPed: updated.personasPed ?? personasPed,
      salarioCltMes: updated.salarioCltMes ?? salarioCltMes,
      licenciaSketchUpAno: updated.licenciaSketchUpAno ?? licenciaSketchUpAno,
      licenciaAdobeAno: updated.licenciaAdobeAno ?? licenciaAdobeAno,
      licenciaOtrosAno: updated.licenciaOtrosAno ?? licenciaOtrosAno,
      ahorroPct: updated.ahorroPct ?? ahorroPct,
      horasPequeno: updated.horasPequeno ?? horasPequeno,
      horasMediano: updated.horasMediano ?? horasMediano,
      horasGrande: updated.horasGrande ?? horasGrande,
      horasSacMes: updated.horasSacMes ?? horasSacMes
    };
    onParamChange?.(current);
  };

  // --- CÁLCULOS MATEMÁTICOS DE LA OPERACIÓN ANUAL ---
  const totalSalariosAno = personasPed * salarioCltMes * 12;
  const totalLicenciasPorPersonaAno = licenciaSketchUpAno + licenciaAdobeAno + licenciaOtrosAno;
  const totalLicenciasAno = Math.ceil(personasPed) * totalLicenciasPorPersonaAno;

  const costoHoraClt = salarioCltMes / 176;
  const costoSacAno = horasSacMes * costoHoraClt * 12;

  const costoTotalOperacionHennAno = totalSalariosAno + totalLicenciasAno + costoSacAno;
  const costoTotalOperacionHennMes = costoTotalOperacionHennAno / 12;

  const costoEstandarManualHenn = manualesAno > 0 ? costoTotalOperacionHennAno / manualesAno : 0;

  const factorMario = (100 - ahorroPct) / 100;
  const propuestaMarioTotalAno = costoTotalOperacionHennAno * factorMario;
  const propuestaMarioTotalMes = propuestaMarioTotalAno / 12;

  const costoEstandarManualMario = costoEstandarManualHenn * factorMario;
  const ahorroNetoTotalAno = costoTotalOperacionHennAno - propuestaMarioTotalAno;
  const ahorroNetoTotalMes = costoTotalOperacionHennMes - propuestaMarioTotalMes;

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
    const def = {
      manualesAno: 200,
      personasPed: 2.0,
      salarioCltMes: 6000,
      licenciaSketchUpAno: 2400,
      licenciaAdobeAno: 3600,
      licenciaOtrosAno: 0,
      ahorroPct: 30,
      horasPequeno: 8,
      horasMediano: 12,
      horasGrande: 16,
      horasSacMes: 20
    };
    setManualesAno(def.manualesAno);
    setPersonasPed(def.personasPed);
    setSalarioCltMes(def.salarioCltMes);
    setLicenciaSketchUpAno(def.licenciaSketchUpAno);
    setLicenciaAdobeAno(def.licenciaAdobeAno);
    setLicenciaOtrosAno(def.licenciaOtrosAno);
    setAhorroPct(def.ahorroPct);
    notifyChange(def);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col gap-3 text-slate-800 text-xs h-full overflow-y-auto pb-24">
      {/* Header del Cotizador con Indicador de Sincronización */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-100 text-cyan-800 rounded-lg font-bold shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
              {isPt
                ? "Cotizador da Operação Anual de P&D | Móveis Henn"
                : "Cotizador de la Operación Anual de P&D | Móveis Henn"}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500">
              {isPt
                ? "Edição colaborativa em tempo real com Marcos Unnass."
                : "Edición colaborativa en tiempo real con Marcos Unnass."}
            </p>
          </div>
        </div>

        <button
          onClick={resetDefault}
          className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition shrink-0"
          title={isPt ? "Restaurar valores de referência" : "Restablecer valores de referencia"}
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden xs:inline">{isPt ? "Restaurar" : "Restablecer"}</span>
        </button>
      </div>

      {/* KPI CARDS: Cifras Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200 shrink-0">
        <div className="bg-white p-2 sm:p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-500">
            {isPt ? "Custo Operação Henn:" : "Costo Operación Henn:"}
          </span>
          <div>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 block">
              R$ {costoTotalOperacionHennAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              <span className="text-[9px] font-normal text-slate-500"> {isPt ? "/ano" : "/año"}</span>
            </span>
            <span className="text-[10px] font-bold text-slate-700">
              R$ {costoEstandarManualHenn.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="font-normal text-slate-400">{isPt ? "/ manual méd." : "/ manual prom."}</span>
            </span>
          </div>
        </div>

        <div className="bg-cyan-50/70 p-2 sm:p-2.5 rounded-lg border border-cyan-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-900">
              {isPt ? "Proposta Mario:" : "Propuesta Mario:"}
            </span>
            <span className="bg-cyan-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
              -{ahorroPct}%
            </span>
          </div>
          <div>
            <span className="text-sm sm:text-base font-extrabold text-cyan-700 block">
              R$ {propuestaMarioTotalAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              <span className="text-[9px] font-normal text-cyan-800"> {isPt ? "/ano" : "/año"}</span>
            </span>
            <span className="text-[10px] font-bold text-cyan-800">
              R$ {costoEstandarManualMario.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="font-normal text-cyan-600">{isPt ? "/ manual méd." : "/ manual prom."}</span>
            </span>
          </div>
        </div>

        <div className="bg-emerald-50 p-2 sm:p-2.5 rounded-lg border border-emerald-200 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-800">
            {isPt ? "Economia Líquida Anual:" : "Ahorro Neto Anual:"}
          </span>
          <div>
            <span className="text-sm sm:text-base font-extrabold text-emerald-600 block">
              +R$ {ahorroNetoTotalAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">
              +R$ {(costoEstandarManualHenn - costoEstandarManualMario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} <span className="font-normal text-emerald-600">{isPt ? "economia/manual" : "ahorro/manual"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: MACRO OPERACIÓN ANUAL DE HENN */}
      <div className="border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-white space-y-2.5">
        <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-600" />
          {isPt
            ? "1. Parâmetros da Operação Anual da Henn (Sincronizado ao Vivo)"
            : "1. Parámetros de la Operación Anual de Henn (Sincronizado en Vivo)"}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Volumen Anual */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Package className="w-3 h-3 text-slate-500" />
                {isPt ? "Total Manuais / Lançamentos ao Ano:" : "Total Manuales / Lanzamientos al Año:"}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">(~{(manualesAno/12).toFixed(1)}{isPt ? "/mês" : "/mes"})</span>
            </div>
            <input
              type="number"
              inputMode="numeric"
              value={manualesAno}
              onFocus={handleInputFocus}
              onChange={e => {
                const val = Math.max(1, Number(e.target.value));
                setManualesAno(val);
                notifyChange({ manualesAno: val });
              }}
              className="w-full font-extrabold text-sm sm:text-base text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-cyan-500 text-center"
            />
          </div>

          {/* Personas en P&D */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-500" />
                {isPt ? "Pessoas em P&D dedicadas a manuais:" : "Personas en P&D dedicadas a manuales:"}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">{isPt ? "designers" : "diseñadores"}</span>
            </div>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={personasPed}
              onFocus={handleInputFocus}
              onChange={e => {
                const val = Math.max(0.5, Number(e.target.value));
                setPersonasPed(val);
                notifyChange({ personasPed: val });
              }}
              className="w-full font-extrabold text-sm sm:text-base text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-cyan-500 text-center"
            />
          </div>

          {/* Salario CLT */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col gap-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <CircleDollarSign className="w-3 h-3 text-slate-500" />
                {isPt ? "Salário Médio CLT + Encargos Sociais:" : "Salario Promedio CLT + Cargas Sociales:"}
              </span>
              <span className="text-[10px] text-slate-500 font-normal">R$/mês/pessoa</span>
            </div>
            <input
              type="number"
              inputMode="numeric"
              step="500"
              value={salarioCltMes}
              onFocus={handleInputFocus}
              onChange={e => {
                const val = Number(e.target.value);
                setSalarioCltMes(val);
                notifyChange({ salarioCltMes: val });
              }}
              className="w-full font-extrabold text-sm sm:text-base text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-cyan-500 text-center"
            />
          </div>

          {/* Total Salarios Año */}
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col justify-between">
            <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-slate-500" />
              {isPt ? "Folha Salarial P&D ao Ano:" : "Masa Salarial P&D al Año:"}
            </span>
            <span className="font-extrabold text-sm sm:text-base text-slate-900 text-center py-1">
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
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-1">
                <span className="text-[10px] text-slate-400">R$</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={licenciaSketchUpAno}
                  onFocus={handleInputFocus}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setLicenciaSketchUpAno(val);
                    notifyChange({ licenciaSketchUpAno: val });
                  }}
                  className="w-full text-xs font-bold text-slate-800 outline-none"
                />
                <span className="text-[9px] text-slate-400">{isPt ? "/ano" : "/año"}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-medium block">Adobe CC (InDesign/Illustrator):</label>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-1">
                <span className="text-[10px] text-slate-400">R$</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={licenciaAdobeAno}
                  onFocus={handleInputFocus}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setLicenciaAdobeAno(val);
                    notifyChange({ licenciaAdobeAno: val });
                  }}
                  className="w-full text-xs font-bold text-slate-800 outline-none"
                />
                <span className="text-[9px] text-slate-400">{isPt ? "/ano" : "/año"}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-medium block">Outros Software (CAD/Render):</label>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-1">
                <span className="text-[10px] text-slate-400">R$</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={licenciaOtrosAno}
                  onFocus={handleInputFocus}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setLicenciaOtrosAno(val);
                    notifyChange({ licenciaOtrosAno: val });
                  }}
                  className="w-full text-xs font-bold text-slate-800 outline-none"
                />
                <span className="text-[9px] text-slate-400">{isPt ? "/ano" : "/año"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

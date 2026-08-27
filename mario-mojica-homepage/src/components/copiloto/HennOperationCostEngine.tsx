"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calculator,
  Users,
  Package,
  TrendingDown,
  RotateCcw,
  Sparkles,
  Layers,
  CircleDollarSign,
  Laptop,
  Headphones,
  Send,
  CheckCircle2,
  Share2
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
  onParamChange?: (params: CostParameters) => void;
  onSummaryChange?: (summary: any) => void;
}) {
  // Parámetros Principales
  const [manualesAno, setManualesAno] = useState<number>(initialParams?.manualesAno ?? 200);
  const [personasPed, setPersonasPed] = useState<number>(initialParams?.personasPed ?? 2.0);
  const [salarioCltMes, setSalarioCltMes] = useState<number>(initialParams?.salarioCltMes ?? 6000);

  // Strings para edición fluida
  const [manualesAnoStr, setManualesAnoStr] = useState<string>(String(initialParams?.manualesAno ?? 200));
  const [personasPedStr, setPersonasPedStr] = useState<string>(String(initialParams?.personasPed ?? 2.0));
  const [salarioCltMesStr, setSalarioCltMesStr] = useState<string>(String(initialParams?.salarioCltMes ?? 6000));

  // Licencias
  const [licenciaSketchUpAno, setLicenciaSketchUpAno] = useState<number>(initialParams?.licenciaSketchUpAno ?? 2400);
  const [licenciaAdobeAno, setLicenciaAdobeAno] = useState<number>(initialParams?.licenciaAdobeAno ?? 3600);
  const [licenciaOtrosAno, setLicenciaOtrosAno] = useState<number>(initialParams?.licenciaOtrosAno ?? 0);

  // Ahorro
  const [ahorroPct, setAhorroPct] = useState<number>(initialParams?.ahorroPct ?? 30);

  // SAC / Soporte
  const [horasSacMes, setHorasSacMes] = useState<number>(initialParams?.horasSacMes ?? 20);

  // Bandera de edición local (impide que el polling borre lo que el usuario está escribiendo)
  const isDirtyRef = useRef<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const isPt = uiLang === "pt";

  // Sincronizar desde el servidor SOLO cuando el usuario NO tiene cambios locales sin guardar
  useEffect(() => {
    if (initialParams && !isDirtyRef.current) {
      if (initialParams.manualesAno !== undefined) {
        setManualesAno(initialParams.manualesAno);
        setManualesAnoStr(String(initialParams.manualesAno));
      }
      if (initialParams.personasPed !== undefined) {
        setPersonasPed(initialParams.personasPed);
        setPersonasPedStr(String(initialParams.personasPed));
      }
      if (initialParams.salarioCltMes !== undefined) {
        setSalarioCltMes(initialParams.salarioCltMes);
        setSalarioCltMesStr(String(initialParams.salarioCltMes));
      }
      if (initialParams.licenciaSketchUpAno !== undefined) setLicenciaSketchUpAno(initialParams.licenciaSketchUpAno);
      if (initialParams.licenciaAdobeAno !== undefined) setLicenciaAdobeAno(initialParams.licenciaAdobeAno);
      if (initialParams.licenciaOtrosAno !== undefined) setLicenciaOtrosAno(initialParams.licenciaOtrosAno);
      if (initialParams.ahorroPct !== undefined) setAhorroPct(initialParams.ahorroPct);
      if (initialParams.horasSacMes !== undefined) setHorasSacMes(initialParams.horasSacMes);
    }
  }, [initialParams]);

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

  // Sincronizar inmediatamente con Supabase
  const handleSyncToRoom = () => {
    isDirtyRef.current = false;
    const current: CostParameters = {
      manualesAno,
      personasPed,
      salarioCltMes,
      licenciaSketchUpAno,
      licenciaAdobeAno,
      licenciaOtrosAno,
      ahorroPct,
      horasPequeno: 8,
      horasMediano: 12,
      horasGrande: 16,
      horasSacMes
    };
    onParamChange?.(current);
    setSyncStatusMsg(isPt ? "Matriz gravada na nuvem e sincronizada!" : "¡Matriz guardada en la nube y sincronizada!");
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const resetDefault = () => {
    isDirtyRef.current = false;
    setManualesAno(200);
    setManualesAnoStr("200");
    setPersonasPed(2.0);
    setPersonasPedStr("2.0");
    setSalarioCltMes(6000);
    setSalarioCltMesStr("6000");
    setLicenciaSketchUpAno(2400);
    setLicenciaAdobeAno(3600);
    setLicenciaOtrosAno(0);
    setAhorroPct(30);
    setHorasSacMes(20);

    const defaultParams: CostParameters = {
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
    onParamChange?.(defaultParams);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isDirtyRef.current = true;
    e.target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex flex-col gap-3 font-sans text-xs pb-24 select-text">
      {/* Cabecera del Cotizador */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 bg-slate-50 p-2.5 rounded-xl border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-cyan-100 text-cyan-800 rounded-lg shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight truncate">
              {isPt
                ? "Cotizador da Operação Anual de P&D | Móveis Henn"
                : "Cotizador de la Operación Anual de P&D | Móveis Henn"}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500">
              {isPt
                ? "Edite os números e clique em Sincronizar Sala para gravar na nuvem."
                : "Edita los números y haz clic en Sincronizar Sala para guardar en la nube."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={resetDefault}
            className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition"
            title={isPt ? "Restaurar valores de referência" : "Restablecer valores de referencia"}
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden xs:inline">{isPt ? "Restaurar" : "Restablecer"}</span>
          </button>

          {/* Botón Maestro de Sincronización */}
          <button
            onClick={handleSyncToRoom}
            className="bg-cyan-700 hover:bg-cyan-800 text-white px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Send className="w-3.5 h-3.5 text-cyan-300" />
            <span>{isPt ? "Sincronizar Sala" : "Sincronizar Sala"}</span>
          </button>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

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

        <div className="bg-emerald-50/80 p-2 sm:p-2.5 rounded-lg border border-emerald-200 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-emerald-900">
            {isPt ? "Economia Líquida para a Henn:" : "Ahorro Neto para Henn:"}
          </span>
          <div>
            <span className="text-sm sm:text-base font-extrabold text-emerald-700 block">
              +R$ {ahorroNetoTotalAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              <span className="text-[9px] font-normal text-emerald-800"> {isPt ? "/ano" : "/año"}</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-800">
              +R$ {(costoEstandarManualHenn - costoEstandarManualMario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} <span className="font-normal text-emerald-600">{isPt ? "economia/manual" : "ahorro/manual"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: MACRO OPERACIÓN ANUAL DE HENN */}
      <div className="border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-white space-y-2.5">
        <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
          
          {isPt
            ? "1. Parâmetros da Operação Anual da Henn"
            : "1. Parámetros de la Operación Anual de Henn"}
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
              type="text"
              inputMode="numeric"
              value={manualesAnoStr}
              onFocus={handleInputFocus}
              onChange={e => {
                isDirtyRef.current = true;
                const text = e.target.value;
                setManualesAnoStr(text);
                const num = parseFloat(text.replace(',', '.'));
                if (!isNaN(num) && num > 0) {
                  setManualesAno(num);
                }
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
              type="text"
              inputMode="decimal"
              value={personasPedStr}
              onFocus={handleInputFocus}
              onChange={e => {
                isDirtyRef.current = true;
                const text = e.target.value;
                setPersonasPedStr(text);
                const num = parseFloat(text.replace(',', '.'));
                if (!isNaN(num) && num > 0) {
                  setPersonasPed(num);
                }
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
              type="text"
              inputMode="numeric"
              value={salarioCltMesStr}
              onFocus={handleInputFocus}
              onChange={e => {
                isDirtyRef.current = true;
                const text = e.target.value;
                setSalarioCltMesStr(text);
                const num = parseFloat(text.replace(',', '.'));
                if (!isNaN(num) && num > 0) {
                  setSalarioCltMes(num);
                }
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

        {/* Licencias de Software */}
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
                    isDirtyRef.current = true;
                    setLicenciaSketchUpAno(Number(e.target.value));
                  }}
                  className="w-full text-xs font-bold text-slate-800 outline-none"
                />
                <span className="text-[9px] text-slate-400">{isPt ? "/ano" : "/año"}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-medium block">Adobe InDesign / CC:</label>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-1">
                <span className="text-[10px] text-slate-400">R$</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={licenciaAdobeAno}
                  onFocus={handleInputFocus}
                  onChange={e => {
                    isDirtyRef.current = true;
                    setLicenciaAdobeAno(Number(e.target.value));
                  }}
                  className="w-full text-xs font-bold text-slate-800 outline-none"
                />
                <span className="text-[9px] text-slate-400">{isPt ? "/ano" : "/año"}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-medium block">Plugins / Outros:</label>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-1">
                <span className="text-[10px] text-slate-400">R$</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={licenciaOtrosAno}
                  onFocus={handleInputFocus}
                  onChange={e => {
                    isDirtyRef.current = true;
                    setLicenciaOtrosAno(Number(e.target.value));
                  }}
                  className="w-full text-xs font-bold text-slate-800 outline-none"
                />
                <span className="text-[9px] text-slate-400">{isPt ? "/ano" : "/año"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Costo SAC */}
        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Headphones className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-slate-800 block">
                {isPt ? "Horas de Suporte P&D / SAC Gastas em Dúvidas de Montagem:" : "Horas de Soporte P&D / SAC Gastas en Dudas de Montaje:"}
              </span>
              <span className="text-[10px] text-slate-500">
                {isPt ? "Custo estimado do tempo da equipe atendendo dúvidas de montadores." : "Costo estimado del tiempo del equipo atendiendo dudas de montadores."}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <input
              type="number"
              inputMode="numeric"
              value={horasSacMes}
              onFocus={handleInputFocus}
              onChange={e => {
                isDirtyRef.current = true;
                setHorasSacMes(Number(e.target.value));
              }}
              className="w-16 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-center outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] text-slate-500">{isPt ? "horas/mês" : "horas/mes"}</span>
            <span className="text-[10px] font-bold text-slate-700 ml-1">
              (R$ {costoSacAno.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}{isPt ? "/ano" : "/año"})
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CALIBRACIÓN DEL AHORRO OFRECIDO */}
      <div className="border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-white space-y-2.5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
          <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
            
            {isPt ? "2. Margem de Economia Proposta por Mario Mojica" : "2. Margen de Ahorro Propuesto por Mario Mojica"}
          </h3>
          <span className="bg-cyan-100 text-cyan-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
            {ahorroPct}% {isPt ? "de Economia" : "de Ahorro"}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold text-slate-700">
            <span>{isPt ? "Porcentagem de Redução Direta de Custos:" : "Porcentaje de Reducción Directa de Costos:"}</span>
            <span className="text-cyan-700 font-extrabold text-xs">{ahorroPct}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={50}
            step={1}
            value={ahorroPct}
            onChange={e => {
              isDirtyRef.current = true;
              setAhorroPct(Number(e.target.value));
            }}
            className="w-full accent-cyan-600 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
            <span>10% (Conservador)</span>
            <span>30% (Recomendado)</span>
            <span>50% (Agressivo)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

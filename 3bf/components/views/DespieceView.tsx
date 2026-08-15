"use client";

import React, { useState, useEffect, useMemo } from "react";
import { use3BFStore, TableroRecord, HerrajeRecord, CantoRecord } from "@/lib/store";
import { 
  FileText, 
  Hammer, 
  DollarSign, 
  Download, 
  Check, 
  Save, 
  Edit2, 
  Tag, 
  ShieldCheck, 
  Calculator, 
  Layers, 
  Sparkles, 
  Coins, 
  Percent, 
  Scissors,
  Ruler,
  Maximize2
} from "lucide-react";

/**
 * Componente de entrada numérica inteligente con formato latino/español:
 * - Coma (,) para decimales, Punto (.) para miles.
 * - Auto-selección completa al hacer clic (focus) para sobreescribir inmediatamente.
 * - Sin '0' invasivos al borrar.
 * - Permite escribir indistintamente punto o coma.
 */
function DecimalInput({
  value,
  onChange,
  decimals = 1,
  className = "",
  placeholder = "0"
}: {
  value: number;
  onChange: (val: number) => void;
  decimals?: number;
  className?: string;
  placeholder?: string;
}) {
  const [texto, setTexto] = useState("");
  const [enfocado, setEnfocado] = useState(false);

  const formatParaMostrar = (num: number) => {
    if (num === undefined || num === null || isNaN(num)) return "";
    return num.toString().replace(".", ",");
  };

  useEffect(() => {
    if (!enfocado) {
      setTexto(formatParaMostrar(value));
    }
  }, [value, enfocado]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTexto(raw);

    const normalizado = raw.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(normalizado);
    if (!isNaN(num)) {
      onChange(num);
    } else if (raw === "" || raw === "-") {
      onChange(0);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setEnfocado(true);
    e.target.select();
  };

  const handleBlur = () => {
    setEnfocado(false);
    const normalizado = texto.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(normalizado);
    if (!isNaN(num)) {
      onChange(num);
      setTexto(formatParaMostrar(num));
    } else {
      onChange(0);
      setTexto("0");
    }
  };

  return (
    <input
      type="text"
      value={texto}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}

export default function DespieceView() {
  const { 
    resultado, 
    parametros,
    dbHerrajes,
    dbTableros,
    dbCantos,
    costosConversion,
    fichasConfig,
    setFichaConfig,
    getFichaConfig,
    negociacionNovopan,
    moneda,
    setMoneda
  } = use3BFStore();

  const trm = negociacionNovopan?.trmNovopan || 4000;

  const [descargando, setDescargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const modelKey = parametros.model_id || parametros.custom_filename || "Cubierta";

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Leer configuración inicial directamente del Store de Zustand / localStorage
  const fichaInicial = getFichaConfig(modelKey);
  const [versionActual, setVersionActual] = useState(fichaInicial.versionActual || "v1.0");
  const [piezasEditadas, setPiezasEditadas] = useState<Array<{ nombre: string; largo: number; ancho: number; espesor: number; cantidad: number; tipo?: string }>>([]);
  const [materialesPorPieza, setMaterialesPorPieza] = useState<Record<number, string>>(fichaInicial.materialesPorPieza || {});
  const [desperdicioGlobalPct, setDesperdicioGlobalPct] = useState<number>(fichaInicial.desperdicioGlobalPct ?? 10.0);
  const [desperdicioPorPieza, setDesperdicioPorPieza] = useState<Record<number, number>>(fichaInicial.desperdicioPorPieza || {});
  
  // Configuración de cantos por pieza (A = cantos en ancho, L = cantos en largo, cantoCodigo)
  const [cantosPorPieza, setCantosPorPieza] = useState<Record<number, {
    cantosAncho: number;
    cantosLargo: number;
    cantoCodigo?: string;
  }>>(fichaInicial.cantosPorPieza || {});

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Sincronizar reactivamente si cambia de modelo
  useEffect(() => {
    const config = getFichaConfig(modelKey);
    setDesperdicioGlobalPct(config.desperdicioGlobalPct ?? 10.0);
    setDesperdicioPorPieza(config.desperdicioPorPieza || {});
    setMaterialesPorPieza(config.materialesPorPieza || {});
    setCantosPorPieza(config.cantosPorPieza || {});
    setVersionActual(config.versionActual || "v1.0");
  }, [modelKey]);

  // Persistir reactivamente cada cambio en Zustand y LocalStorage
  const sincronizarCambios = (cambios: Partial<typeof fichaInicial>) => {
    setFichaConfig(modelKey, cambios);
  };

  useEffect(() => {
    if (resultado?.despiece) {
      setPiezasEditadas(resultado.despiece);
    }
  }, [resultado?.despiece]);

  // Piezas activas garantizadas 1:1 con el cómputo 3D
  const piezasActivas = (resultado?.despiece && piezasEditadas.length === resultado.despiece.length)
    ? piezasEditadas 
    : (resultado?.despiece || []);

  // Formateadores monetarios exactos sin pérdidas por redondeo
  const formatMoneyCustom = (copVal: number, usdVal: number) => {
    if (moneda === "COP") {
      return `$${Math.round(copVal).toLocaleString("es-CO")} COP`;
    }
    return `$${usdVal.toFixed(2)} USD`;
  };

  const formatUnitCustom = (copVal: number, usdVal: number) => {
    if (moneda === "COP") {
      return `$${Math.round(copVal).toLocaleString("es-CO")}`;
    }
    return `$${usdVal.toFixed(2)}`;
  };

  // Función para obtener el material asignado a cada tablero desde dbTableros
  const getMaterialParaPieza = (idx: number, espesor: number): TableroRecord => {
    const cod = materialesPorPieza[idx];
    if (cod) {
      const found = dbTableros.find((t: TableroRecord) => t.codigo === cod);
      if (found) return found;
    }
    // Detección automática por calibre de la pieza
    if (espesor >= 24) {
      return dbTableros.find((t: TableroRecord) => t.calibreMm === 25) || dbTableros[1] || dbTableros[0];
    }
    if (espesor <= 5) {
      return dbTableros.find((t: TableroRecord) => t.calibreMm < 5) || dbTableros[3] || dbTableros[0];
    }
    if (espesor === 18) {
      return dbTableros.find((t: TableroRecord) => t.calibreMm === 18) || dbTableros[4] || dbTableros[0];
    }
    return dbTableros.find((t: TableroRecord) => t.calibreMm === 15) || dbTableros[0];
  };

  const handleMaterialChange = (idx: number, nuevoCodigo: string) => {
    setMaterialesPorPieza((prev) => {
      const updated = { ...prev, [idx]: nuevoCodigo };
      sincronizarCambios({ materialesPorPieza: updated });
      return updated;
    });
  };

  // Detección inteligente de Cantos (A y L) conectada a los parámetros del modelo 3D
  const getCantoConfigDefecto = (nombre: string, espesor: number, params: any) => {
    const n = nombre.toLowerCase().trim();
    if (espesor <= 5 || n.includes("fondo")) {
      return { cantosAncho: 0, cantosLargo: 0, cantoCodigo: "NONE" };
    }

    // Determinar material de canto por calibre
    let codigoCanto = "0002788"; // CANTO PVC CENIZA 19MM N ($194,26 COP/ml)
    if (espesor >= 24) {
      codigoCanto = "000361"; // Canto PVC Rígido Ceniza 33x2.0mm
    } else if (n.includes("cubierta") || n.includes("tapa") || n.includes("frente")) {
      codigoCanto = "000360"; // Canto PVC Rígido Ceniza 22x2.0mm
    }

    // 1. Cubierta / Tapa Superior: Lectura directa de los selectores de borde 3D
    if (n.includes("cubierta") || n.includes("tapa")) {
      const p = params || {};
      const valIzq = String(
        p["RH_IN:03.4 Borde izquierdo"] ?? 
        p["RH_IN:Borde izquierdo"] ?? 
        p["borde_izquierdo"] ?? 
        "MDP"
      ).toLowerCase();

      const valDer = String(
        p["RH_IN:03.3 Borde derecho"] ?? 
        p["RH_IN:Borde derecho"] ?? 
        p["borde_derecho"] ?? 
        "MDP"
      ).toLowerCase();

      // En Grasshopper: 'Canto' = 0 (Lleva Canto), 'MDP' = 1 (Sin Canto)
      const izqTieneCanto = valIzq.includes("canto") || valIzq === "0";
      const derTieneCanto = valDer.includes("canto") || valDer === "0";

      const cantosAncho = (izqTieneCanto ? 1 : 0) + (derTieneCanto ? 1 : 0);
      const cantosLargo = 1; // El frente visto de la cubierta siempre lleva canto

      return { cantosAncho, cantosLargo, cantoCodigo: codigoCanto };
    }

    // 2. Entrepaño / Repisa: Solo el borde frontal visto
    if (n.includes("entrepaño") || n.includes("repisa")) {
      return { cantosAncho: 0, cantosLargo: 1, cantoCodigo: codigoCanto };
    }

    // 3. Puertas y Frentes de Cajón: Los 4 lados canteados
    if (n.includes("puerta") || n.includes("frente")) {
      return { cantosAncho: 2, cantosLargo: 2, cantoCodigo: codigoCanto };
    }

    // 4. Laterales / Parales: 1 largo (frente visto)
    if (n.includes("lateral") || n.includes("paral")) {
      return { cantosAncho: 0, cantosLargo: 1, cantoCodigo: codigoCanto };
    }

    // 5. Piezas internas de cajón: 1 largo (canto superior)
    if (n.includes("cajon") || n.includes("cajón")) {
      return { cantosAncho: 0, cantosLargo: 1, cantoCodigo: "0004623" };
    }

    return { cantosAncho: 1, cantosLargo: 1, cantoCodigo: codigoCanto };
  };

  // Obtener la configuración activa de cantos para una pieza (con fallback reactivo al 3D)
  const getCantoPieza = (idx: number, nombre: string, espesor: number) => {
    const manual = cantosPorPieza[idx];
    if (manual) return manual;
    return getCantoConfigDefecto(nombre, espesor, parametros);
  };

  const handleCantoChange = (idx: number, field: "cantosAncho" | "cantosLargo" | "cantoCodigo", val: any, nombre: string, espesor: number) => {
    setCantosPorPieza((prev) => {
      const current = prev[idx] ?? getCantoConfigDefecto(nombre, espesor, parametros);
      const updated = {
        ...prev,
        [idx]: {
          ...current,
          [field]: val
        }
      };
      sincronizarCambios({ cantosPorPieza: updated });
      return updated;
    });
  };

  const handleDesperdicioGlobalChange = (val: number) => {
    setDesperdicioGlobalPct(val);
    setDesperdicioPorPieza({});
    sincronizarCambios({ desperdicioGlobalPct: val, desperdicioPorPieza: {} });
  };

  const handleDesperdicioPiezaChange = (idx: number, val: number) => {
    setDesperdicioPorPieza((prev) => {
      const updated = { ...prev, [idx]: val };
      sincronizarCambios({ desperdicioPorPieza: updated });
      return updated;
    });
  };

  // Cálculos de Tableros / Madera con valores nativos COP, USD y Desperdicio Nesting
  const resumenMadera = useMemo(() => {
    let areaTotalM2 = 0;
    let totalMaderaCop = 0;
    let totalMaderaUsd = 0;

    const items = piezasActivas.map((p: any, idx: number) => {
      const mat = getMaterialParaPieza(idx, p.espesor);
      const areaM2 = (p.largo * p.ancho * p.cantidad) / 1_000_000.0;
      areaTotalM2 += areaM2;

      // Desperdicio de esta pieza (o el global si no se ha sobreescrito)
      const despPct = desperdicioPorPieza[idx] !== undefined ? desperdicioPorPieza[idx] : desperdicioGlobalPct;
      
      // Factor de desperdicio industrial según fórmula oficial de Excel EDP: 1 / (1 - desp)
      const despDecimal = Math.min(Math.max(despPct / 100.0, 0), 0.95);
      const factorDesp = despDecimal > 0 ? (1.0 / (1.0 - despDecimal)) : 1.0;

      const costoM2Cop = mat.costoM2Cop || Math.round(mat.costoM2Usd * trm);
      const costoM2Usd = mat.costoM2Usd || Number((mat.costoM2Cop / trm).toFixed(2));

      // Costo con desperdicio de corte
      const costoCop = Math.round(areaM2 * costoM2Cop * factorDesp);
      const costoUsd = Number((areaM2 * costoM2Usd * factorDesp).toFixed(2));

      totalMaderaCop += costoCop;
      totalMaderaUsd += costoUsd;

      // Configuración de Canto de esta pieza
      const cConfig = getCantoPieza(idx, p.nombre, p.espesor);
      const cantoMat = dbCantos.find((c: CantoRecord) => c.codigo === cConfig.cantoCodigo);
      
      // Fórmula oficial de fábrica Excel EDP (+100mm de despunte por borde):
      // Metros = [((Ancho + 100) * A + (Largo + 100) * L) / 1000] * Cantidad
      let metrosCantoPieza = 0;
      if (cantoMat && (cConfig.cantosAncho > 0 || cConfig.cantosLargo > 0)) {
        metrosCantoPieza = Number(((((p.ancho + 100) * cConfig.cantosAncho + (p.largo + 100) * cConfig.cantosLargo) / 1000.0) * p.cantidad).toFixed(2));
      }

      return {
        ...p,
        materialSeleccionado: mat,
        areaM2: Number(areaM2.toFixed(3)),
        desperdicioPct: despPct,
        factorDesperdicio: factorDesp,
        costoM2Cop,
        costoM2Usd,
        costoTotalCop: costoCop,
        costoTotalUsd: costoUsd,
        // Datos de Canto asociados
        cantosAncho: cConfig.cantosAncho,
        cantosLargo: cConfig.cantosLargo,
        cantoCodigo: cConfig.cantoCodigo,
        cantoMaterial: cantoMat,
        metrosCanto: metrosCantoPieza
      };
    });

    return {
      items,
      areaTotalM2: Number(areaTotalM2.toFixed(3)),
      costoTotalMaderaCop: Math.round(totalMaderaCop),
      costoTotalMaderaUsd: Number(totalMaderaUsd.toFixed(2))
    };
  }, [piezasActivas, materialesPorPieza, dbTableros, dbCantos, trm, desperdicioGlobalPct, desperdicioPorPieza, cantosPorPieza, parametros]);

  // Cálculos Consolidados de Cantos (Metros Lineales y Costos)
  const resumenCantos = useMemo(() => {
    const mapa = new Map<string, {
      record: CantoRecord;
      metrosLineales: number;
      piezasAsociadas: number;
    }>();

    resumenMadera.items.forEach((p: any) => {
      if (p.cantoMaterial && p.metrosCanto > 0) {
        const cod = p.cantoMaterial.codigo;
        const current = mapa.get(cod) || {
          record: p.cantoMaterial,
          metrosLineales: 0,
          piezasAsociadas: 0
        };
        current.metrosLineales += p.metrosCanto;
        current.piezasAsociadas += p.cantidad;
        mapa.set(cod, current);
      }
    });

    let totalCop = 0;
    let totalUsd = 0;
    let totalMetros = 0;

    const items = Array.from(mapa.values()).map(({ record, metrosLineales, piezasAsociadas }: { record: CantoRecord; metrosLineales: number; piezasAsociadas: number }) => {
      const mlRedondeado = Number(metrosLineales.toFixed(2));
      const copTotal = Math.round(mlRedondeado * record.costoMlCop);
      const usdTotal = Number((mlRedondeado * record.costoMlUsd).toFixed(2));

      totalCop += copTotal;
      totalUsd += usdTotal;
      totalMetros += mlRedondeado;

      return {
        id: record.id,
        codigo: record.codigo,
        descripcion: record.descripcion,
        espesorMm: record.espesorMm,
        anchoMm: record.anchoMm,
        tipo: record.tipo,
        proveedor: record.proveedor,
        metrosLineales: mlRedondeado,
        piezasAsociadas,
        costoMlCop: record.costoMlCop,
        costoMlUsd: record.costoMlUsd,
        costoTotalCop: copTotal,
        costoTotalUsd: usdTotal
      };
    });

    return {
      items,
      cantTotalMetros: Number(totalMetros.toFixed(2)),
      costoTotalCantosCop: Math.round(totalCop),
      costoTotalCantosUsd: Number(totalUsd.toFixed(2))
    };
  }, [resumenMadera.items]);

  // Cálculos de Herrajes con valores nativos COP y USD
  const resumenHerrajes = useMemo(() => {
    if (!resultado?.herrajes) return { items: [], costoTotalHerrajesCop: 0, costoTotalHerrajesUsd: 0, cantTotalHerrajes: 0 };
    
    let totalCop = 0;
    let totalUsd = 0;
    let totalCant = 0;

    const items = resultado.herrajes.map((h: any) => {
      const nameLower = h.nombre.toLowerCase().trim();
      
      // Match en dbHerrajes
      let match = dbHerrajes.find((rec: HerrajeRecord) => rec.nombreGhx.toLowerCase().trim() === nameLower);
      if (!match) {
        match = dbHerrajes.find((rec: HerrajeRecord) => nameLower.includes(rec.nombreGhx.toLowerCase().trim()) || rec.nombreGhx.toLowerCase().trim().includes(nameLower));
      }

      const descComercial = match ? match.descripcion : h.nombre;
      const unidadMed = match ? match.unidad : (h.unidad || "UND");
      
      // Costos unitarios exactos
      const unitCop = match ? match.costoCop : Math.round(0.20 * trm);
      const unitUsd = match ? match.costoUsd : 0.20;

      const filaCop = h.cantidad * unitCop;
      const filaUsd = h.cantidad * unitUsd;

      totalCop += filaCop;
      totalUsd += filaUsd;
      totalCant += h.cantidad;

      return {
        nombreGhx: h.nombre,
        descripcion: descComercial,
        unidad: unidadMed,
        cantidad: h.cantidad,
        costoUnitarioCop: unitCop,
        costoUnitarioUsd: unitUsd,
        costoTotalCop: filaCop,
        costoTotalUsd: Number(filaUsd.toFixed(2))
      };
    });

    return {
      items,
      costoTotalHerrajesCop: Math.round(totalCop),
      costoTotalHerrajesUsd: Number(totalUsd.toFixed(2)),
      cantTotalHerrajes: totalCant
    };
  }, [resultado?.herrajes, dbHerrajes, trm]);

  // Cálculos del Modelo Financiero Industrial (100% = MP + Tercerizaciones + MO+PRES + CIF)
  const resumenIndustrial = useMemo(() => {
    const laminaCop = resumenMadera.costoTotalMaderaCop;
    const laminaUsd = resumenMadera.costoTotalMaderaUsd;
    
    const fondosCop = 0; // Reservado para piezas clasificadas como fondo
    const fondosUsd = 0;

    const cantoCop = resumenCantos.costoTotalCantosCop;
    const cantoUsd = resumenCantos.costoTotalCantosUsd;

    const herrajesCop = resumenHerrajes.costoTotalHerrajesCop;
    const herrajesUsd = resumenHerrajes.costoTotalHerrajesUsd;

    const empaqueCop = costosConversion?.costoEmpaqueCop || 0;
    const empaqueUsd = Number((empaqueCop / trm).toFixed(2));

    // Subtotal Base MP
    const baseMpCop = laminaCop + fondosCop + cantoCop + herrajesCop + empaqueCop;
    const baseMpUsd = laminaUsd + fondosUsd + cantoUsd + herrajesUsd + empaqueUsd;

    // Adicionales
    const pctAdic = costosConversion?.pctAdicionales ?? 0.40;
    const adicionalesCop = Math.round(baseMpCop * (pctAdic / 100.0));
    const adicionalesUsd = Number((baseMpUsd * (pctAdic / 100.0)).toFixed(2));

    // Total MP Directa
    const totalMpCop = baseMpCop + adicionalesCop;
    const totalMpUsd = Number((baseMpUsd + adicionalesUsd).toFixed(2));

    // Tercerizaciones
    const tercerizacionesCop = costosConversion?.costoTercerizacionesCop || 0;
    const tercerizacionesUsd = Number((tercerizacionesCop / trm).toFixed(2));

    // Factores Porcentuales de Mano de Obra y CIF
    const pctMo = costosConversion?.pctManoObraPres ?? 12.42;
    const pctCif = costosConversion?.pctCIF ?? 9.80;
    const factorConversion = Math.max(0.1, 1.0 - (pctMo + pctCif) / 100.0);

    // COSTO TOTAL DE FABRICACIÓN (100%)
    const costoTotalFabCop = Math.round((totalMpCop + tercerizacionesCop) / factorConversion);
    const costoTotalFabUsd = Number(((totalMpUsd + tercerizacionesUsd) / factorConversion).toFixed(2));

    // Costo Mano de Obra y CIF en dinero ($)
    const moPresCop = Math.round(costoTotalFabCop * (pctMo / 100.0));
    const moPresUsd = Number((costoTotalFabUsd * (pctMo / 100.0)).toFixed(2));

    const cifCop = Math.round(costoTotalFabCop * (pctCif / 100.0));
    const cifUsd = Number((costoTotalFabUsd * (pctCif / 100.0)).toFixed(2));

    // Porcentajes de Impacto Real en el 100%
    const pctLaminaReal = costoTotalFabCop > 0 ? Number(((laminaCop / costoTotalFabCop) * 100).toFixed(1)) : 0;
    const pctFondosReal = costoTotalFabCop > 0 ? Number(((fondosCop / costoTotalFabCop) * 100).toFixed(1)) : 0;
    const pctCantoReal = costoTotalFabCop > 0 ? Number(((cantoCop / costoTotalFabCop) * 100).toFixed(1)) : 0;
    const pctEmpaqueReal = costoTotalFabCop > 0 ? Number(((empaqueCop / costoTotalFabCop) * 100).toFixed(1)) : 0;
    const pctHerrajesReal = costoTotalFabCop > 0 ? Number(((herrajesCop / costoTotalFabCop) * 100).toFixed(1)) : 0;
    const pctAdicionalesReal = costoTotalFabCop > 0 ? Number(((adicionalesCop / costoTotalFabCop) * 100).toFixed(1)) : 0;
    const pctMpTotalReal = Number((100 - pctMo - pctCif).toFixed(2));

    return {
      laminaCop, laminaUsd, pctLaminaReal,
      fondosCop, fondosUsd, pctFondosReal,
      cantoCop, cantoUsd, pctCantoReal,
      empaqueCop, empaqueUsd, pctEmpaqueReal,
      herrajesCop, herrajesUsd, pctHerrajesReal,
      adicionalesCop, adicionalesUsd, pctAdicionalesReal,
      totalMpCop, totalMpUsd, pctMpTotalReal,
      tercerizacionesCop, tercerizacionesUsd, pctTercerizacionesReal: 0.0,
      moPresCop, moPresUsd, pctMo,
      cifCop, cifUsd, pctCif,
      costoTotalFabCop, costoTotalFabUsd
    };
  }, [resumenMadera, resumenCantos, resumenHerrajes, costosConversion, trm]);

  // Costo Total Consolidado (Materia Prima Directa)
  const costoTotalMuebleCop = resumenIndustrial.totalMpCop;
  const costoTotalMuebleUsd = resumenIndustrial.totalMpUsd;

  if (!resultado) {
    return (
      <div className="p-6 text-center text-xs text-gray-500">
        Calculando despiece DfMA y matriz de costos...
      </div>
    );
  }

  const handleNombreChange = (idx: number, nuevoNombre: string) => {
    setPiezasEditadas((prev) => {
      const copy = [...prev];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], nombre: nuevoNombre };
      }
      const namesObj = copy.reduce((acc: Record<number, string>, p: any, i: number) => ({ ...acc, [i]: p.nombre }), {});
      sincronizarCambios({ piezasNombres: namesObj });
      return copy;
    });
  };

  const guardarEnSupabase = async () => {
    setGuardando(true);
    setGuardadoExitoso(false);
    try {
      // 1. Sincronizar estado completo en el Store Global de Zustand y en LocalStorage
      sincronizarCambios({
        desperdicioGlobalPct,
        desperdicioPorPieza,
        materialesPorPieza,
        cantosPorPieza,
        versionActual,
        piezasNombres: piezasEditadas.reduce((acc: Record<number, string>, p: any, i: number) => ({ ...acc, [i]: p.nombre }), {})
      });

      // 2. Construir el payload industrial oficial
      const payload = {
        model_id: parametros.model_id || "Cubierta",
        custom_filename: parametros.custom_filename || "Cubierta.ghx",
        version: versionActual,
        moneda: moneda,
        trm: trm,
        desperdicio_global_pct: desperdicioGlobalPct,
        despiece: resumenMadera.items.map((i: any) => ({
          nombre: i.nombre,
          largo: i.largo,
          ancho: i.ancho,
          espesor: i.espesor,
          cantidad: i.cantidad,
          material: i.materialSeleccionado.nombreComercial,
          codigo_material: i.materialSeleccionado.codigo,
          desperdicio_pct: i.desperdicioPct,
          cantos_ancho: i.cantosAncho,
          cantos_largo: i.cantosLargo,
          canto_material: i.cantoMaterial?.descripcion || "Ninguno",
          canto_codigo: i.cantoMaterial?.codigo || "NONE",
          metros_canto: i.metrosCanto,
          costo_total_cop: i.costoTotalCop,
          costo_total_usd: i.costoTotalUsd
        })),
        herrajes: resumenHerrajes.items,
        cantos_consolidado: resumenCantos.items,
        summary: {
          area_madera_m2: resumenMadera.areaTotalM2,
          costo_madera_cop: resumenMadera.costoTotalMaderaCop,
          costo_madera_usd: resumenMadera.costoTotalMaderaUsd,
          costo_herrajes_cop: resumenHerrajes.costoTotalHerrajesCop,
          costo_herrajes_usd: resumenHerrajes.costoTotalHerrajesUsd,
          metros_canto_total: resumenCantos.cantTotalMetros,
          costo_cantos_cop: resumenCantos.costoTotalCantosCop,
          costo_cantos_usd: resumenCantos.costoTotalCantosUsd,
          costo_total_mp_cop: resumenIndustrial.totalMpCop,
          costo_total_mp_usd: resumenIndustrial.totalMpUsd,
          mano_obra_pres_cop: resumenIndustrial.moPresCop,
          mano_obra_pres_usd: resumenIndustrial.moPresUsd,
          cif_cop: resumenIndustrial.cifCop,
          cif_usd: resumenIndustrial.cifUsd,
          costo_total_fabricacion_100_cop: resumenIndustrial.costoTotalFabCop,
          costo_total_fabricacion_100_usd: resumenIndustrial.costoTotalFabUsd,
          pct_distribucion: {
            mp: resumenIndustrial.pctMpTotalReal,
            mo: resumenIndustrial.pctMo,
            cif: resumenIndustrial.pctCif
          }
        },
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(`3bf_bom_${payload.model_id}_${versionActual}`, JSON.stringify(payload));
      localStorage.setItem(`3bf_ficha_config_${modelKey}`, JSON.stringify({
        desperdicioGlobalPct,
        desperdicioPorPieza,
        materialesPorPieza,
        cantosPorPieza,
        versionActual
      }));
      
      await new Promise((resolve) => setTimeout(resolve, 400));
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3500);
    } catch (e) {
      console.error("Error guardando en Supabase:", e);
    } finally {
      setGuardando(false);
    }
  };

  const descargarDXF = async () => {
    setDescargando(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_id: parametros.model_id || "Cubierta", parameters: parametros }),
      });
      const data = await res.json();
      if (data.dxf_content) {
        const blob = new Blob([data.dxf_content], { type: "application/dxf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || "mueble_3bf.dxf";
        a.click();
      }
    } catch (e) {
      console.error("Error al exportar DXF:", e);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 h-full overflow-y-auto bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
      {/* Barra de Controles: Master Key, Versión, Selector de Moneda, TRM y Botón de Guardado */}
      <div className="flex flex-wrap items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm gap-2">
        {/* Identificador GHX */}
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span className="font-mono text-xs text-cyan-700 dark:text-cyan-300 font-bold">
            {parametros.custom_filename || `${parametros.model_id || "Cubierta"}.ghx`}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 font-mono">
            GHX Master Key
          </span>
        </div>

        {/* Acciones de Cabecera: Guardar Ficha, Versión y Moneda */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Botón Principal de Guardado en Cabecera Superior */}
          <button
            onClick={guardarEnSupabase}
            disabled={guardando}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition cursor-pointer ${
              guardadoExitoso
                ? "bg-emerald-600 text-white hover:bg-emerald-700 animate-pulse"
                : "bg-cyan-600 hover:bg-cyan-700 text-white"
            }`}
            title="Guarda de forma permanente la ficha técnica, desperdicios, materiales y cantos"
          >
            {guardadoExitoso ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Ficha Guardada!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{guardando ? "Guardando..." : "💾 Guardar Ficha en BD"}</span>
              </>
            )}
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />

          {/* Selector de Versión */}
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium text-[11px]">Versión:</span>
            <select
              value={versionActual}
              onChange={(e) => {
                setVersionActual(e.target.value);
                sincronizarCambios({ versionActual: e.target.value });
              }}
              className="text-xs font-bold py-1 px-2 rounded bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-cyan-700 dark:text-cyan-300 outline-none cursor-pointer"
            >
              <option value="v1.0">v1.0 (Definitivo)</option>
              <option value="v1.1">v1.1 (Revisión)</option>
              <option value="v2.0">v2.0 (Rediseño)</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />

          {/* Selector de Moneda (USD / COP) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700/80 p-0.5 rounded-lg border border-slate-300 dark:border-slate-600">
            <button
              onClick={() => setMoneda("USD")}
              className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] transition cursor-pointer ${
                moneda === "USD"
                  ? "bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setMoneda("COP")}
              className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] transition cursor-pointer ${
                moneda === "COP"
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              COP ($)
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Económico DfMA (4 Tarjetas Consolidando Tableros, Herrajes, Cantos y Total) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-900/50 shadow-sm text-center">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Superficie Tableros</span>
          <span className="text-base font-extrabold text-cyan-700 dark:text-cyan-300 font-mono">
            {resumenMadera.areaTotalM2} m²
          </span>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/50 shadow-sm text-center">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Herrajes Totales</span>
          <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
            {resumenHerrajes.cantTotalHerrajes} u
          </span>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/50 shadow-sm text-center">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Metros Canto (+100mm)</span>
          <span className="text-base font-extrabold text-amber-700 dark:text-amber-300 font-mono">
            {resumenCantos.cantTotalMetros} ml
          </span>
        </div>
        <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-900/50 shadow-sm text-center">
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Costo Total Estimado</span>
          <span className="text-base font-extrabold text-purple-700 dark:text-purple-300 font-mono">
            {formatMoneyCustom(costoTotalMuebleCop, costoTotalMuebleUsd)}
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🪵 TABLA 1: LISTA DE CORTE DE TABLEROS (BOM) CON CANTOS Y DESPERDICIO */}
      {/* ===================================================================== */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap justify-between items-center bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              1. Lista de Corte de Tableros & Sustratos (BOM)
            </h3>
          </div>

          {/* Control Global de Desperdicio Nesting */}
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1 rounded-md shadow-sm">
            <Scissors className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
              % Desperdicio Global (Nesting):
            </span>
            <div className="flex items-center gap-1">
              <DecimalInput
                value={desperdicioGlobalPct}
                decimals={1}
                onChange={handleDesperdicioGlobalChange}
                className="w-14 text-center font-mono font-extrabold text-xs text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded px-1 py-0.5 outline-none shadow-sm focus:border-amber-500"
              />
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300 text-xs">%</span>
            </div>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-mono hidden sm:inline" title="Fórmula DfMA de Nesting: Área * Costo m² * [1 / (1 - Desp)]">
              (1/(1-Desp))
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                <th className="p-2.5 w-28">Pieza</th>
                <th className="p-2.5 min-w-[220px]">Sustrato / Tablero</th>
                <th className="p-2.5 w-16 text-center">Largo</th>
                <th className="p-2.5 w-16 text-center">Ancho</th>
                <th className="p-2.5 w-14 text-center">Esp.</th>
                <th className="p-2.5 w-16 text-center">Área</th>
                <th className="p-2.5 w-12 text-center">Cant.</th>
                <th className="p-2.5 w-20 text-right">Costo m²</th>
                <th className="p-2.5 w-20 text-center bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200" title="Porcentaje de desperdicio estimado por nesting">
                  % Desp. ✂️
                </th>
                
                {/* COLUMNAS DE CANTOS */}
                <th className="p-2.5 w-32 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200" title="Cantidad de cantos en Ancho (A) y Largo (L): 0, 1 o 2 por lado">
                  Cantos (A × L) 📐
                </th>
                <th className="p-2.5 min-w-[180px] bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200" title="Material de canto aplicado a esta pieza">
                  Material Canto 🎗️
                </th>
                <th className="p-2.5 w-20 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200" title="Metros lineales con +100mm de despunte de canteadora">
                  Metros
                </th>

                <th className="p-2.5 w-24 text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200">
                  Costo Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {resumenMadera.items.map((p: any, idx: number) => (
                <tr key={idx} className="hover:bg-cyan-50/40 dark:hover:bg-slate-800/50 transition group whitespace-nowrap">
                  {/* Nombre Editable */}
                  <td className="p-2.5">
                    {editingIndex === idx ? (
                      <input
                        type="text"
                        value={p.nombre}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        onBlur={() => setEditingIndex(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape") setEditingIndex(null);
                        }}
                        onChange={(e) => handleNombreChange(idx, e.target.value)}
                        className="p-1 w-full text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-700 border border-cyan-400 rounded outline-none shadow-sm"
                      />
                    ) : (
                      <div
                        onClick={() => setEditingIndex(idx)}
                        className="flex items-center justify-between gap-1.5 cursor-pointer group"
                        title="Haz clic para renombrar la pieza"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 transition">
                          {p.nombre}
                        </span>
                        <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    )}
                  </td>

                  {/* Selector Desplegable de Sustrato */}
                  <td className="p-2">
                    <select
                      value={p.materialSeleccionado.codigo}
                      onChange={(e) => handleMaterialChange(idx, e.target.value)}
                      className="text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-cyan-700 dark:text-cyan-300 outline-none cursor-pointer w-full shadow-inner hover:border-cyan-500 transition"
                    >
                      {dbTableros.map((mat: TableroRecord) => (
                        <option key={mat.codigo} value={mat.codigo}>
                          {mat.nombreComercial}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Dimensiones Desglosadas */}
                  <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{p.largo}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{p.ancho}</td>
                  <td className="p-2.5 text-center font-mono font-bold text-cyan-700 dark:text-cyan-300">{p.espesor}</td>
                  <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">{p.areaM2}</td>
                  <td className="p-2.5 text-center font-mono font-extrabold text-slate-900 dark:text-slate-100">{p.cantidad}</td>
                  <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatUnitCustom(p.costoM2Cop, p.costoM2Usd)}
                  </td>

                  {/* % DESPERDICIO EDITABLE POR PIEZA */}
                  <td className="p-2 text-center bg-amber-50/30 dark:bg-amber-950/20">
                    <div className="flex items-center justify-center gap-0.5">
                      <DecimalInput
                        value={p.desperdicioPct}
                        decimals={1}
                        onChange={(val) => handleDesperdicioPiezaChange(idx, val)}
                        className="w-12 text-center font-mono font-extrabold text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded px-1 py-0.5 outline-none shadow-sm focus:border-amber-500"
                      />
                      <span className="text-amber-700 dark:text-amber-300 font-bold font-mono text-[10px]">%</span>
                    </div>
                  </td>

                  {/* CANTOS: MICRO-SELECTOR (A y L) */}
                  <td className="p-2 text-center bg-blue-50/20 dark:bg-blue-950/10">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="flex items-center gap-0.5" title="Cantos en los 2 Anchos (0, 1 o 2)">
                        <span className="text-[10px] font-bold text-slate-500">A:</span>
                        <select
                          value={p.cantosAncho}
                          onChange={(e) => handleCantoChange(idx, "cantosAncho", Number(e.target.value), p.nombre, p.espesor)}
                          className="font-mono font-bold text-xs px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 outline-none cursor-pointer"
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-0.5" title="Cantos en los 2 Largos (0, 1 o 2)">
                        <span className="text-[10px] font-bold text-slate-500">L:</span>
                        <select
                          value={p.cantosLargo}
                          onChange={(e) => handleCantoChange(idx, "cantosLargo", Number(e.target.value), p.nombre, p.espesor)}
                          className="font-mono font-bold text-xs px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 outline-none cursor-pointer"
                        >
                          <option value={0}>0</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </div>
                    </div>
                  </td>

                  {/* SELECTOR DE MATERIAL DE CANTO */}
                  <td className="p-2 bg-blue-50/20 dark:bg-blue-950/10">
                    <select
                      value={p.cantoCodigo || "NONE"}
                      onChange={(e) => handleCantoChange(idx, "cantoCodigo", e.target.value, p.nombre, p.espesor)}
                      className="text-[11px] font-medium px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300 outline-none cursor-pointer w-full shadow-sm"
                    >
                      <option value="NONE">(Sin Canto)</option>
                      {dbCantos.map((c: CantoRecord) => (
                        <option key={c.codigo} value={c.codigo}>
                          {c.descripcion} ({formatUnitCustom(c.costoMlCop, c.costoMlUsd)}/ml)
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* METROS LINEALES DE CANTO POR PIEZA */}
                  <td className="p-2.5 text-center font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50/20 dark:bg-blue-950/10">
                    {p.metrosCanto > 0 ? `${p.metrosCanto} m` : "-"}
                  </td>

                  {/* COSTO TOTAL PIEZA TABLERO CON DESPERDICIO */}
                  <td className="p-2.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10">
                    {formatMoneyCustom(p.costoTotalCop, p.costoTotalUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Fila de Total de Madera */}
            <tfoot>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-600 font-bold whitespace-nowrap">
                <td colSpan={5} className="p-2.5 text-right text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  Total Tableros & Madera:
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                  {resumenMadera.areaTotalM2} m²
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                  {resumenMadera.items.reduce((acc: number, i: any) => acc + i.cantidad, 0)} u
                </td>
                <td colSpan={2} className="p-2.5 text-center text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold">
                  Desp. Base: {desperdicioGlobalPct}%
                </td>
                <td colSpan={2} className="p-2.5 text-right font-mono text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                  Total Canto:
                </td>
                <td className="p-2.5 text-center font-mono font-extrabold text-blue-700 dark:text-blue-300 text-xs">
                  {resumenCantos.cantTotalMetros} ml
                </td>
                <td className="p-2.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-300 text-sm bg-emerald-50/50 dark:bg-emerald-950/20">
                  {formatMoneyCustom(resumenMadera.costoTotalMaderaCop, resumenMadera.costoTotalMaderaUsd)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🔩 TABLA 2: INVENTARIO DE HERRAJES                                    */}
      {/* ===================================================================== */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
            <Hammer className="w-4 h-4 text-cyan-600" />
            2. Inventario de Herrajes & Accesorios (BOM)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Costos sincronizados desde Base de Datos</span>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                <th className="p-2.5 w-36">Herraje (GHX)</th>
                <th className="p-2.5">Descripción Comercial</th>
                <th className="p-2.5 w-16 text-center">UM</th>
                <th className="p-2.5 w-20 text-center">Cantidad</th>
                <th className="p-2.5 w-28 text-right">Costo Unitario</th>
                <th className="p-2.5 w-28 text-right">Costo Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {resumenHerrajes.items.map((h: any, idx: number) => (
                <tr key={idx} className="hover:bg-cyan-50/40 dark:hover:bg-slate-800/50 transition whitespace-nowrap">
                  {/* Nombre GHX */}
                  <td className="p-2.5 font-bold text-cyan-700 dark:text-cyan-300 font-mono">
                    {h.nombreGhx}
                  </td>
                  {/* Descripción Comercial */}
                  <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                    {h.descripcion}
                  </td>
                  {/* Unidad de Medida */}
                  <td className="p-2.5 text-center font-mono text-[10px] text-slate-500">
                    {h.unidad}
                  </td>
                  {/* Cantidad */}
                  <td className="p-2.5 text-center font-mono font-extrabold text-slate-900 dark:text-slate-100">
                    <span className="px-2.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-200 font-mono">
                      {h.cantidad}
                    </span>
                  </td>
                  {/* Costo Unitario Nativo */}
                  <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                    {formatUnitCustom(h.costoUnitarioCop, h.costoUnitarioUsd)}
                  </td>
                  {/* Costo Total en Fila Nativo */}
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMoneyCustom(h.costoTotalCop, h.costoTotalUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Fila de Total de Herrajes */}
            <tfoot>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-600 font-bold whitespace-nowrap">
                <td colSpan={3} className="p-2.5 text-right text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  Total Herrajes & Accesorios:
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                  {resumenHerrajes.cantTotalHerrajes} u
                </td>
                <td className="p-2.5 text-right font-mono text-slate-400 text-[10px]">
                  Sumatoria:
                </td>
                <td className="p-2.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
                  {formatMoneyCustom(resumenHerrajes.costoTotalHerrajesCop, resumenHerrajes.costoTotalHerrajesUsd)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🎗️ TABLA 3: INVENTARIO Y METROS LINEALES DE CANTOS (BOM)              */}
      {/* ===================================================================== */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
            <Ruler className="w-4 h-4 text-amber-600" />
            3. Inventario y Metros Lineales de Cantos (BOM)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Fórmula oficial: (+100 mm despunte por borde)</span>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                <th className="p-2.5 w-24">Código</th>
                <th className="p-2.5">Descripción Canto</th>
                <th className="p-2.5 w-20 text-center">Tipo</th>
                <th className="p-2.5 w-24 text-center">Calibre / Ancho</th>
                <th className="p-2.5 w-20 text-center">Piezas</th>
                <th className="p-2.5 w-32 text-center bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-bold">
                  Metros (+100mm)
                </th>
                <th className="p-2.5 w-28 text-right">Costo / ml</th>
                <th className="p-2.5 w-28 text-right">Costo Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {resumenCantos.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-400 font-mono text-[11px]">
                    No se han asignado cantos a las piezas de este mueble.
                  </td>
                </tr>
              ) : (
                resumenCantos.items.map((c: any) => (
                  <tr key={c.codigo} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/50 transition whitespace-nowrap">
                    <td className="p-2.5 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      {c.codigo}
                    </td>
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                      {c.descripcion}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.tipo === "Rígido 2mm" 
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300" 
                          : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      }`}>
                        {c.tipo}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">
                      {c.anchoMm} mm × {c.espesorMm} mm
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {c.piezasAsociadas} u
                    </td>
                    <td className="p-2.5 text-center font-mono font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50/30 dark:bg-amber-950/20 text-xs">
                      {c.metrosLineales} ml
                    </td>
                    <td className="p-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatUnitCustom(c.costoMlCop, c.costoMlUsd)}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoneyCustom(c.costoTotalCop, c.costoTotalUsd)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Fila de Total de Cantos */}
            <tfoot>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-600 font-bold whitespace-nowrap">
                <td colSpan={5} className="p-2.5 text-right text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  Total Metros Lineales & Cantos:
                </td>
                <td className="p-2.5 text-center font-mono font-extrabold text-amber-700 dark:text-amber-300 text-xs bg-amber-50/50 dark:bg-amber-950/30">
                  {resumenCantos.cantTotalMetros} ml
                </td>
                <td className="p-2.5 text-right font-mono text-slate-400 text-[10px]">
                  Sumatoria:
                </td>
                <td className="p-2.5 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
                  {formatMoneyCustom(resumenCantos.costoTotalCantosCop, resumenCantos.costoTotalCantosUsd)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🏭 TABLA 4: FICHA CONSOLIDADA FINANCIERA (100% COSTO INDUSTRIAL)       */}
      {/* ===================================================================== */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap justify-between items-center gap-1">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              4. Resumen de Costo Industrial Consolidado (100.00% Ficha Técnica)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono font-bold px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              Absorción Estándar ERP
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              MP ({resumenIndustrial.pctMpTotalReal}%) + MO ({resumenIndustrial.pctMo}%) + CIF ({resumenIndustrial.pctCif}%)
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                <th className="p-2.5 w-12 text-center">#</th>
                <th className="p-2.5">Componente del Costo</th>
                <th className="p-2.5 w-44 text-center">Categoría de Costo</th>
                <th className="p-2.5 w-40 text-right">Valor Total ({moneda})</th>
                <th className="p-2.5 w-32 text-center bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-extrabold">
                  % Impacto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {/* 1. Láminas */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                <td className="p-2 text-center font-mono font-bold text-slate-500">1</td>
                <td className="p-2 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-600" />
                  Láminas & Tableros (MDP / MDF)
                </td>
                <td className="p-2 text-center text-slate-500 text-[11px]">Material Directo</td>
                <td className="p-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formatMoneyCustom(resumenIndustrial.laminaCop, resumenIndustrial.laminaUsd)}
                </td>
                <td className="p-2 text-center font-mono font-extrabold text-cyan-700 dark:text-cyan-300 bg-cyan-50/30 dark:bg-cyan-950/20">
                  {resumenIndustrial.pctLaminaReal}%
                </td>
              </tr>

              {/* 2. Fondos */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                <td className="p-2 text-center font-mono font-bold text-slate-500">2</td>
                <td className="p-2 font-medium text-slate-700 dark:text-slate-300 pl-7">
                  Fondos (MDF 2.7mm - 3mm)
                </td>
                <td className="p-2 text-center text-slate-500 text-[11px]">Material Directo</td>
                <td className="p-2 text-right font-mono text-slate-500">
                  {formatMoneyCustom(resumenIndustrial.fondosCop, resumenIndustrial.fondosUsd)}
                </td>
                <td className="p-2 text-center font-mono font-bold text-slate-400">
                  {resumenIndustrial.pctFondosReal}%
                </td>
              </tr>

              {/* 3. Cantos */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                <td className="p-2 text-center font-mono font-bold text-slate-500">3</td>
                <td className="p-2 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-amber-600" />
                  Cantos PVC (Flexible & Rígido)
                </td>
                <td className="p-2 text-center text-slate-500 text-[11px]">Material Directo</td>
                <td className="p-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formatMoneyCustom(resumenIndustrial.cantoCop, resumenIndustrial.cantoUsd)}
                </td>
                <td className="p-2 text-center font-mono font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50/30 dark:bg-amber-950/20">
                  {resumenIndustrial.pctCantoReal}%
                </td>
              </tr>

              {/* 4. Empaque */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                <td className="p-2 text-center font-mono font-bold text-slate-500">4</td>
                <td className="p-2 font-medium text-slate-700 dark:text-slate-300 pl-7">
                  Material de Empaque (Cajas / Cartón Panal)
                </td>
                <td className="p-2 text-center text-slate-500 text-[11px]">Material Directo</td>
                <td className="p-2 text-right font-mono text-slate-500">
                  {formatMoneyCustom(resumenIndustrial.empaqueCop, resumenIndustrial.empaqueUsd)}
                </td>
                <td className="p-2 text-center font-mono font-bold text-slate-400">
                  {resumenIndustrial.pctEmpaqueReal}%
                </td>
              </tr>

              {/* 5. Herrajes */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                <td className="p-2 text-center font-mono font-bold text-slate-500">5</td>
                <td className="p-2 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Hammer className="w-3.5 h-3.5 text-blue-600" />
                  Herrajes & Accesorios de Ensamble
                </td>
                <td className="p-2 text-center text-slate-500 text-[11px]">Material Directo</td>
                <td className="p-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formatMoneyCustom(resumenIndustrial.herrajesCop, resumenIndustrial.herrajesUsd)}
                </td>
                <td className="p-2 text-center font-mono font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-950/20">
                  {resumenIndustrial.pctHerrajesReal}%
                </td>
              </tr>

              {/* 6. Adicionales */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                <td className="p-2 text-center font-mono font-bold text-slate-500">6</td>
                <td className="p-2 font-medium text-slate-700 dark:text-slate-300 pl-7">
                  Adicionales & Consumibles (Estándar 0.40%)
                </td>
                <td className="p-2 text-center text-slate-500 text-[11px]">Material Directo</td>
                <td className="p-2 text-right font-mono text-slate-600 dark:text-slate-400">
                  {formatMoneyCustom(resumenIndustrial.adicionalesCop, resumenIndustrial.adicionalesUsd)}
                </td>
                <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                  {resumenIndustrial.pctAdicionalesReal}%
                </td>
              </tr>

              {/* Subtotal MP Directa */}
              <tr className="bg-emerald-50/60 dark:bg-emerald-950/30 border-y border-emerald-200 dark:border-emerald-800/60 font-bold">
                <td colSpan={3} className="p-2 text-right text-emerald-900 dark:text-emerald-300 uppercase tracking-wider text-[11px]">
                  Subtotal Materia Prima Directa (MP):
                </td>
                <td className="p-2 text-right font-mono font-extrabold text-emerald-800 dark:text-emerald-200 text-xs">
                  {formatMoneyCustom(resumenIndustrial.totalMpCop, resumenIndustrial.totalMpUsd)}
                </td>
                <td className="p-2 text-center font-mono font-extrabold text-emerald-800 dark:text-emerald-200 bg-emerald-100/60 dark:bg-emerald-900/40 text-xs">
                  {resumenIndustrial.pctMpTotalReal}%
                </td>
              </tr>

              {/* 7. Tercerizaciones */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                <td className="p-2 text-center font-mono font-bold text-slate-500">7</td>
                <td className="p-2 font-medium text-slate-700 dark:text-slate-300 pl-7">
                  Tercerizaciones & Maquilas Externas
                </td>
                <td className="p-2 text-center text-slate-500 text-[11px]">Servicio Externo</td>
                <td className="p-2 text-right font-mono text-slate-500">
                  {formatMoneyCustom(resumenIndustrial.tercerizacionesCop, resumenIndustrial.tercerizacionesUsd)}
                </td>
                <td className="p-2 text-center font-mono font-bold text-slate-400">
                  {resumenIndustrial.pctTercerizacionesReal}%
                </td>
              </tr>

              {/* 8. Mano de Obra Directa + Prestaciones */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition bg-cyan-50/20 dark:bg-cyan-950/10">
                <td className="p-2 text-center font-mono font-bold text-slate-500">8</td>
                <td className="p-2 font-bold text-cyan-900 dark:text-cyan-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"></span>
                  Mano de Obra Directa + Prestaciones (MO+PRES)
                </td>
                <td className="p-2 text-center text-cyan-700 dark:text-cyan-400 text-[11px] font-semibold">
                  Costo de Conversión
                </td>
                <td className="p-2 text-right font-mono font-extrabold text-cyan-800 dark:text-cyan-200">
                  {formatMoneyCustom(resumenIndustrial.moPresCop, resumenIndustrial.moPresUsd)}
                </td>
                <td className="p-2 text-center font-mono font-extrabold text-cyan-800 dark:text-cyan-200 bg-cyan-100/50 dark:bg-cyan-900/30 text-xs">
                  {resumenIndustrial.pctMo}%
                </td>
              </tr>

              {/* 9. CIF */}
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition bg-purple-50/20 dark:bg-purple-950/10">
                <td className="p-2 text-center font-mono font-bold text-slate-500">9</td>
                <td className="p-2 font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                  Costos Indirectos de Fabricación (CIF)
                </td>
                <td className="p-2 text-center text-purple-700 dark:text-purple-400 text-[11px] font-semibold">
                  Planta & Depreciación
                </td>
                <td className="p-2 text-right font-mono font-extrabold text-purple-800 dark:text-purple-200">
                  {formatMoneyCustom(resumenIndustrial.cifCop, resumenIndustrial.cifUsd)}
                </td>
                <td className="p-2 text-center font-mono font-extrabold text-purple-800 dark:text-purple-200 bg-purple-100/50 dark:bg-purple-900/30 text-xs">
                  {resumenIndustrial.pctCif}%
                </td>
              </tr>
            </tbody>

            {/* Fila Gran Total 100% */}
            <tfoot>
              <tr className="bg-slate-900 text-white border-t-2 border-amber-500 font-bold whitespace-nowrap">
                <td colSpan={3} className="p-3 text-right text-amber-400 uppercase text-xs tracking-wider">
                  🏆 COSTO TOTAL DEL PRODUCTO (100%):
                </td>
                <td className="p-3 text-right font-mono font-extrabold text-white text-base">
                  {formatMoneyCustom(resumenIndustrial.costoTotalFabCop, resumenIndustrial.costoTotalFabUsd)}
                </td>
                <td className="p-3 text-center font-mono font-extrabold text-amber-400 text-sm bg-slate-950">
                  100.00%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 📦 RESUMEN GENERAL & ACCIONES DE GUARDADO SUPABASE                    */}
      {/* ===================================================================== */}
      <div className="p-3.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-600" />
            <span className="font-extrabold text-slate-800 dark:text-slate-100">
              Resumen Consolidado de Fabricación
            </span>
          </div>
          <div className="text-right flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 font-mono">
              MP ({formatMoneyCustom(resumenIndustrial.totalMpCop, resumenIndustrial.totalMpUsd)}) + 
              MO ({formatMoneyCustom(resumenIndustrial.moPresCop, resumenIndustrial.moPresUsd)}) + 
              CIF ({formatMoneyCustom(resumenIndustrial.cifCop, resumenIndustrial.cifUsd)})
            </span>
            <span className="font-mono font-extrabold text-base text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
              {formatMoneyCustom(resumenIndustrial.costoTotalFabCop, resumenIndustrial.costoTotalFabUsd)}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={guardarEnSupabase}
            disabled={guardando}
            className={`py-2.5 px-4 rounded-lg font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
              guardadoExitoso
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 hover:bg-slate-900 text-white dark:bg-cyan-700 dark:hover:bg-cyan-600"
            }`}
          >
            {guardadoExitoso ? (
              <>
                <Check className="w-4 h-4 text-white" />
                ¡Ficha {versionActual} Guardada en Supabase!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {guardando ? "Guardando..." : `Guardar Ficha ${versionActual} en Supabase`}
              </>
            )}
          </button>

          <button
            onClick={descargarDXF}
            disabled={descargando}
            className="py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 active:scale-[0.99] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {descargando ? "Generando DXF..." : "Exportar DXF para Seccionadora CNC"}
          </button>
        </div>
      </div>
    </div>
  );
}

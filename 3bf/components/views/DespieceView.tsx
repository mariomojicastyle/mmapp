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
  Maximize2,
  Database,
  FileCode2,
  Zap,
  Trash2
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
  placeholder = "0",
  style,
}: {
  value: number;
  onChange: (val: number) => void;
  decimals?: number;
  className?: string;
  placeholder?: string;
  style?: React.CSSProperties;
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
      style={style}
    />
  );
}

// Trigonometría vectorial para Donut Chart SVG
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
  const deltaAngle = Math.min(Math.max(endAngle - startAngle, 0.05), 359.99);
  const adjustedEndAngle = startAngle + deltaAngle;
  
  const startOuter = polarToCartesian(x, y, rOuter, adjustedEndAngle);
  const endOuter = polarToCartesian(x, y, rOuter, startAngle);
  const startInner = polarToCartesian(x, y, rInner, startAngle);
  const endInner = polarToCartesian(x, y, rInner, adjustedEndAngle);
  
  const largeArcFlag = deltaAngle <= 180 ? "0" : "1";
  
  return [
    "M", startOuter.x, startOuter.y,
    "A", rOuter, rOuter, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    "L", startInner.x, startInner.y,
    "A", rInner, rInner, 0, largeArcFlag, 1, endInner.x, endInner.y,
    "Z"
  ].join(" ");
}

export default function DespieceView() {
  const { 
    resultado, 
    parametros,
    instancias,
    getDespieceGlobal,
    getHerrajesGlobal,
    dbHerrajes,
    dbTableros,
    dbCantos,
    costosConversion,
    fichasConfig,
    setFichaConfig,
    getFichaConfig,
    renombrarInstancia,
    negociacionNovopan,
    moneda,
    setMoneda,
    setModalGuardarComoAbierto,
    setMostrarNPanel,
    setPestanaNPanel,
    hidratarDesdeLocalStorage,
    coloresApariencia,
    mecanizadosCruzados,
    mecanizadoEnProgreso,
    ultimoResumenMecanizado,
    perforarMueble,
    limpiarPerforaciones,
  } = use3BFStore();

  const trm = negociacionNovopan?.trmNovopan || 4000;

  const [descargando, setDescargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const modelKey = parametros.model_id || parametros.custom_filename || "Cubierta";

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Leer configuración inicial directamente del Store de Zustand / localStorage
  const fichaInicial = getFichaConfig(modelKey);
  const [versionActual, setVersionActual] = useState(
    fichaInicial.versionActual && !fichaInicial.versionActual.startsWith("v") 
      ? fichaInicial.versionActual 
      : "BD 1.0"
  );
  const [piezasEditadas, setPiezasEditadas] = useState<Array<{ nombre: string; largo: number; ancho: number; espesor: number; cantidad: number; tipo?: string }>>([]);
  const [descripcionesPersonalizadas, setDescripcionesPersonalizadas] = useState<Record<number, string>>((fichaInicial as any).descripcionesPersonalizadas || {});
  const [materialesPorPieza, setMaterialesPorPieza] = useState<Record<number, string>>(fichaInicial.materialesPorPieza || {});
  const [desperdicioGlobalPct, setDesperdicioGlobalPct] = useState<number>(fichaInicial.desperdicioGlobalPct ?? 10.0);
  const [despunteCantoGlobalMm, setDespunteCantoGlobalMm] = useState<number>(fichaInicial.despunteCantoGlobalMm ?? 100);
  const [desperdicioPorPieza, setDesperdicioPorPieza] = useState<Record<number, number>>(fichaInicial.desperdicioPorPieza || {});
  
  // Configuración de cantos por pieza (A = cantos en ancho, L = cantos en largo, cantoCodigo)
  const [cantosPorPieza, setCantosPorPieza] = useState<Record<number, {
    cantosAncho: number;
    cantosLargo: number;
    cantoCodigo?: string;
  }>>(fichaInicial.cantosPorPieza || {});

  // Costo manual de empaque (Fase transicional previa al módulo dedicado de empaque)
  const [costoEmpaqueManualCop, setCostoEmpaqueManualCop] = useState<number | undefined>(fichaInicial.costoEmpaqueManualCop);
  const [costoEmpaqueManualUsd, setCostoEmpaqueManualUsd] = useState<number | undefined>(fichaInicial.costoEmpaqueManualUsd);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDescIndex, setEditingDescIndex] = useState<number | null>(null);

  useEffect(() => {
    hidratarDesdeLocalStorage();
  }, []);

  // Sincronizar reactivamente si cambia de modelo
  useEffect(() => {
    const config = getFichaConfig(modelKey);
    setDesperdicioGlobalPct(config.desperdicioGlobalPct ?? 10.0);
    setDespunteCantoGlobalMm(config.despunteCantoGlobalMm ?? 100);
    setDesperdicioPorPieza(config.desperdicioPorPieza || {});
    setDescripcionesPersonalizadas((config as any).descripcionesPersonalizadas || {});
    setMaterialesPorPieza(config.materialesPorPieza || {});
    setCantosPorPieza(config.cantosPorPieza || {});
    setVersionActual(config.versionActual || "v1.0");
    setCostoEmpaqueManualCop(config.costoEmpaqueManualCop ?? 0);
    setCostoEmpaqueManualUsd(config.costoEmpaqueManualUsd ?? 0);
  }, [modelKey]);

  // Estado para la gráfica analítica de distribución de costos
  const [chartMode, setChartMode] = useState<"macro" | "detalle">("detalle");
  const [hoveredCostKey, setHoveredCostKey] = useState<string | null>(null);

  const handleEmpaqueChange = (val: number) => {
    if (moneda === "COP") {
      setCostoEmpaqueManualCop(val);
      setCostoEmpaqueManualUsd(Number((val / trm).toFixed(2)));
      sincronizarCambios({ costoEmpaqueManualCop: val, costoEmpaqueManualUsd: Number((val / trm).toFixed(2)) });
    } else {
      const usd = val;
      const cop = Math.round(usd * trm);
      setCostoEmpaqueManualCop(cop);
      setCostoEmpaqueManualUsd(usd);
      sincronizarCambios({ costoEmpaqueManualCop: cop, costoEmpaqueManualUsd: usd });
    }
  };

  // Persistir reactivamente cada cambio en Zustand y LocalStorage
  const sincronizarCambios = (cambios: Partial<typeof fichaInicial>) => {
    setFichaConfig(modelKey, cambios);
  };

  const piezasGlobales = useMemo(() => {
    const list = getDespieceGlobal();
    if (list.length > 0) return list;
    return resultado?.despiece || [];
  }, [instancias, resultado?.despiece, getDespieceGlobal]);

  useEffect(() => {
    if (piezasGlobales && piezasGlobales.length > 0) {
      setPiezasEditadas(piezasGlobales);
    }
  }, [piezasGlobales]);

  // Piezas activas garantizadas 1:1 con el cómputo 3D de todas las instancias en tiempo real
  const piezasActivas = useMemo(() => {
    if (editingIndex !== null && piezasEditadas.length === piezasGlobales.length) {
      return piezasEditadas;
    }
    return piezasGlobales || [];
  }, [piezasGlobales, piezasEditadas, editingIndex]);

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
      
      const obtenerValorBorde = (tipo: "izquierdo" | "derecho") => {
        const claves = tipo === "izquierdo"
          ? [
              "RH_IN:03.4 Borde izquierdo",
              "RH_IN:Borde izquierdo",
              "borde_izquierdo",
              "03.4_borde_izquierdo"
            ]
          : [
              "RH_IN:03.3 Borde derecho",
              "RH_IN:Borde derecho",
              "borde_derecho",
              "03.3_borde_derecho"
            ];

        // 1. Prioridad: Buscar valores explícitamente definidos en las claves exactas
        for (const clave of claves) {
          const val = p[clave];
          if (val !== undefined && val !== null && String(val).trim() !== "") {
            return String(val);
          }
        }

        // 2. Buscar cualquier propiedad en el objeto que coincida
        for (const [k, v] of Object.entries(p)) {
          const kl = k.toLowerCase();
          if (kl.includes("borde") && (tipo === "izquierdo" ? (kl.includes("izquierdo") || kl.includes("izq")) : (kl.includes("derecho") || kl.includes("der")))) {
            if (v !== undefined && v !== null && String(v).trim() !== "") {
              return String(v);
            }
          }
        }

        // 3. Revisar en los límites por defecto del resultado de Grasshopper
        const limits = (resultado as any)?.slider_limits || {};
        for (const clave of claves) {
          if (limits[clave]?.default !== undefined) {
            return String(limits[clave].default);
          }
        }

        return "MDP";
      };

      const valIzq = obtenerValorBorde("izquierdo").toLowerCase();
      const valDer = obtenerValorBorde("derecho").toLowerCase();

      // En Grasshopper / UI: 'Canto' = Lleva Canto (1), 'MDP' = Sin Canto (0)
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

  // Obtener la configuración activa de cantos para una pieza (Leída 100% automáticamente del 3D)
  const getCantoPieza = (idx: number, nombre: string, espesor: number) => {
    const config3D = getCantoConfigDefecto(nombre, espesor, parametros);
    // El material de canto asignado por el usuario o el detectado por defecto
    const materialAsignado = cantosPorPieza[idx]?.cantoCodigo || config3D.cantoCodigo;

    return {
      cantosAncho: config3D.cantosAncho,
      cantosLargo: config3D.cantosLargo,
      cantoCodigo: materialAsignado
    };
  };

  const handleMaterialCantoChange = (idx: number, nuevoCodigoCanto: string) => {
    setCantosPorPieza((prev) => {
      const updated = {
        ...prev,
        [idx]: {
          ...(prev[idx] || {}),
          cantoCodigo: nuevoCodigoCanto
        }
      };
      sincronizarCambios({ cantosPorPieza: updated });
      return updated;
    });
  };

  const handleCambiarCantoEnTabla3 = (codigoViejo: string, nuevoCodigoCanto: string) => {
    setCantosPorPieza((prev) => {
      const updated = { ...prev };
      piezasActivas.forEach((p: any, idx: number) => {
        const cConfig = getCantoPieza(idx, p.nombre, p.espesor);
        if (!codigoViejo || cConfig.cantoCodigo === codigoViejo) {
          updated[idx] = {
            ...(updated[idx] || {}),
            cantosAncho: cConfig.cantosAncho,
            cantosLargo: cConfig.cantosLargo,
            cantoCodigo: nuevoCodigoCanto
          };
        }
      });
      sincronizarCambios({ cantosPorPieza: updated });
      return updated;
    });
  };

  const handleDesperdicioGlobalChange = (val: number) => {
    setDesperdicioGlobalPct(val);
    setDesperdicioPorPieza({});
    sincronizarCambios({ desperdicioGlobalPct: val, desperdicioPorPieza: {} });
  };

  const handleDespunteCantoGlobalChange = (val: number) => {
    setDespunteCantoGlobalMm(val);
    sincronizarCambios({ despunteCantoGlobalMm: val });
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

      // Nombre de descripción oficial asignado por el diseñador
      const descOficial = descripcionesPersonalizadas[idx] || p.descripcion || p.instanciaNombre || p.nombre;

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
      
      // Fórmula oficial de fábrica Excel EDP (+despunte técnico por borde para canteadora):
      // Metros = [((Ancho + despunte) * A + (Largo + despunte) * L) / 1000] * Cantidad
      let metrosCantoPieza = 0;
      if (cantoMat && (cConfig.cantosAncho > 0 || cConfig.cantosLargo > 0)) {
        metrosCantoPieza = Number(((((p.ancho + despunteCantoGlobalMm) * cConfig.cantosAncho + (p.largo + despunteCantoGlobalMm) * cConfig.cantosLargo) / 1000.0) * p.cantidad).toFixed(2));
      }

      return {
        ...p,
        descripcionOficial: descOficial,
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
  }, [piezasActivas, descripcionesPersonalizadas, materialesPorPieza, dbTableros, dbCantos, trm, desperdicioGlobalPct, despunteCantoGlobalMm, desperdicioPorPieza, cantosPorPieza, parametros]);

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

  const herrajesGlobales = useMemo(() => {
    const list = getHerrajesGlobal();
    if (list.length > 0) return list;
    return resultado?.herrajes || [];
  }, [instancias, resultado?.herrajes, getHerrajesGlobal]);

  // Cálculos Consolidados de Herrajes Globales (Unificación total de herrajes idénticos del escenario)
  const resumenHerrajes = useMemo(() => {
    if (!herrajesGlobales || herrajesGlobales.length === 0) {
      return {
        items: [],
        costoTotalHerrajesCop: 0,
        costoTotalHerrajesUsd: 0,
        cantTotalHerrajes: 0
      };
    }

    let totalCop = 0;
    let totalUsd = 0;
    let totalCant = 0;

    // Consolidación de herrajes agrupando por código/tipo único
    const mapaHerrajes = new Map<string, {
      nombreGhx: string;
      descripcion: string;
      unidad: string;
      cantidad: number;
      costoUnitarioCop: number;
      costoUnitarioUsd: number;
    }>();

    herrajesGlobales.forEach((h: any) => {
      const nameClean = (h.nombre || "").trim();
      const nameLower = nameClean.toLowerCase();
      
      // Match en dbHerrajes
      let match = dbHerrajes.find((rec: HerrajeRecord) => rec.nombreGhx.toLowerCase().trim() === nameLower);
      if (!match) {
        match = dbHerrajes.find((rec: HerrajeRecord) => nameLower.includes(rec.nombreGhx.toLowerCase().trim()) || rec.nombreGhx.toLowerCase().trim().includes(nameLower));
      }

      const key = match ? match.codigo : nameLower;
      const descComercial = match ? match.descripcion : nameClean;
      const unidadMed = match ? match.unidad : (h.unidad || "UND");
      
      // Costos unitarios exactos
      const unitCop = match ? match.costoCop : Math.round(0.20 * trm);
      const unitUsd = match ? match.costoUsd : 0.20;
      const cant = Number(h.cantidad) || 0;

      if (!mapaHerrajes.has(key)) {
        mapaHerrajes.set(key, {
          nombreGhx: nameClean,
          descripcion: descComercial,
          unidad: unidadMed,
          cantidad: cant,
          costoUnitarioCop: unitCop,
          costoUnitarioUsd: unitUsd,
        });
      } else {
        const exist = mapaHerrajes.get(key)!;
        exist.cantidad += cant;
      }
    });

    const items = Array.from(mapaHerrajes.values()).map((item) => {
      const filaCop = item.cantidad * item.costoUnitarioCop;
      const filaUsd = item.cantidad * item.costoUnitarioUsd;

      totalCop += filaCop;
      totalUsd += filaUsd;
      totalCant += item.cantidad;

      return {
        ...item,
        costoTotalCop: filaCop,
        costoTotalUsd: Number(filaUsd.toFixed(2)),
      };
    });

    return {
      items,
      costoTotalHerrajesCop: Math.round(totalCop),
      costoTotalHerrajesUsd: Number(totalUsd.toFixed(2)),
      cantTotalHerrajes: totalCant
    };
  }, [herrajesGlobales, dbHerrajes, trm]);

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

    const empaqueCop = costoEmpaqueManualCop !== undefined && costoEmpaqueManualCop !== null
      ? costoEmpaqueManualCop 
      : (costosConversion?.costoEmpaqueCop || 0);
    const empaqueUsd = costoEmpaqueManualUsd !== undefined && costoEmpaqueManualUsd !== null && costoEmpaqueManualUsd > 0
      ? costoEmpaqueManualUsd
      : Number((empaqueCop / trm).toFixed(2));

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
  }, [resumenMadera, resumenCantos, resumenHerrajes, costosConversion, trm, costoEmpaqueManualCop, costoEmpaqueManualUsd]);

  // Listas de datos para la gráfica analítica de distribución de costos
  const macroCostItems = useMemo(() => [
    { id: "mp", nombre: "Materia Prima Directa (MP)", valorCop: resumenIndustrial.totalMpCop, valorUsd: resumenIndustrial.totalMpUsd, pct: resumenIndustrial.pctMpTotalReal, color: "#06B6D4" },
    { id: "mo", nombre: "Mano de Obra Directa (MO)", valorCop: resumenIndustrial.moPresCop, valorUsd: resumenIndustrial.moPresUsd, pct: resumenIndustrial.pctMo, color: "#10B981" },
    { id: "cif", nombre: "Costos Indirectos (CIF)", valorCop: resumenIndustrial.cifCop, valorUsd: resumenIndustrial.cifUsd, pct: resumenIndustrial.pctCif, color: "#F59E0B" },
  ], [resumenIndustrial]);

  const detalleCostItems = useMemo(() => [
    { id: "tableros", nombre: "Lista de tableros", valorCop: resumenIndustrial.laminaCop, valorUsd: resumenIndustrial.laminaUsd, pct: resumenIndustrial.pctLaminaReal, color: "#06B6D4" },
    { id: "fondos", nombre: "Fondos (MDF)", valorCop: resumenIndustrial.fondosCop, valorUsd: resumenIndustrial.fondosUsd, pct: resumenIndustrial.pctFondosReal, color: "#6366F1" },
    { id: "cantos", nombre: "Metros de canto", valorCop: resumenIndustrial.cantoCop, valorUsd: resumenIndustrial.cantoUsd, pct: resumenIndustrial.pctCantoReal, color: "#3B82F6" },
    { id: "empaque", nombre: "Material de Empaque", valorCop: resumenIndustrial.empaqueCop, valorUsd: resumenIndustrial.empaqueUsd, pct: resumenIndustrial.pctEmpaqueReal, color: "#A855F7" },
    { id: "herrajes", nombre: "Lista de herrajes", valorCop: resumenIndustrial.herrajesCop, valorUsd: resumenIndustrial.herrajesUsd, pct: resumenIndustrial.pctHerrajesReal, color: "#EC4899" },
    { id: "adicionales", nombre: "Adicionales / Consumibles", valorCop: resumenIndustrial.adicionalesCop, valorUsd: resumenIndustrial.adicionalesUsd, pct: resumenIndustrial.pctAdicionalesReal, color: "#94A3B8" },
    { id: "tercerizaciones", nombre: "Tercerizaciones", valorCop: resumenIndustrial.tercerizacionesCop, valorUsd: resumenIndustrial.tercerizacionesUsd, pct: resumenIndustrial.pctTercerizacionesReal, color: "#64748B" },
    { id: "mo", nombre: "Mano de Obra (MO)", valorCop: resumenIndustrial.moPresCop, valorUsd: resumenIndustrial.moPresUsd, pct: resumenIndustrial.pctMo, color: "#10B981" },
    { id: "cif", nombre: "Costos Indirectos (CIF)", valorCop: resumenIndustrial.cifCop, valorUsd: resumenIndustrial.cifUsd, pct: resumenIndustrial.pctCif, color: "#F59E0B" },
  ], [resumenIndustrial]);

  const activeChartItems = chartMode === "macro" ? macroCostItems : detalleCostItems;

  const chartSlices = useMemo(() => {
    const itemsConValor = activeChartItems.filter((i) => i.pct > 0);
    const sumPct = itemsConValor.reduce((acc, i) => acc + i.pct, 0) || 100;
    let currentAngle = 0;
    return itemsConValor.map((item) => {
      const sliceAngle = (item.pct / sumPct) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;
      return {
        ...item,
        startAngle,
        endAngle,
      };
    });
  }, [activeChartItems]);

  const activeHoveredItem = useMemo(() => {
    if (!hoveredCostKey) return null;
    return activeChartItems.find((i) => i.id === hoveredCostKey) || null;
  }, [hoveredCostKey, activeChartItems]);

  // Costo Total Consolidado del Producto (100% Fabricación: MP + MO + CIF)
  const costoTotalMuebleCop = resumenIndustrial.costoTotalFabCop;
  const costoTotalMuebleUsd = resumenIndustrial.costoTotalFabUsd;

  if (!resultado && Object.keys(instancias || {}).length === 0 && piezasActivas.length === 0) {
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

  const handleDescripcionChange = (idx: number, nuevaDesc: string) => {
    setDescripcionesPersonalizadas((prev) => {
      const updated = { ...prev, [idx]: nuevaDesc };
      sincronizarCambios({ descripcionesPersonalizadas: updated });
      return updated;
    });

    // Si la pieza proviene de una instancia del escenario, actualizar su nombre oficial en el store
    const pieza = piezasActivas[idx];
    if (pieza && (pieza as any).instanciaId) {
      renombrarInstancia((pieza as any).instanciaId, nuevaDesc);
    }
  };

  const guardarEnSupabase = async () => {
    setGuardando(true);
    setGuardadoExitoso(false);
    try {
      // 1. Sincronizar estado completo en el Store Global de Zustand y en LocalStorage
      sincronizarCambios({
        desperdicioGlobalPct,
        despunteCantoGlobalMm,
        desperdicioPorPieza,
        descripcionesPersonalizadas,
        materialesPorPieza,
        cantosPorPieza,
        versionActual,
        costoEmpaqueManualCop,
        costoEmpaqueManualUsd,
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
        despunte_canto_global_mm: despunteCantoGlobalMm,
        costo_empaque_manual_cop: costoEmpaqueManualCop,
        costo_empaque_manual_usd: costoEmpaqueManualUsd,
        despiece: resumenMadera.items.map((i: any) => ({
          nombre: i.nombre,
          descripcion: i.descripcionOficial || i.nombre,
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
          costo_empaque_cop: resumenIndustrial.empaqueCop,
          costo_empaque_usd: resumenIndustrial.empaqueUsd,
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
        despunteCantoGlobalMm,
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

  const descargarDXFPieza = async (pieza: any, idx?: number) => {
    try {
      const piezaNombre = pieza.descripcion || pieza.nombre || `Pieza_${(idx ?? 0) + 1}`;
      const instanciaId = (pieza as any).instanciaId;

      // Filtrar los mecanizados cruzados correspondientes a esta pieza
      let mecanizadosParaPieza: any[] = [];
      if (instanciaId && mecanizadosCruzados[instanciaId]) {
        mecanizadosParaPieza = mecanizadosCruzados[instanciaId];
      } else if (mecanizadosCruzados[piezaNombre]) {
        mecanizadosParaPieza = mecanizadosCruzados[piezaNombre];
      } else {
        const todos = Object.values(mecanizadosCruzados || {}).flat();
        mecanizadosParaPieza = todos.filter((m: any) => 
          m.tablero_destino?.toLowerCase() === piezaNombre.toLowerCase() ||
          m.origen_instancia_id === instanciaId
        );
        if (mecanizadosParaPieza.length === 0 && Object.keys(mecanizadosCruzados || {}).length > 0) {
          mecanizadosParaPieza = todos;
        }
      }

      // Obtener los parámetros reales y perforaciones OpenNURBS de la instancia
      const inst = instanciaId ? instancias[instanciaId] : null;
      const paramsPieza = inst?.parametros || parametros;
      const perfsNurbsPieza = inst?.resultado?.perforaciones_nurbs || resultado?.perforaciones_nurbs || [];

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model_id: piezaNombre, 
          parameters: paramsPieza,
          pieza: {
            nombre: pieza.nombre || "Cubierta",
            descripcion: piezaNombre,
            largo: pieza.largo,
            ancho: pieza.ancho,
            espesor: pieza.espesor,
            perforaciones_nurbs: perfsNurbsPieza,
          },
          perforaciones_nurbs: perfsNurbsPieza,
          version: versionActual,
          mecanizados_cruzados: mecanizadosParaPieza
        }),
      });
      const data = await res.json();
      if (data.dxf_content) {
        const blob = new Blob([data.dxf_content], { type: "application/dxf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || `${piezaNombre}_CAM_${versionActual}.dxf`;
        a.click();
      }
    } catch (e) {
      console.error(`Error al exportar DXF para ${pieza.descripcion || pieza.nombre}:`, e);
    }
  };

  const descargarDXF = async () => {
    setDescargando(true);
    try {
      if (piezasActivas && piezasActivas.length > 0) {
        for (let i = 0; i < piezasActivas.length; i++) {
          const p = piezasActivas[i];
          await descargarDXFPieza(p, i);
          // Breve pausa para que el navegador procese cada descarga limpiamente
          if (i < piezasActivas.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 350));
          }
        }
      } else {
        await descargarDXFPieza({
          nombre: parametros.model_id || "Cubierta",
          descripcion: parametros.model_id || "Cubierta",
          largo: Number((parametros as any)["RH_IN:01.1 Ancho"] ?? 498),
          ancho: Number((parametros as any)["RH_IN:01.2 Profundidad"] ?? 480),
          espesor: 15
        }, 0);
      }
    } catch (e) {
      console.error("Error al exportar DXF:", e);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div 
      style={{ 
        backgroundColor: coloresApariencia?.fondoPaneles, 
        borderColor: coloresApariencia?.bordePaneles,
        color: coloresApariencia?.textoPrincipal 
      }}
      className="w-full h-full glass-panel rounded-xl border flex flex-col overflow-y-auto no-scrollbar p-3.5 gap-3.5 text-xs transition-colors"
    >
      {/* Barra de Controles: Versión, Selector de Moneda, TRM y Botón de Guardado */}
      <div 
        style={{ 
          backgroundColor: coloresApariencia?.fondoPaneles, 
          borderColor: coloresApariencia?.bordePaneles 
        }}
        className="flex flex-wrap items-center justify-end p-2.5 rounded-lg border shadow-sm gap-2 transition-colors"
      >
        {/* Acciones de Cabecera: Guardar Mueble, Versión y Moneda */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Único Guardar (Abre el panel deslizante lateral de Biblioteca de Muebles) */}
          <button
            onClick={() => {
              setPestanaNPanel("muebles");
              setMostrarNPanel(true);
            }}
            style={{ 
              backgroundColor: coloresApariencia?.botonActivo || "#0891B2", 
              color: "#FFFFFF",
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-xs shadow-md transition cursor-pointer hover:opacity-90 active:scale-95 border border-transparent"
            title="Abrir Biblioteca de Muebles para guardar y organizar en carpetas"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>

          <div 
            style={{ backgroundColor: coloresApariencia?.bordePaneles }}
            className="h-4 w-px" 
          />

          {/* Selector de Versión */}
          <div className="flex items-center gap-1.5">
            <Tag style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5" />
            <span style={{ color: coloresApariencia?.textoSecundario }} className="font-medium text-[11px]">Versión:</span>
            <select
              value={versionActual}
              onChange={(e) => {
                setVersionActual(e.target.value);
                sincronizarCambios({ versionActual: e.target.value });
              }}
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion,
                borderColor: coloresApariencia?.bordePaneles,
                color: coloresApariencia?.botonActivo,
              }}
              className="text-xs font-bold py-1 px-2 rounded border outline-none cursor-pointer"
            >
              <option value="BD 1.0">BD 1.0</option>
              <option value="BD 1.1">BD 1.1</option>
              <option value="BD 2.0">BD 2.0</option>
            </select>
          </div>

          <div 
            style={{ backgroundColor: coloresApariencia?.bordePaneles }}
            className="h-4 w-px" 
          />

          {/* Selector de Moneda (USD / COP) */}
          <div 
            style={{ 
              backgroundColor: coloresApariencia?.fondoAplicacion,
              borderColor: coloresApariencia?.bordePaneles 
            }}
            className="flex items-center p-0.5 rounded-lg border"
          >
            <button
              onClick={() => setMoneda("USD")}
              style={moneda === "USD" ? {
                backgroundColor: coloresApariencia?.botonActivo,
                color: "#FFFFFF",
              } : {
                color: coloresApariencia?.textoSecundario,
              }}
              className="px-2.5 py-0.5 rounded-md font-bold text-[11px] transition cursor-pointer shadow-xs"
            >
              USD ($)
            </button>
            <button
              onClick={() => setMoneda("COP")}
              style={moneda === "COP" ? {
                backgroundColor: coloresApariencia?.botonActivo,
                color: "#FFFFFF",
              } : {
                color: coloresApariencia?.textoSecundario,
              }}
              className="px-2.5 py-0.5 rounded-md font-bold text-[11px] transition cursor-pointer shadow-xs"
            >
              COP ($)
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Económico DfMA (4 Tarjetas Consolidando Tableros, Herrajes, Cantos y Total) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div 
          style={{ 
            backgroundColor: coloresApariencia?.kpiTarjetaFondo || coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
          }}
          className="p-3 rounded-lg border shadow-sm text-center transition-colors"
        >
          <span 
            style={{ color: coloresApariencia?.textoSecundario }}
            className="text-[10px] uppercase block font-bold tracking-wider"
          >
            Superficie Tableros
          </span>
          <span 
            style={{ color: coloresApariencia?.botonActivo }}
            className="text-base font-extrabold font-mono"
          >
            {resumenMadera.areaTotalM2} m²
          </span>
        </div>
        <div 
          style={{ 
            backgroundColor: coloresApariencia?.kpiTarjetaFondo || coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
          }}
          className="p-3 rounded-lg border shadow-sm text-center transition-colors"
        >
          <span 
            style={{ color: coloresApariencia?.textoSecundario }}
            className="text-[10px] uppercase block font-bold tracking-wider"
          >
            Herrajes Totales
          </span>
          <span 
            style={{ color: coloresApariencia?.botonActivo }}
            className="text-base font-extrabold font-mono"
          >
            {resumenHerrajes.cantTotalHerrajes} u
          </span>
        </div>
        <div 
          style={{ 
            backgroundColor: coloresApariencia?.kpiTarjetaFondo || coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
          }}
          className="p-3 rounded-lg border shadow-sm text-center transition-colors"
        >
          <span 
            style={{ color: coloresApariencia?.textoSecundario }}
            className="text-[10px] uppercase block font-bold tracking-wider"
          >
            Metros Canto
          </span>
          <span 
            style={{ color: coloresApariencia?.botonActivo }}
            className="text-base font-extrabold font-mono"
          >
            {resumenCantos.cantTotalMetros} ml
          </span>
        </div>
        <div 
          style={{ 
            backgroundColor: coloresApariencia?.kpiTarjetaFondo || coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
          }}
          className="p-3 rounded-lg border shadow-sm text-center transition-colors"
        >
          <span 
            style={{ color: coloresApariencia?.textoSecundario }}
            className="text-[10px] uppercase block font-bold tracking-wider"
          >
            Costo Total Estimado
          </span>
          <span 
            style={{ color: coloresApariencia?.botonActivo }}
            className="text-base font-extrabold font-mono"
          >
            {formatMoneyCustom(costoTotalMuebleCop, costoTotalMuebleUsd)}
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🪵 TABLA 1: LISTA DE CORTE DE TABLEROS (BOM) CON CANTOS Y DESPERDICIO */}
      {/* ===================================================================== */}
      <div className="flex flex-col gap-2">
        <div 
          style={{ 
            backgroundColor: coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.bordePaneles 
          }}
          className="flex flex-wrap justify-between items-center p-2.5 rounded-lg border gap-2 shadow-sm transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers style={{ color: coloresApariencia?.botonActivo }} className="w-4 h-4" />
            <h3 style={{ color: coloresApariencia?.textoPrincipal }} className="text-xs font-bold">
              1. Lista de tableros
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Control Global de Desperdicio Nesting */}
            <div 
              style={{ 
                backgroundColor: coloresApariencia?.fondoAplicacion, 
                borderColor: coloresApariencia?.bordePaneles 
              }}
              className="flex items-center gap-2 border px-3 py-1 rounded-md shadow-xs transition-colors"
            >
              <span style={{ color: coloresApariencia?.textoPrincipal }} className="text-[11px] font-bold">
                % Desperdicio Global:
              </span>
              <div className="flex items-center gap-1">
                <DecimalInput
                  value={desperdicioGlobalPct}
                  decimals={1}
                  onChange={handleDesperdicioGlobalChange}
                  style={{
                    backgroundColor: coloresApariencia?.fondoPaneles,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal,
                  }}
                  className="w-12 text-center font-mono font-extrabold text-xs border rounded px-1 py-0.5 outline-none shadow-xs"
                />
                <span style={{ color: coloresApariencia?.textoSecundario }} className="font-mono font-bold text-xs">%</span>
              </div>
            </div>

            {/* Control Global de Despunte Técnico de Cantos */}
            <div 
              style={{ 
                backgroundColor: coloresApariencia?.fondoAplicacion, 
                borderColor: coloresApariencia?.bordePaneles 
              }}
              className="flex items-center gap-2 border px-3 py-1 rounded-md shadow-xs transition-colors"
              title="Despunte técnico por borde para canteadora en milímetros (Estándar de fábrica: 100 mm = 10 cm)"
            >
              <span style={{ color: coloresApariencia?.textoPrincipal }} className="text-[11px] font-bold">
                Despunte Canto:
              </span>
              <div className="flex items-center gap-1">
                <DecimalInput
                  value={despunteCantoGlobalMm}
                  decimals={0}
                  onChange={handleDespunteCantoGlobalChange}
                  style={{
                    backgroundColor: coloresApariencia?.fondoPaneles,
                    borderColor: coloresApariencia?.bordePaneles,
                    color: coloresApariencia?.textoPrincipal,
                  }}
                  className="w-14 text-center font-mono font-extrabold text-xs border rounded px-1 py-0.5 outline-none shadow-xs"
                />
                <span style={{ color: coloresApariencia?.textoSecundario }} className="font-mono font-bold text-xs">mm</span>
              </div>
            </div>
          </div>
        </div>

        <div 
          style={{ 
            backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
          }}
          className="overflow-x-auto rounded-lg border shadow-sm transition-colors"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr 
                style={{ 
                  backgroundColor: coloresApariencia?.tablaEncabezadoFondo || "#0F172A", 
                  color: coloresApariencia?.tablaEncabezadoTexto || "#CBD5E1",
                  borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
                }}
                className="font-bold border-b whitespace-nowrap transition-colors"
              >
                <th className="p-2.5 w-28">Pieza</th>
                <th className="p-2.5 min-w-[170px]">Descripción</th>
                <th className="p-2.5 min-w-[220px]">Tableros</th>
                <th className="p-2.5 w-16 text-center">Largo</th>
                <th className="p-2.5 w-16 text-center">Ancho</th>
                <th className="p-2.5 w-14 text-center">Esp.</th>
                <th className="p-2.5 w-16 text-center">m²</th>
                <th className="p-2.5 w-12 text-center">Cant.</th>
                <th className="p-2.5 w-20 text-right">Costo m²</th>
                <th className="p-2.5 w-20 text-center" title="Porcentaje de desperdicio estimado por nesting">
                  % Desp.
                </th>
                
                {/* COLUMNAS DE CANTOS */}
                <th className="p-2.5 w-32 text-center" title="Cantidad de cantos en Largo (L) y Ancho (A) leída automáticamente del modelo 3D">
                  Cantos (L × A)
                </th>
                <th className="p-2.5 min-w-[180px]">
                  Cantos
                </th>

                <th className="p-2.5 w-28 text-right">
                  Costo tableros
                </th>
                <th className="p-2.5 w-12 text-center" title="Descargar DXF individual para esta pieza">
                  DXF
                </th>
              </tr>
            </thead>
            <tbody 
              style={{ borderColor: coloresApariencia?.tablaBorde }}
              className="divide-y"
            >
              {resumenMadera.items.map((p: any, idx: number) => (
                <tr 
                  key={idx} 
                  style={{ 
                    backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles,
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition whitespace-nowrap"
                >
                  {/* Columna 1: Pieza (Nombre GHX de origen) */}
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="p-2.5 font-bold">
                    {p.nombre}
                  </td>

                  {/* Columna 2: Descripción (Nombre Oficial Editable) */}
                  <td className="p-2.5">
                    {editingDescIndex === idx ? (
                      <input
                        type="text"
                        value={p.descripcionOficial}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        onBlur={() => setEditingDescIndex(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape") setEditingDescIndex(null);
                        }}
                        onChange={(e) => handleDescripcionChange(idx, e.target.value)}
                        style={{
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          borderColor: coloresApariencia?.botonActivo,
                          color: coloresApariencia?.botonActivo,
                        }}
                        className="p-1 w-full text-xs font-bold border rounded outline-none shadow-xs"
                      />
                    ) : (
                      <div
                        onClick={() => setEditingDescIndex(idx)}
                        style={{ borderColor: "transparent" }}
                        className="flex items-center justify-between gap-1.5 cursor-pointer px-2 py-1 rounded transition hover:opacity-80"
                        title="Haz clic para nombrar o renombrar la descripción oficial de la pieza"
                      >
                        <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold">
                          {p.descripcionOficial}
                        </span>
                        <Edit2 style={{ color: coloresApariencia?.textoSecundario }} className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      </div>
                    )}
                  </td>

                  {/* Selector Desplegable de Sustrato */}
                  <td className="p-2">
                    <select
                      value={p.materialSeleccionado.codigo}
                      onChange={(e) => handleMaterialChange(idx, e.target.value)}
                      style={{
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.botonActivo,
                      }}
                      className="text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer w-full shadow-inner transition"
                    >
                      {dbTableros.map((mat: TableroRecord) => (
                        <option key={mat.codigo} value={mat.codigo}>
                          {mat.nombreComercial}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Dimensiones Desglosadas */}
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="p-2.5 text-center font-mono font-bold">{p.largo}</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="p-2.5 text-center font-mono font-bold">{p.ancho}</td>
                  <td style={{ color: coloresApariencia?.botonActivo }} className="p-2.5 text-center font-mono font-bold">{p.espesor}</td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="p-2.5 text-center font-mono">{p.areaM2}</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="p-2.5 text-center font-mono font-extrabold">{p.cantidad}</td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="p-2.5 text-right font-mono">
                    {formatUnitCustom(p.costoM2Cop, p.costoM2Usd)}
                  </td>

                  {/* % DESPERDICIO EDITABLE POR PIEZA */}
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <DecimalInput
                        value={p.desperdicioPct}
                        decimals={1}
                        onChange={(val) => handleDesperdicioPiezaChange(idx, val)}
                        style={{
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.textoPrincipal,
                        }}
                        className="w-12 text-center font-mono font-extrabold border rounded px-1 py-0.5 outline-none shadow-xs"
                      />
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="font-bold font-mono text-[10px]">%</span>
                    </div>
                  </td>

                  {/* CANTOS AUTOMÁTICOS LEÍDOS DEL 3D (L × A) */}
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1 font-mono text-xs" title="Cantos leídos automáticamente del 3D: L (Largos) y A (Anchos)">
                      <span 
                        style={p.cantosLargo > 0 ? {
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          borderColor: coloresApariencia?.botonActivo,
                          color: coloresApariencia?.botonActivo,
                        } : {
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.textoSecundario,
                        }}
                        className="px-1.5 py-0.5 rounded border text-[11px] font-extrabold shadow-xs"
                      >
                        {p.cantosLargo} L
                      </span>
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px]">×</span>
                      <span 
                        style={p.cantosAncho > 0 ? {
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          borderColor: coloresApariencia?.botonActivo,
                          color: coloresApariencia?.botonActivo,
                        } : {
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.textoSecundario,
                        }}
                        className="px-1.5 py-0.5 rounded border text-[11px] font-extrabold shadow-xs"
                      >
                        {p.cantosAncho} A
                      </span>
                    </div>
                  </td>

                  {/* SELECTOR DE MATERIAL DE CANTO */}
                  <td className="p-2">
                    <select
                      value={p.cantoCodigo || "NONE"}
                      onChange={(e) => handleMaterialCantoChange(idx, e.target.value)}
                      style={{
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.textoPrincipal,
                      }}
                      className="text-[11px] font-medium px-2 py-0.5 rounded border outline-none cursor-pointer w-full shadow-xs"
                    >
                      <option value="NONE">(Sin Canto)</option>
                      {dbCantos.map((c: CantoRecord) => (
                        <option key={c.codigo} value={c.codigo}>
                          {c.descripcion} ({formatUnitCustom(c.costoMlCop, c.costoMlUsd)}/ml)
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* COSTO TOTAL PIEZA TABLERO CON DESPERDICIO */}
                  <td 
                    style={{ color: coloresApariencia?.estadoActivo || "#10B981" }}
                    className="p-2.5 text-right font-mono font-extrabold"
                  >
                    {formatMoneyCustom(p.costoTotalCop, p.costoTotalUsd)}
                  </td>

                  {/* BOTÓN DESCARGA DXF INDIVIDUAL */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => descargarDXFPieza(p, idx)}
                      title={`Descargar archivo DXF de mecanizado para ${p.descripcion || p.nombre}`}
                      style={{
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.botonActivo || "#0891B2",
                      }}
                      className="p-1.5 rounded-md border hover:border-cyan-500 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs inline-flex items-center justify-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Fila de Total de Madera */}
            <tfoot>
              <tr 
                style={{ 
                  backgroundColor: coloresApariencia?.tablaTotalFondo || coloresApariencia?.fondoPaneles, 
                  borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles,
                  color: coloresApariencia?.botonActivo || coloresApariencia?.textoPrincipal
                }}
                className="border-t-2 font-bold whitespace-nowrap transition-colors"
              >
                <td 
                  colSpan={6} 
                  style={{ color: coloresApariencia?.botonActivo }}
                  className="p-2.5 text-right uppercase text-[10px] tracking-wider"
                >
                  Total Tableros:
                </td>
                <td 
                  style={{ color: coloresApariencia?.botonActivo }}
                  className="p-2.5 text-center font-mono font-bold"
                >
                  {resumenMadera.areaTotalM2}
                </td>
                <td 
                  style={{ color: coloresApariencia?.botonActivo }}
                  className="p-2.5 text-center font-mono font-bold"
                >
                  {resumenMadera.items.reduce((acc: number, i: any) => acc + i.cantidad, 0)}
                </td>
                <td 
                  colSpan={4} 
                  style={{ color: coloresApariencia?.botonActivo }}
                  className="p-2.5 text-right font-mono font-extrabold text-sm"
                >
                  {formatMoneyCustom(resumenMadera.costoTotalMaderaCop, resumenMadera.costoTotalMaderaUsd)}
                </td>
                <td className="p-2.5"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🔩 TABLA 2: INVENTARIO DE HERRAJES                                    */}
      {/* ===================================================================== */}
      <div className="flex flex-col gap-2">
        <div 
          style={{ 
            backgroundColor: coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.bordePaneles 
          }}
          className="flex justify-between items-center p-2.5 rounded-lg border shadow-sm transition-colors"
        >
          <h3 style={{ color: coloresApariencia?.textoPrincipal }} className="text-xs font-bold flex items-center gap-1.5">
            <Hammer style={{ color: coloresApariencia?.botonActivo }} className="w-4 h-4" />
            2. Lista de herrajes
          </h3>
        </div>

        <div 
          style={{ 
            backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
          }}
          className="overflow-hidden rounded-lg border shadow-sm transition-colors"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr 
                style={{ 
                  backgroundColor: coloresApariencia?.tablaEncabezadoFondo || "#0F172A", 
                  color: coloresApariencia?.tablaEncabezadoTexto || "#CBD5E1",
                  borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
                }}
                className="font-bold border-b whitespace-nowrap transition-colors"
              >
                <th className="p-2.5 w-36">Herraje (GHX)</th>
                <th className="p-2.5">Descripción Comercial</th>
                <th className="p-2.5 w-16 text-center">UM</th>
                <th className="p-2.5 w-20 text-center">Cantidad</th>
                <th className="p-2.5 w-28 text-right">Costo Unitario</th>
                <th className="p-2.5 w-28 text-right">Costo Total</th>
              </tr>
            </thead>
            <tbody 
              style={{ borderColor: coloresApariencia?.tablaBorde }}
              className="divide-y"
            >
              {resumenHerrajes.items.map((h: any, idx: number) => (
                <tr 
                  key={idx} 
                  style={{ 
                    backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles,
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition whitespace-nowrap"
                >
                  {/* Nombre GHX */}
                  <td style={{ color: coloresApariencia?.botonActivo }} className="p-2.5 font-bold font-mono">
                    {h.nombreGhx}
                  </td>
                  {/* Descripción Comercial */}
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="p-2.5 font-medium">
                    {h.descripcion}
                  </td>
                  {/* Unidad de Medida */}
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="p-2.5 text-center font-mono text-[10px]">
                    {h.unidad}
                  </td>
                  {/* Cantidad */}
                  <td className="p-2.5 text-center font-mono font-extrabold">
                    <span 
                      style={{ 
                        backgroundColor: coloresApariencia?.fondoAplicacion,
                        borderColor: coloresApariencia?.bordePaneles,
                        color: coloresApariencia?.botonActivo 
                      }}
                      className="px-2.5 py-0.5 rounded border font-mono font-bold"
                    >
                      {h.cantidad}
                    </span>
                  </td>
                  {/* Costo Unitario Nativo */}
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="p-2.5 text-right font-mono">
                    {formatUnitCustom(h.costoUnitarioCop, h.costoUnitarioUsd)}
                  </td>
                  {/* Costo Total en Fila Nativo */}
                  <td style={{ color: coloresApariencia?.estadoActivo || "#10B981" }} className="p-2.5 text-right font-mono font-bold">
                    {formatMoneyCustom(h.costoTotalCop, h.costoTotalUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Fila de Total de Herrajes */}
            <tfoot>
              <tr 
                style={{ 
                  backgroundColor: coloresApariencia?.tablaTotalFondo || coloresApariencia?.fondoPaneles, 
                  borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles,
                  color: coloresApariencia?.botonActivo || coloresApariencia?.textoPrincipal
                }}
                className="border-t-2 font-bold whitespace-nowrap transition-colors"
              >
                <td 
                  colSpan={3} 
                  style={{ color: coloresApariencia?.botonActivo }}
                  className="p-2.5 text-right uppercase text-[10px] tracking-wider"
                >
                  Total Herrajes:
                </td>
                <td 
                  style={{ color: coloresApariencia?.botonActivo }}
                  className="p-2.5 text-center font-mono font-bold"
                >
                  {resumenHerrajes.cantTotalHerrajes} u
                </td>
                <td 
                  style={{ color: coloresApariencia?.textoSecundario }}
                  className="p-2.5 text-right font-mono text-[10px]"
                >
                  Sumatoria:
                </td>
                <td 
                  style={{ color: coloresApariencia?.estadoActivo || "#10B981" }}
                  className="p-2.5 text-right font-mono font-extrabold text-sm"
                >
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
        <div 
          style={{ 
            backgroundColor: coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.bordePaneles 
          }}
          className="flex justify-between items-center p-2.5 rounded-lg border shadow-sm transition-colors"
        >
          <h3 style={{ color: coloresApariencia?.textoPrincipal }} className="text-xs font-bold flex items-center gap-1.5">
            <Ruler style={{ color: coloresApariencia?.botonActivo }} className="w-4 h-4" />
            3. Metros lineales de canto
          </h3>
        </div>

        <div 
          style={{ 
            backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
          }}
          className="overflow-hidden rounded-lg border shadow-sm transition-colors"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr 
                style={{ 
                  backgroundColor: coloresApariencia?.tablaEncabezadoFondo || "#0F172A", 
                  color: coloresApariencia?.tablaEncabezadoTexto || "#CBD5E1",
                  borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
                }}
                className="font-bold border-b whitespace-nowrap transition-colors"
              >
                <th className="p-2.5 w-24">Código</th>
                <th className="p-2.5">Descripción Canto</th>
                <th className="p-2.5 w-20 text-center">Tipo</th>
                <th className="p-2.5 w-24 text-center">Ancho / Calibre</th>
                <th className="p-2.5 w-20 text-center">Piezas</th>
                <th className="p-2.5 w-32 text-center font-bold">
                  Metros (ml)
                </th>
                <th className="p-2.5 w-28 text-right">Costo (ml)</th>
                <th className="p-2.5 w-28 text-right">Costo Total</th>
              </tr>
            </thead>
            <tbody 
              style={{ borderColor: coloresApariencia?.tablaBorde }}
              className="divide-y"
            >
              {resumenCantos.items.length === 0 ? (
                <tr>
                  <td 
                    colSpan={8} 
                    style={{ color: coloresApariencia?.textoSecundario }}
                    className="p-4 text-center font-mono text-[11px]"
                  >
                    No se han asignado cantos a las piezas de este mueble.
                  </td>
                </tr>
              ) : (
                resumenCantos.items.map((c: any) => (
                  <tr 
                    key={c.codigo} 
                    style={{ 
                      backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles,
                      borderColor: coloresApariencia?.tablaBorde,
                      color: coloresApariencia?.textoPrincipal
                    }}
                    className="transition whitespace-nowrap"
                  >
                    <td style={{ color: coloresApariencia?.textoSecundario }} className="p-2.5 font-mono text-[11px] font-bold">
                      {c.codigo}
                    </td>
                    <td style={{ color: coloresApariencia?.textoPrincipal }} className="p-2.5 font-bold">
                      {c.descripcion}
                    </td>
                    <td className="p-2.5 text-center">
                      <span 
                        style={{
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.botonActivo,
                        }}
                        className="px-2 py-0.5 rounded border text-[10px] font-bold"
                      >
                        {c.tipo}
                      </span>
                    </td>
                    <td style={{ color: coloresApariencia?.textoSecundario }} className="p-2.5 text-center font-mono">
                      {c.anchoMm} mm × {c.espesorMm} mm
                    </td>
                    <td style={{ color: coloresApariencia?.textoPrincipal }} className="p-2.5 text-center font-mono font-bold">
                      {c.piezasAsociadas} u
                    </td>
                    <td 
                      style={{ color: coloresApariencia?.botonActivo }}
                      className="p-2.5 text-center font-mono font-extrabold text-xs"
                    >
                      {c.metrosLineales}
                    </td>
                    <td style={{ color: coloresApariencia?.textoSecundario }} className="p-2.5 text-right font-mono">
                      {formatUnitCustom(c.costoMlCop, c.costoMlUsd)}
                    </td>
                    <td 
                      style={{ color: coloresApariencia?.estadoActivo || "#10B981" }}
                      className="p-2.5 text-right font-mono font-bold"
                    >
                      {formatMoneyCustom(c.costoTotalCop, c.costoTotalUsd)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Fila de Total de Cantos */}
            <tfoot>
              <tr 
                style={{ 
                  backgroundColor: coloresApariencia?.tablaTotalFondo || coloresApariencia?.fondoPaneles, 
                  borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles,
                  color: coloresApariencia?.botonActivo || coloresApariencia?.textoPrincipal
                }}
                className="border-t-2 font-bold whitespace-nowrap transition-colors"
              >
                <td 
                  colSpan={5} 
                  style={{ color: coloresApariencia?.botonActivo }}
                  className="p-2.5 text-right uppercase text-[10px] tracking-wider"
                >
                  Total Metros Lineales:
                </td>
                <td 
                  style={{ color: coloresApariencia?.botonActivo }}
                  className="p-2.5 text-center font-mono font-extrabold text-xs"
                >
                  {resumenCantos.cantTotalMetros}
                </td>
                <td 
                  style={{ color: coloresApariencia?.textoSecundario }}
                  className="p-2.5 text-right font-mono text-[10px]"
                >
                  Sumatoria:
                </td>
                <td 
                  style={{ color: coloresApariencia?.estadoActivo || "#10B981" }}
                  className="p-2.5 text-right font-mono font-extrabold text-sm"
                >
                  {formatMoneyCustom(resumenCantos.costoTotalCantosCop, resumenCantos.costoTotalCantosUsd)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🏭 TABLA 4: RESUMEN DE COSTOS & PANEL ANALÍTICO DE DISTRIBUCIÓN       */}
      {/* ===================================================================== */}
      <div className="flex flex-col gap-2">
        <div 
          style={{ 
            backgroundColor: coloresApariencia?.fondoPaneles, 
            borderColor: coloresApariencia?.bordePaneles 
          }}
          className="flex flex-wrap justify-between items-center p-2.5 rounded-lg border shadow-sm transition-colors gap-2"
        >
          <div className="flex items-center gap-2">
            <Coins style={{ color: coloresApariencia?.botonActivo }} className="w-4 h-4" />
            <h3 style={{ color: coloresApariencia?.textoPrincipal }} className="text-xs font-extrabold">
              4. Resumen de costos
            </h3>
          </div>

          {/* Selector de Modo de Gráfica: Macro ERP vs Detalle Insumos */}
          <div 
            style={{ 
              backgroundColor: coloresApariencia?.fondoAplicacion,
              borderColor: coloresApariencia?.bordePaneles 
            }}
            className="flex items-center p-0.5 rounded-lg border text-[11px] font-bold"
          >
            <button
              onClick={() => setChartMode("macro")}
              style={{
                backgroundColor: chartMode === "macro" ? coloresApariencia?.botonActivo : "transparent",
                color: chartMode === "macro" ? "#FFFFFF" : coloresApariencia?.textoSecundario,
              }}
              className="px-2.5 py-1 rounded-md transition cursor-pointer"
            >
              Macro ERP (MP / MO / CIF)
            </button>
            <button
              onClick={() => setChartMode("detalle")}
              style={{
                backgroundColor: chartMode === "detalle" ? coloresApariencia?.botonActivo : "transparent",
                color: chartMode === "detalle" ? "#FFFFFF" : coloresApariencia?.textoSecundario,
              }}
              className="px-2.5 py-1 rounded-md transition cursor-pointer"
            >
              Detalle por Insumo
            </button>
          </div>
        </div>

        {/* Contenedor Split: Panel Analítico (6 cols) + Tabla Compacta (6 cols) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-stretch">
          {/* LADO IZQUIERDO: PANEL ANALÍTICO CON COMPONENTES A LA IZQ Y DONUT AMPLIADO A LA DER (6 cols) */}
          <div 
            style={{ 
              backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles, 
              borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
            }}
            className="xl:col-span-6 p-3 rounded-lg border shadow-sm transition-colors flex flex-col justify-between gap-2.5"
          >
            {/* Cabecera del Panel Gráfico */}
            <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: coloresApariencia?.bordePaneles }}>
              <span style={{ color: coloresApariencia?.textoPrincipal }} className="text-xs font-bold">
                Estructura Porcentual de Costos
              </span>
              <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[10px] font-mono">
                {chartMode === "macro" ? "3 Componentes Principales" : "Desglose Completo de Insumos"}
              </span>
            </div>

            {/* Contenido en 2 Columnas Internas: Lista a la Izquierda + Donut Ampliado a la Derecha */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3 flex-1 py-1">
              {/* Lista Vertical de Componentes a la Izquierda */}
              <div className="flex flex-col gap-1 w-full lg:w-[46%] justify-center">
                {activeChartItems.map((item) => {
                  const isHovered = hoveredCostKey === item.id || (chartMode === "macro" && hoveredCostKey === "mp" && item.id === "mp");
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredCostKey(item.id)}
                      onMouseLeave={() => setHoveredCostKey(null)}
                      style={{
                        backgroundColor: isHovered ? (coloresApariencia?.fondoAplicacion || "#1E293B") : "transparent",
                        borderColor: isHovered ? item.color : "transparent",
                      }}
                      className="flex items-center justify-between py-1 px-2 rounded border transition cursor-pointer text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span style={{ color: coloresApariencia?.textoPrincipal }} className="truncate font-medium text-[10px]">
                          {item.nombre.replace("Lista de ", "").replace("Directa ", "")}
                        </span>
                      </div>
                      <span 
                        style={{ color: item.color }} 
                        className="font-mono font-extrabold ml-1.5 shrink-0 text-[11px]"
                      >
                        {item.pct}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Gráfico Donut SVG Reactivo Ampliado a la Derecha */}
              <div className="flex items-center justify-center relative flex-1 w-full lg:w-[54%] py-1">
                <svg width="250" height="250" viewBox="-125 -125 250 250" className="overflow-visible">
                  {chartSlices.map((slice) => {
                    const isHovered = hoveredCostKey === slice.id || (chartMode === "macro" && hoveredCostKey === "mp" && slice.id === "mp");
                    const rOuter = isHovered ? 116 : 108;
                    const rInner = isHovered ? 68 : 72;
                    const d = describeArc(0, 0, rOuter, rInner, slice.startAngle, slice.endAngle);

                    return (
                      <path
                        key={slice.id}
                        d={d}
                        fill={slice.color}
                        stroke={coloresApariencia?.fondoPaneles || "#0F172A"}
                        strokeWidth={2}
                        onMouseEnter={() => setHoveredCostKey(slice.id)}
                        onMouseLeave={() => setHoveredCostKey(null)}
                        className="cursor-pointer transition-all duration-200 hover:opacity-95"
                        style={{
                          filter: isHovered ? "drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))" : "none",
                          transformOrigin: "center",
                        }}
                      >
                        <title>{`${slice.nombre}: ${slice.pct}% (${formatMoneyCustom(slice.valorCop, slice.valorUsd)})`}</title>
                      </path>
                    );
                  })}

                  {/* Texto Central del Donut */}
                  <g textAnchor="middle" dominantBaseline="middle">
                    <text
                      y="-16"
                      fill={coloresApariencia?.textoSecundario || "#94A3B8"}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {activeHoveredItem ? activeHoveredItem.nombre.slice(0, 16) : "TOTAL PRODUCTO"}
                    </text>
                    <text
                      y="6"
                      fill={activeHoveredItem ? activeHoveredItem.color : (coloresApariencia?.estadoActivo || "#10B981")}
                      fontSize="18"
                      fontFamily="monospace"
                      fontWeight="900"
                    >
                      {activeHoveredItem ? `${activeHoveredItem.pct}%` : "100%"}
                    </text>
                    <text
                      y="26"
                      fill={coloresApariencia?.textoPrincipal || "#F8FAFC"}
                      fontSize="12"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {activeHoveredItem
                        ? formatMoneyCustom(activeHoveredItem.valorCop, activeHoveredItem.valorUsd)
                        : formatMoneyCustom(resumenIndustrial.costoTotalFabCop, resumenIndustrial.costoTotalFabUsd)}
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* LADO DERECHO: TABLA FINANCIERA COMPACTA (6 cols) */}
          <div 
            style={{ 
              backgroundColor: coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles, 
              borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
            }}
            className="xl:col-span-6 overflow-x-auto rounded-lg border shadow-sm transition-colors flex flex-col justify-between"
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr 
                  style={{ 
                    backgroundColor: coloresApariencia?.tablaEncabezadoFondo || "#0F172A", 
                    color: coloresApariencia?.tablaEncabezadoTexto || "#CBD5E1",
                    borderColor: coloresApariencia?.tablaBorde || coloresApariencia?.bordePaneles 
                  }}
                  className="font-bold border-b whitespace-nowrap transition-colors"
                >
                  <th className="py-2 px-2.5 w-8 text-center">#</th>
                  <th className="py-2 px-2.5">Componente del Costo</th>
                  <th className="py-2 px-2.5 w-36 text-center text-[11px]">Categoría</th>
                  <th className="py-2 px-3 w-40 text-right">Valor ({moneda})</th>
                </tr>
              </thead>
              <tbody 
                style={{ borderColor: coloresApariencia?.tablaBorde }}
                className="divide-y"
              >
                {/* 1. Láminas */}
                <tr 
                  onMouseEnter={() => setHoveredCostKey(chartMode === "macro" ? "mp" : "tableros")}
                  onMouseLeave={() => setHoveredCostKey(null)}
                  style={{ 
                    backgroundColor: hoveredCostKey === "tableros" || (chartMode === "macro" && hoveredCostKey === "mp")
                      ? (coloresApariencia?.fondoAplicacion || "#1E293B")
                      : (coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles),
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition cursor-pointer"
                >
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center font-mono font-bold">1</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-2.5 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#06B6D4" }} />
                    <Layers style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5 shrink-0" />
                    Lista de tableros
                  </td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center text-[10px]">Material Directo</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-3 text-right font-mono font-bold">
                    {formatMoneyCustom(resumenIndustrial.laminaCop, resumenIndustrial.laminaUsd)}
                  </td>
                </tr>

                {/* 2. Fondos */}
                <tr 
                  onMouseEnter={() => setHoveredCostKey(chartMode === "macro" ? "mp" : "fondos")}
                  onMouseLeave={() => setHoveredCostKey(null)}
                  style={{ 
                    backgroundColor: hoveredCostKey === "fondos" || (chartMode === "macro" && hoveredCostKey === "mp")
                      ? (coloresApariencia?.fondoAplicacion || "#1E293B")
                      : (coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles),
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition cursor-pointer"
                >
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center font-mono font-bold">2</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-2.5 font-medium pl-6">
                    Fondos (MDF 2.7mm - 3mm)
                  </td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center text-[10px]">Material Directo</td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-3 text-right font-mono">
                    {formatMoneyCustom(resumenIndustrial.fondosCop, resumenIndustrial.fondosUsd)}
                  </td>
                </tr>

                {/* 3. Cantos */}
                <tr 
                  onMouseEnter={() => setHoveredCostKey(chartMode === "macro" ? "mp" : "cantos")}
                  onMouseLeave={() => setHoveredCostKey(null)}
                  style={{ 
                    backgroundColor: hoveredCostKey === "cantos" || (chartMode === "macro" && hoveredCostKey === "mp")
                      ? (coloresApariencia?.fondoAplicacion || "#1E293B")
                      : (coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles),
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition cursor-pointer"
                >
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center font-mono font-bold">3</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-2.5 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#3B82F6" }} />
                    <Ruler style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5 shrink-0" />
                    Metros lineales de canto
                  </td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center text-[10px]">Material Directo</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-3 text-right font-mono font-bold">
                    {formatMoneyCustom(resumenIndustrial.cantoCop, resumenIndustrial.cantoUsd)}
                  </td>
                </tr>

                {/* 4. Empaque (Editable Manualmente) */}
                <tr 
                  onMouseEnter={() => setHoveredCostKey(chartMode === "macro" ? "mp" : "empaque")}
                  onMouseLeave={() => setHoveredCostKey(null)}
                  style={{ 
                    backgroundColor: hoveredCostKey === "empaque" || (chartMode === "macro" && hoveredCostKey === "mp")
                      ? (coloresApariencia?.fondoAplicacion || "#1E293B")
                      : (coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles),
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition cursor-pointer"
                >
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center font-mono font-bold">4</td>
                  <td className="py-1.5 px-2.5 font-medium pl-6">
                    <div className="flex items-center justify-between gap-1.5">
                      <span style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold truncate text-[11px]">
                        Material de Empaque (Cajas / Cartón)
                      </span>
                      <span 
                        style={{
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.botonActivo,
                        }}
                        className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 shrink-0"
                      >
                        <span 
                          style={{ backgroundColor: coloresApariencia?.botonActivo }}
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                        />
                        Manual ✏️
                      </span>
                    </div>
                  </td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center text-[10px]">Material Directo</td>
                  <td className="py-1.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="font-mono font-bold text-[10px]">
                        $
                      </span>
                      <DecimalInput
                        value={moneda === "COP" ? (costoEmpaqueManualCop ?? 0) : (costoEmpaqueManualUsd ?? 0)}
                        decimals={moneda === "COP" ? 0 : 2}
                        onChange={handleEmpaqueChange}
                        style={{
                          backgroundColor: coloresApariencia?.fondoAplicacion,
                          borderColor: coloresApariencia?.bordePaneles,
                          color: coloresApariencia?.textoPrincipal,
                        }}
                        className="w-20 text-right font-mono font-extrabold border rounded px-1 py-0.5 outline-none shadow-xs text-xs"
                      />
                      <span style={{ color: coloresApariencia?.textoSecundario }} className="text-[9px] font-mono font-bold">
                        {moneda}
                      </span>
                    </div>
                  </td>
                </tr>

                {/* 5. Herrajes */}
                <tr 
                  onMouseEnter={() => setHoveredCostKey(chartMode === "macro" ? "mp" : "herrajes")}
                  onMouseLeave={() => setHoveredCostKey(null)}
                  style={{ 
                    backgroundColor: hoveredCostKey === "herrajes" || (chartMode === "macro" && hoveredCostKey === "mp")
                      ? (coloresApariencia?.fondoAplicacion || "#1E293B")
                      : (coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles),
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition cursor-pointer"
                >
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center font-mono font-bold">5</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-2.5 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#EC4899" }} />
                    <Hammer style={{ color: coloresApariencia?.botonActivo }} className="w-3.5 h-3.5 shrink-0" />
                    Lista de herrajes
                  </td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center text-[10px]">Material Directo</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-3 text-right font-mono font-bold">
                    {formatMoneyCustom(resumenIndustrial.herrajesCop, resumenIndustrial.herrajesUsd)}
                  </td>
                </tr>

                {/* 6. Adicionales */}
                <tr 
                  onMouseEnter={() => setHoveredCostKey(chartMode === "macro" ? "mp" : "adicionales")}
                  onMouseLeave={() => setHoveredCostKey(null)}
                  style={{ 
                    backgroundColor: hoveredCostKey === "adicionales" || (chartMode === "macro" && hoveredCostKey === "mp")
                      ? (coloresApariencia?.fondoAplicacion || "#1E293B")
                      : (coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles),
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition cursor-pointer"
                >
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center font-mono font-bold">6</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-2.5 font-medium pl-6 text-[11px]">
                    Adicionales & Consumibles (0.40%)
                  </td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center text-[10px]">Material Directo</td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-3 text-right font-mono">
                    {formatMoneyCustom(resumenIndustrial.adicionalesCop, resumenIndustrial.adicionalesUsd)}
                  </td>
                </tr>

                {/* Subtotal MP Directa */}
                <tr 
                  style={{ 
                    backgroundColor: coloresApariencia?.fondoPaneles, 
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal 
                  }}
                  className="border-y font-bold"
                >
                  <td 
                    colSpan={3} 
                    style={{ color: coloresApariencia?.textoPrincipal }}
                    className="py-1.5 px-2.5 text-right uppercase tracking-wider text-[10px]"
                  >
                    SUBTOTAL MATERIA PRIMA DIRECTA (MP):
                  </td>
                  <td 
                    style={{ color: coloresApariencia?.estadoActivo || "#10B981" }}
                    className="py-1.5 px-3 text-right font-mono font-extrabold text-xs"
                  >
                    {formatMoneyCustom(resumenIndustrial.totalMpCop, resumenIndustrial.totalMpUsd)}
                  </td>
                </tr>

                {/* 7. Tercerizaciones */}
                <tr 
                  onMouseEnter={() => setHoveredCostKey(chartMode === "macro" ? null : "tercerizaciones")}
                  onMouseLeave={() => setHoveredCostKey(null)}
                  style={{ 
                    backgroundColor: hoveredCostKey === "tercerizaciones"
                      ? (coloresApariencia?.fondoAplicacion || "#1E293B")
                      : (coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles),
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition cursor-pointer"
                >
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center font-mono font-bold">7</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-2.5 font-medium pl-6 text-[11px]">
                    Tercerizaciones & Maquilas Externas
                  </td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center text-[10px]">Servicio Externo</td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-3 text-right font-mono">
                    {formatMoneyCustom(resumenIndustrial.tercerizacionesCop, resumenIndustrial.tercerizacionesUsd)}
                  </td>
                </tr>

                {/* 8. Mano de Obra Directa + Prestaciones */}
                <tr 
                  onMouseEnter={() => setHoveredCostKey("mo")}
                  onMouseLeave={() => setHoveredCostKey(null)}
                  style={{ 
                    backgroundColor: hoveredCostKey === "mo"
                      ? (coloresApariencia?.fondoAplicacion || "#1E293B")
                      : (coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles),
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition cursor-pointer"
                >
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center font-mono font-bold">8</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-2.5 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#10B981" }} />
                    Mano de Obra Directa + Prestaciones (MO)
                  </td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center text-[10px] font-semibold">
                    Costo Conversión
                  </td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-3 text-right font-mono font-extrabold">
                    {formatMoneyCustom(resumenIndustrial.moPresCop, resumenIndustrial.moPresUsd)}
                  </td>
                </tr>

                {/* 9. CIF */}
                <tr 
                  onMouseEnter={() => setHoveredCostKey("cif")}
                  onMouseLeave={() => setHoveredCostKey(null)}
                  style={{ 
                    backgroundColor: hoveredCostKey === "cif"
                      ? (coloresApariencia?.fondoAplicacion || "#1E293B")
                      : (coloresApariencia?.tablaFilaFondo || coloresApariencia?.fondoPaneles),
                    borderColor: coloresApariencia?.tablaBorde,
                    color: coloresApariencia?.textoPrincipal
                  }}
                  className="transition cursor-pointer"
                >
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center font-mono font-bold">9</td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-2.5 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#F59E0B" }} />
                    Costos Indirectos de Fabricación (CIF)
                  </td>
                  <td style={{ color: coloresApariencia?.textoSecundario }} className="py-1.5 px-2.5 text-center text-[10px] font-semibold">
                    Planta & Deprec.
                  </td>
                  <td style={{ color: coloresApariencia?.textoPrincipal }} className="py-1.5 px-3 text-right font-mono font-extrabold">
                    {formatMoneyCustom(resumenIndustrial.cifCop, resumenIndustrial.cifUsd)}
                  </td>
                </tr>
              </tbody>

              {/* Fila Gran Total 100% */}
              <tfoot>
                <tr 
                  style={{ 
                    backgroundColor: coloresApariencia?.tablaTotalFondo || "#0F172A", 
                    borderColor: coloresApariencia?.tablaBorde || "#334155" 
                  }}
                  className="border-t-2 font-bold whitespace-nowrap transition-colors"
                >
                  <td 
                    colSpan={3} 
                    style={{ color: coloresApariencia?.botonActivo }}
                    className="p-2.5 text-right uppercase text-[11px] tracking-wider"
                  >
                    COSTO TOTAL PRODUCTO:
                  </td>
                  <td 
                    style={{ color: coloresApariencia?.estadoActivo || "#10B981" }}
                    className="p-2.5 px-3 text-right font-mono font-extrabold text-sm"
                  >
                    {formatMoneyCustom(resumenIndustrial.costoTotalFabCop, resumenIndustrial.costoTotalFabUsd)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 📦 ACCIONES DE FABRICACIÓN & EXPORTACIÓN DXF CNC                      */}
      {/* ===================================================================== */}
      <div 
        style={{ 
          backgroundColor: coloresApariencia?.fondoPaneles, 
          borderColor: coloresApariencia?.bordePaneles 
        }}
        className="p-3.5 rounded-xl border shadow-sm flex flex-col gap-3 transition-colors"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCode2 style={{ color: coloresApariencia?.botonActivo }} className="w-4 h-4" />
            <div>
              <h3 style={{ color: coloresApariencia?.textoPrincipal }} className="font-bold text-xs">
                Mecanizado DfMA & Archivos CNC
              </h3>
              <p style={{ color: coloresApariencia?.textoSecundario }} className="text-[11px]">
                {Object.keys(mecanizadosCruzados || {}).length > 0 
                  ? `⚡ Perforaciones inter-componentes activas (${Object.values(mecanizadosCruzados).flat().length} transferidas al DXF)`
                  : "Mecanizados nativos listos para exportar"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón Perforar Mueble */}
            <button
              onClick={async () => {
                await perforarMueble();
              }}
              disabled={mecanizadoEnProgreso}
              style={{
                backgroundColor: coloresApariencia?.fondoAplicacion || "#F1F5F9",
                borderColor: coloresApariencia?.bordePaneles || "#CBD5E1",
                color: coloresApariencia?.textoPrincipal || "#0F172A",
              }}
              className="py-2 px-3.5 rounded-lg border font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer hover:border-cyan-500 hover:text-cyan-600 active:scale-95"
              title="Detectar contacto entre piezas y transferir perforaciones NURBS al DXF"
            >
              <Zap className={`w-3.5 h-3.5 ${mecanizadoEnProgreso ? "animate-spin text-amber-500" : "text-amber-500"}`} />
              <span>{mecanizadoEnProgreso ? "Perforando..." : "Perforar Mueble"}</span>
            </button>

            {/* Botón Limpiar Perforaciones */}
            {Object.keys(mecanizadosCruzados || {}).length > 0 && (
              <button
                onClick={limpiarPerforaciones}
                style={{
                  backgroundColor: coloresApariencia?.fondoAplicacion || "#F1F5F9",
                  borderColor: coloresApariencia?.bordePaneles || "#CBD5E1",
                  color: "#EF4444",
                }}
                className="py-2 px-3 rounded-lg border font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95"
                title="Eliminar perforaciones transferidas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}

            {/* Botón Exportar DXF */}
            <button
              onClick={descargarDXF}
              disabled={descargando}
              style={{
                backgroundColor: coloresApariencia?.botonActivo || "#0891b2",
                color: "#FFFFFF",
              }}
              className="py-2 px-4 rounded-lg font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:opacity-90 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>
                {descargando 
                  ? "Generando DXFs..." 
                  : (piezasActivas.length > 1 
                      ? `Exportar ${piezasActivas.length} DXFs CNC` 
                      : "Exportar DXF Seccionadora CNC")}
              </span>
            </button>
          </div>
        </div>

        {/* Resumen de Perforaciones si hubo mecanizado */}
        {ultimoResumenMecanizado && ultimoResumenMecanizado.length > 0 && (
          <div 
            style={{
              backgroundColor: coloresApariencia?.fondoAplicacion,
              borderColor: coloresApariencia?.bordePaneles,
            }}
            className="p-2 rounded-lg border text-[11px] flex flex-col gap-0.5"
          >
            {ultimoResumenMecanizado.map((msg, idx) => (
              <span key={idx} style={{ color: msg.includes("✓") ? "#10B981" : (coloresApariencia?.textoSecundario || "#64748B") }}>
                {msg}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

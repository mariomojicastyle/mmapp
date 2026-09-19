"use client";

import React, { useMemo, useState, useEffect } from "react";
import { use3BFStore, PasoManualStudio, PiezaEsperaConfig, ConfiguracionCinematicaPaso } from "@/lib/store";
import {
  extraerPiezaMadre,
  extraerFamiliaPieza,
  perteneceAMismaFamiliaPieza,
} from "@/lib/piezaMadreUtils";
import {
  mapearContactosPiezasHerrajes,
  aplicarPosicionesEscena3D,
  coincidenMismoHerraje,
  comprobarHerrajeCongelado,
  resolverDuenioHerrajeCanonica,
} from "@/lib/engine/cadStateUtils";

/**
 * Analiza el guión narrativo del paso y extrae el orden cronológico en que se mencionan
 * los tableros. La primera pieza mencionada se propone como Pieza Master.
 */
export function extraerOrdenDePiezasDesdeGuion(
  textoGuion: string,
  tableros: string[]
): { orden: string[]; encontrada: boolean } {
  if (!textoGuion || !textoGuion.trim() || tableros.length === 0) {
    return { orden: tableros, encontrada: false };
  }

  const textoNorm = textoGuion.toLowerCase();

  const apariciones = tableros.map((nom) => {
    const madre = extraerPiezaMadre(nom).toLowerCase().trim();
    const digitoMatch = madre.match(/\d+/);
    const digito = digitoMatch ? digitoMatch[0] : "";

    let minIndex = -1;

    // 1. Coincidencia directa del nombre normalizado (ej. "peça 7")
    if (madre) {
      const idx = textoNorm.indexOf(madre);
      if (idx !== -1 && (minIndex === -1 || idx < minIndex)) {
        minIndex = idx;
      }
      const varianteEs = madre.replace(/peça|peca/g, "pieza");
      const idxEs = textoNorm.indexOf(varianteEs);
      if (idxEs !== -1 && (minIndex === -1 || idxEs < minIndex)) {
        minIndex = idxEs;
      }
    }

    // 2. Coincidencia por tipo de componente y número ("pieza 7", "peça 7", "tablero 7", "p 7", "#7")
    if (digito) {
      const regexPatterns = [
        new RegExp(
          `(?:pieza|peça|peca|tablero|painel|lateral|cubierta|entrepaño|fondo|puerta|cajón|cajon|p)\\s*#?\\s*${digito}\\b`,
          "i"
        ),
        new RegExp(`\\b#${digito}\\b`, "i"),
      ];
      for (const regex of regexPatterns) {
        const match = regex.exec(textoNorm);
        if (match && match.index !== undefined) {
          if (minIndex === -1 || match.index < minIndex) {
            minIndex = match.index;
          }
        }
      }
    }

    return { nombre: nom, index: minIndex };
  });

  const encontradas = apariciones
    .filter((a) => a.index >= 0)
    .sort((a, b) => a.index - b.index)
    .map((a) => a.nombre);

  const noEncontradas = apariciones
    .filter((a) => a.index === -1)
    .map((a) => a.nombre);

  return {
    orden: [...encontradas, ...noEncontradas],
    encontrada: encontradas.length > 0,
  };
}

export function useCalibradorCinematica(pasoActivo: PasoManualStudio) {
  const {
    resultado,
    actualizarPasoManual,
    piezaEnPosicionamientoManual,
    setPiezaEnPosicionamientoManual,
    setUltimaPiezaCalibrada,
    setHerrajesHovered,
    vistaPiezasDesplazadas,
    setVistaPiezasDesplazadas,
    autoEnfoqueCamaraManual,
    setAutoEnfoqueCamaraManual,
    timelineCurrentTime,
    pestanaActiva,
  } = use3BFStore();

  const [colapsado, setColapsado] = useState(false);
  const [draggedPiezaNombre, setDraggedPiezaNombre] = useState<string | null>(null);
  const [dragOverPiezaNombre, setDragOverPiezaNombre] = useState<string | null>(null);
  const [mensajeGuion, setMensajeGuion] = useState<string | null>(null);

  // ❄️ Estados para arrastre de herrajes hacia / desde el Congelador
  const [draggedHerraje, setDraggedHerraje] = useState<{ nombrePieza: string; herrajeId: string } | null>(null);
  const [dragOverCongeladorPieza, setDragOverCongeladorPieza] = useState<string | null>(null);
  const [dragOverNormalPieza, setDragOverNormalPieza] = useState<string | null>(null);

  // Obtener la lista limpia de tableros de madera asignados a este paso agrupados por familia canónica
  const tablerosAsignados = useMemo(() => {
    const piezas = pasoActivo.piezasAsignadas || [];
    const setMadres = new Set<string>();
    piezas.forEach((p) => {
      const familia = extraerFamiliaPieza(p);
      if (familia) {
        setMadres.add(familia);
      }
    });
    return Array.from(setMadres);
  }, [pasoActivo.piezasAsignadas]);

  // 🔩 Detección y mapeo bidireccional de herrajes en contacto físico con cada pieza
  const { contactosPorHerraje, herrajesEnContactoPorPieza } = useMemo(() => {
    const realMeshes = (resultado?.real_meshes as any[]) || [];
    const res = mapearContactosPiezasHerrajes(
      tablerosAsignados,
      realMeshes,
      pasoActivo.herrajesAsignados
    );
    return {
      contactosPorHerraje: res.contactosPorHerraje,
      herrajesEnContactoPorPieza: res.herrajesPorPieza,
    };
  }, [tablerosAsignados, resultado?.real_meshes, pasoActivo.herrajesAsignados]);

  // 👑 Determinar la Pieza Master oficial del paso (siempre ubicada en primera posición)
  const piezaMasterNombre = useMemo(() => {
    if (pasoActivo.piezaMaster && tablerosAsignados.includes(extraerFamiliaPieza(pasoActivo.piezaMaster))) {
      return extraerFamiliaPieza(pasoActivo.piezaMaster);
    }
    const encontrada = tablerosAsignados.find(
      (t) => pasoActivo.piezaMaster && perteneceAMismaFamiliaPieza(t, pasoActivo.piezaMaster)
    );
    if (encontrada) return encontrada;
    return tablerosAsignados[0] || "";
  }, [pasoActivo.piezaMaster, tablerosAsignados]);

  // Configuración cinemática actual con valores por defecto óptimos
  const config = pasoActivo.configuracionCinematica || {
    velocidadPiezasCmS: 15,
    velocidadHerrajesCmS: 8,
    piezasEspera: [],
  };

  const piezasEspera = config.piezasEspera || [];

  // Asegurar que cada tablero tenga su registro de espera ordenado: Master siempre 1º, secundarias 2º, 3º...
  const piezasConConfig = useMemo(() => {
    const rawList = tablerosAsignados.map((nombre, idx) => {
      const esMaster = nombre === piezaMasterNombre;
      const encontrada = piezasEspera.find(
        (p) => p.nombrePieza === nombre || perteneceAMismaFamiliaPieza(p.nombrePieza, nombre)
      );
      if (encontrada) {
        const esResidualRadial =
          esMaster &&
          encontrada.offsetXCm === 50 &&
          ((encontrada.offsetYCm ?? 0) === 42 || (encontrada.offsetZCm ?? 0) === 42);
        return {
          ...encontrada,
          nombrePieza: nombre,
          offsetXCm: esResidualRadial ? 0 : (encontrada.offsetXCm ?? 0),
          offsetYCm: esResidualRadial ? 0 : (encontrada.offsetYCm ?? encontrada.offsetZCm ?? 0),
          offsetZCm: esResidualRadial ? 0 : (encontrada.offsetYCm ?? encontrada.offsetZCm ?? 0),
        };
      }
      const angulo = (idx / Math.max(1, tablerosAsignados.length)) * Math.PI * 2;
      const radioCm = 50 + idx * 15;
      return {
        nombrePieza: nombre,
        ordenEnsamble: esMaster ? 1 : idx + 2,
        offsetXCm: esMaster ? 0 : Math.round(Math.cos(angulo) * radioCm),
        offsetYCm: esMaster ? 0 : Math.round(Math.sin(angulo) * radioCm),
        offsetZCm: esMaster ? 0 : Math.round(Math.sin(angulo) * radioCm),
        apoyadaEnPiso: true,
      };
    });

    const masterItem = rawList.find((p) => p.nombrePieza === piezaMasterNombre);
    const secundarias = rawList.filter((p) => p.nombrePieza !== piezaMasterNombre);

    secundarias.sort((a, b) => (a.ordenEnsamble || 99) - (b.ordenEnsamble || 99));

    const resultadoLista: PiezaEsperaConfig[] = [];
    if (masterItem) {
      resultadoLista.push({ ...masterItem, ordenEnsamble: 1 });
    }
    secundarias.forEach((p, idx) => {
      resultadoLista.push({ ...p, ordenEnsamble: idx + 2 });
    });

    return resultadoLista;
  }, [tablerosAsignados, piezasEspera, piezaMasterNombre]);

  // Actualizar una propiedad de la configuración global
  const handleCambiarParametroGlobal = (
    campo: "velocidadPiezasCmS" | "velocidadHerrajesCmS" | "distanciaAproximacionHerrajesCm",
    valor: number
  ) => {
    const nuevoConfig = {
      ...config,
      [campo]: valor,
      piezasEspera: piezasConConfig,
    };

    // 🔄 Sincronizar y recalcular la secuencia cinemática en caliente ante cualquier cambio de velocidad o distancia global
    sincronizarYGuardarSecuencia(piezasConConfig, nuevoConfig);
  };

  // Actualizar coordenadas de espera de una pieza específica
  const handleCambiarOffsetPieza = (
    nombrePieza: string,
    campo: "offsetXCm" | "offsetYCm" | "ordenEnsamble",
    valor: number
  ) => {
    setUltimaPiezaCalibrada(nombrePieza);

    const actualizadas = piezasConConfig.map((item) => {
      if (item.nombrePieza === nombrePieza) {
        if (campo === "offsetYCm") {
          return { ...item, offsetYCm: valor, offsetZCm: valor };
        }
        return { ...item, [campo]: valor };
      }
      return item;
    });

    actualizarPasoManual(pasoActivo.id, {
      configuracionCinematica: {
        ...config,
        piezasEspera: actualizadas,
      },
    });
  };

  // Restablecer la posición de espera de una pieza al origen (X: 0, Y: 0)
  const handleResetOffsetPieza = (nombrePieza: string) => {
    setUltimaPiezaCalibrada(nombrePieza);

    if (
      piezaEnPosicionamientoManual &&
      (piezaEnPosicionamientoManual.nombrePieza === nombrePieza ||
        extraerPiezaMadre(piezaEnPosicionamientoManual.nombrePieza) === extraerPiezaMadre(nombrePieza))
    ) {
      setPiezaEnPosicionamientoManual(null);
    }

    const actualizadas = piezasConConfig.map((item) => {
      if (
        item.nombrePieza === nombrePieza ||
        perteneceAMismaFamiliaPieza(item.nombrePieza, nombrePieza)
      ) {
        return {
          ...item,
          offsetXCm: 0,
          offsetYCm: 0,
          offsetZCm: 0,
        };
      }
      return item;
    });

    actualizarPasoManual(pasoActivo.id, {
      configuracionCinematica: {
        ...config,
        piezasEspera: actualizadas,
      },
    });

    if (typeof window !== "undefined") {
      const searchRoot = (window as any).__threeScene3BF;
      if (searchRoot) {
        aplicarPosicionesEscena3D(
          searchRoot,
          actualizadas,
          contactosPorHerraje,
          vistaPiezasDesplazadas ? "desplazada" : "original",
          config.distanciaAproximacionHerrajesCm || 15
        );
      }
    }
  };

  // Restablecer todas las piezas al origen (X: 0, Y: 0)
  const handleResetearTodasLasPosiciones = () => {
    setPiezaEnPosicionamientoManual(null);

    const actualizadas = piezasConConfig.map((item) => ({
      ...item,
      offsetXCm: 0,
      offsetYCm: 0,
      offsetZCm: 0,
    }));

    actualizarPasoManual(pasoActivo.id, {
      configuracionCinematica: {
        ...config,
        piezasEspera: actualizadas,
      },
    });

    if (typeof window !== "undefined") {
      const searchRoot = (window as any).__threeScene3BF;
      if (searchRoot) {
        aplicarPosicionesEscena3D(
          searchRoot,
          actualizadas,
          contactosPorHerraje,
          vistaPiezasDesplazadas ? "desplazada" : "original",
          config.distanciaAproximacionHerrajesCm || 15
        );
      }
    }
  };

  // Alternar modo de visualización en escena 3D: Posición Original vs Piezas Desplazadas
  const handleToggleVistaDesplazadas = (activar: boolean) => {
    setVistaPiezasDesplazadas(activar);
    if (typeof window !== "undefined") {
      const searchRoot = (window as any).__threeScene3BF;
      if (searchRoot) {
        aplicarPosicionesEscena3D(
          searchRoot,
          piezasConConfig,
          contactosPorHerraje,
          activar ? "desplazada" : "original",
          config.distanciaAproximacionHerrajesCm || 15
        );
      }
    }
  };

  // Auto-sincronización reactiva con escena 3D
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchRoot = (window as any).__threeScene3BF;
      if (searchRoot && Object.keys(contactosPorHerraje).length > 0) {
        aplicarPosicionesEscena3D(
          searchRoot,
          piezasConConfig,
          contactosPorHerraje,
          vistaPiezasDesplazadas ? "desplazada" : "original",
          config.distanciaAproximacionHerrajesCm || 15
        );
      }
    }
  }, [
    pasoActivo.id,
    pasoActivo.herrajesAsignados?.length,
    Object.keys(contactosPorHerraje).length,
    vistaPiezasDesplazadas,
    config.distanciaAproximacionHerrajesCm,
  ]);

  const handleSincronizarHerrajesYEscena = () => {
    sincronizarYGuardarSecuencia(piezasConConfig);
    if (typeof window !== "undefined") {
      const searchRoot = (window as any).__threeScene3BF;
      if (searchRoot) {
        aplicarPosicionesEscena3D(
          searchRoot,
          piezasConConfig,
          contactosPorHerraje,
          vistaPiezasDesplazadas ? "desplazada" : "original",
          config.distanciaAproximacionHerrajesCm || 15
        );
      }
    }
  };

  const handleTogglePosicionarEnEscenario = (nombrePieza: string) => {
    setUltimaPiezaCalibrada(nombrePieza);
    setDraggedPiezaNombre(null);
    setDragOverPiezaNombre(null);

    if (
      piezaEnPosicionamientoManual &&
      piezaEnPosicionamientoManual.pasoId === pasoActivo.id &&
      (piezaEnPosicionamientoManual.nombrePieza === nombrePieza ||
        perteneceAMismaFamiliaPieza(piezaEnPosicionamientoManual.nombrePieza, nombrePieza))
    ) {
      setPiezaEnPosicionamientoManual(null);
    } else {
      setPiezaEnPosicionamientoManual({
        pasoId: pasoActivo.id,
        nombrePieza,
      });
    }
  };

  const handleDefinirPiezaMaster = (nombrePieza: string) => {
    const actualizadas = piezasConConfig.map((item) => {
      const esEsta = item.nombrePieza === nombrePieza || perteneceAMismaFamiliaPieza(item.nombrePieza, nombrePieza);
      if (esEsta) {
        return {
          ...item,
          ordenEnsamble: 1,
          offsetXCm: 0,
          offsetYCm: 0,
          offsetZCm: 0,
        };
      }
      return item;
    });

    actualizarPasoManual(pasoActivo.id, {
      piezaMaster: nombrePieza,
      configuracionCinematica: {
        ...config,
        piezasEspera: actualizadas,
      },
    });
    setUltimaPiezaCalibrada(nombrePieza);
    setMensajeGuion(`👑 ${nombrePieza} establecida como Pieza Master (Base de ensamble #1 en origen X:0, Y:0)`);

    if (typeof window !== "undefined") {
      const searchRoot = (window as any).__threeScene3BF;
      if (searchRoot) {
        aplicarPosicionesEscena3D(
          searchRoot,
          actualizadas,
          contactosPorHerraje,
          vistaPiezasDesplazadas ? "desplazada" : "original",
          config.distanciaAproximacionHerrajesCm || 15
        );
      }
    }
  };

  const handleExtraerOrdenDesdeGuion = () => {
    const texto =
      pasoActivo.guionEs?.trim() ||
      pasoActivo.guionPt?.trim() ||
      pasoActivo.guionEn?.trim() ||
      pasoActivo.descripcion?.trim() ||
      "";

    if (!texto) {
      setMensajeGuion("El guión está vacío. Escribe o dicta la narración en el Estudio de Voz.");
      return;
    }

    const { orden: nuevoOrden, encontrada } = extraerOrdenDePiezasDesdeGuion(texto, tablerosAsignados);

    if (!encontrada) {
      setMensajeGuion("No se detectaron menciones de piezas en el texto del guión.");
      return;
    }

    const nuevaMaster = nuevoOrden[0];
    const nuevaLista: PiezaEsperaConfig[] = nuevoOrden.map((nombre, idx) => {
      const encontradaCfg = piezasConConfig.find(
        (p) => p.nombrePieza === nombre || extraerPiezaMadre(p.nombrePieza) === extraerPiezaMadre(nombre)
      );
      const esMaster = idx === 0;
      return {
        ...(encontradaCfg || {
          offsetXCm: 0,
          offsetYCm: 0,
          offsetZCm: 0,
        }),
        nombrePieza: nombre,
        ordenEnsamble: idx + 1,
        offsetXCm: esMaster ? 0 : (encontradaCfg?.offsetXCm || 0),
        offsetYCm: esMaster ? 0 : (encontradaCfg?.offsetYCm ?? encontradaCfg?.offsetZCm ?? 0),
        offsetZCm: esMaster ? 0 : (encontradaCfg?.offsetYCm ?? encontradaCfg?.offsetZCm ?? 0),
      };
    });

    actualizarPasoManual(pasoActivo.id, {
      piezaMaster: nuevaMaster,
      configuracionCinematica: {
        ...config,
        piezasEspera: nuevaLista,
      },
    });

    sincronizarYGuardarSecuencia(nuevaLista);
    setMensajeGuion(`Orden sincronizado con el guión: ${nuevoOrden.join(" ➔ ")} (Master: ${nuevaMaster})`);
  };

  const handleToggleHerraje = (nombrePieza: string, herrajeId: string) => {
    const herrajesPieza = herrajesEnContactoPorPieza[nombrePieza] || [];
    const item = herrajesPieza.find((h) => h.id === herrajeId);
    const mallasTarget = item ? item.nombresMallas : [herrajeId];
    const instKey = (item?.nombresMallas && item.nombresMallas[0]) || herrajeId.split("::").pop() || herrajeId;
    const contactos = contactosPorHerraje[instKey] || [nombrePieza];

    // Verificar si actualmente esta pieza es la dueña del herraje
    const duenioActual = resolverDuenioHerrajeCanonica(instKey, contactos, piezasConConfig);
    const estaPrendido = duenioActual === nombrePieza;

    // Helper para comprobar si un identificador coincide canónicamente con este herraje
    const coincideHerraje = (str: string) => {
      if (!str) return false;
      return (
        mallasTarget.includes(str) ||
        str === instKey ||
        str === herrajeId ||
        mallasTarget.some((m) => coincidenMismoHerraje(str, m)) ||
        coincidenMismoHerraje(str, instKey) ||
        coincidenMismoHerraje(str, herrajeId)
      );
    };

    const nuevaLista = piezasConConfig.map((p) => {
      let desacts = (p.herrajesDesactivados || []).filter((h) => !coincideHerraje(h));
      let acts = (p.herrajesActivados || []).filter((h) => !coincideHerraje(h));

      if (p.nombrePieza === nombrePieza) {
        if (estaPrendido) {
          // Estaba prendido en esta pieza -> El usuario hace clic para apagarlo / desvincularlo
          mallasTarget.forEach((mId) => {
            if (!desacts.includes(mId)) desacts.push(mId);
          });
        } else {
          // Estaba apagado / con link roto -> El usuario hace clic para ENCENDERLO y apropiárselo en esta pieza
          mallasTarget.forEach((mId) => {
            if (!acts.includes(mId)) acts.push(mId);
          });
        }
      } else if (contactos.includes(p.nombrePieza)) {
        // En las demás piezas que tocan físicamente este herraje:
        if (estaPrendido) {
          // Si se apagó en la pieza actual, se transfiere limpiamente a la otra pieza de contacto
          mallasTarget.forEach((mId) => {
            if (!acts.includes(mId)) acts.push(mId);
          });
        } else {
          // Si se encendió en la pieza actual, se desactiva en la otra pieza para no disputar posesión
          mallasTarget.forEach((mId) => {
            if (!desacts.includes(mId)) desacts.push(mId);
          });
        }
      }

      return {
        ...p,
        herrajesDesactivados: desacts,
        herrajesActivados: acts,
      };
    });

    sincronizarYGuardarSecuencia(nuevaLista);
  };

  const handleCongelarHerraje = (nombrePieza: string, herrajeId: string) => {
    const herrajesPieza = herrajesEnContactoPorPieza[nombrePieza] || [];
    const item = herrajesPieza.find((h) => h.id === herrajeId);
    const mallasTarget = item ? item.nombresMallas : [herrajeId];

    const nuevaLista = piezasConConfig.map((p) => {
      if (p.nombrePieza !== nombrePieza) return p;
      const congelados = new Set(p.herrajesCongelados || []);
      const desacts = new Set(p.herrajesDesactivados || []);
      const acts = new Set(p.herrajesActivados || []);

      mallasTarget.forEach((mId) => {
        congelados.add(mId);
        desacts.delete(mId);
        acts.add(mId);
      });

      return {
        ...p,
        herrajesCongelados: Array.from(congelados),
        herrajesDesactivados: Array.from(desacts),
        herrajesActivados: Array.from(acts),
      };
    });

    sincronizarYGuardarSecuencia(nuevaLista);
  };

  const handleDescongelarHerraje = (nombrePieza: string, herrajeId: string) => {
    const herrajesPieza = herrajesEnContactoPorPieza[nombrePieza] || [];
    const item = herrajesPieza.find((h) => h.id === herrajeId);
    const mallasTarget = item ? item.nombresMallas : [herrajeId];

    const nuevaLista = piezasConConfig.map((p) => {
      if (p.nombrePieza !== nombrePieza) return p;
      const congelados = new Set(p.herrajesCongelados || []);
      mallasTarget.forEach((mId) => {
        congelados.delete(mId);
        for (const c of Array.from(congelados)) {
          if (coincidenMismoHerraje(c, mId)) congelados.delete(c);
        }
      });

      return {
        ...p,
        herrajesCongelados: Array.from(congelados),
      };
    });

    sincronizarYGuardarSecuencia(nuevaLista);
  };

  const handleCambiarDireccionHerraje = (nombrePieza: string, herrajeId: string, direccion: string) => {
    const herrajesPieza = herrajesEnContactoPorPieza[nombrePieza] || [];
    const item = herrajesPieza.find((h) => h.id === herrajeId);
    const mallasTarget = item ? item.nombresMallas : [herrajeId];

    const nuevaLista = piezasConConfig.map((p) => {
      if (p.nombrePieza !== nombrePieza) return p;
      const dirs = { ...(p.direccionesHerrajes || {}) };
      dirs[herrajeId] = direccion;
      mallasTarget.forEach((mId) => {
        dirs[mId] = direccion;
      });

      return {
        ...p,
        direccionesHerrajes: dirs,
      };
    });

    sincronizarYGuardarSecuencia(nuevaLista);
  };

  const handleCambiarModoTiempo = (modo: "global" | "por_capa") => {
    const nuevoConfig: ConfiguracionCinematicaPaso = {
      ...config,
      modoTiempo: modo,
      piezasEspera: piezasConConfig,
    };
    sincronizarYGuardarSecuencia(piezasConConfig, nuevoConfig);
  };

  const sincronizarYGuardarSecuencia = (
    nuevaLista: PiezaEsperaConfig[],
    configOverride?: ConfiguracionCinematicaPaso
  ) => {
    const confActiva = configOverride || config;
    const vPiezaM_s = Math.max(0.05, (confActiva.velocidadPiezasCmS || 15) / 100);
    const vHwM_s = Math.max(0.04, (confActiva.velocidadHerrajesCmS || 8) / 100);
    const distGlobalCm = confActiva.distanciaAproximacionHerrajesCm || 15;
    const distGlobalM = distGlobalCm / 100;
    const modoTiempo = confActiva.modoTiempo || "global";

    const nuevaSecuencia: any[] = [];
    let tiempoAcumulado = 0.5;

    nuevaLista.forEach((pConfig) => {
      const esMaster = pConfig.ordenEnsamble === 1;
      const offY = pConfig.offsetYCm ?? pConfig.offsetZCm ?? 0;
      const distEspera = Math.sqrt((pConfig.offsetXCm / 100) ** 2 + (offY / 100) ** 2);

      const herrajesDePieza = herrajesEnContactoPorPieza[pConfig.nombrePieza] || [];
      const mallasCohesionadas: string[] = [];
      const mallasNuevas: string[] = [];
      const mallasCongeladas: string[] = [];

      herrajesDePieza.forEach((hw) => {
        const instKey = hw.nombresMallas[0] || hw.id.split("::")[1];
        const contactos = contactosPorHerraje[instKey] || [pConfig.nombrePieza];
        const duenio = resolverDuenioHerrajeCanonica(instKey, contactos, nuevaLista);

        if (duenio === pConfig.nombrePieza) {
          const esCongelado =
            comprobarHerrajeCongelado(hw.id, pConfig.herrajesCongelados || []) ||
            comprobarHerrajeCongelado(instKey, pConfig.herrajesCongelados || []);

          hw.nombresMallas.forEach((mId) => {
            mallasCohesionadas.push(mId);
            if (esCongelado) {
              mallasCongeladas.push(mId);
            } else {
              mallasNuevas.push(mId);
            }
          });
        }
      });

      // 🚀 Cálculo físico de duración de inserción de herrajes: tiempo de recorrido (d/v) + apriete rotacional y escalonamiento
      const tiempoViajeHw = Math.max(0.3, distGlobalM / vHwM_s);
      const escalonamientoHw = Math.min(1.2, Math.max(0, mallasNuevas.length - 1) * 0.12);
      const duracionInsercionFisica = mallasNuevas.length > 0
        ? Math.round((tiempoViajeHw + 0.4 + escalonamientoHw) * 10) / 10
        : 0;

      if (esMaster && distEspera < 0.01) {
        if (mallasCohesionadas.length > 0) {
          const durInsertMaster = duracionInsercionFisica;
          nuevaSecuencia.push({
            id: `seq_${pConfig.nombrePieza}`,
            nombreNodo: pConfig.nombrePieza,
            tipo: "pieza",
            tiempoInicio: tiempoAcumulado,
            duracionInsercionHerrajes: durInsertMaster,
            duracionMovimiento: 0,
            popIn: false,
            distanciaAproximacion: 0,
            herrajesCohesionados: mallasCohesionadas,
            herrajesNuevos: mallasNuevas,
            herrajesCongelados: mallasCongeladas,
            direccionesHerrajes: pConfig.direccionesHerrajes || {},
            tiemposAparicionHerrajes: pConfig.tiemposAparicionHerrajes || {},
            tiempoAparicionPieza: pConfig.tiempoAparicionPieza || 0,
            tiempoFinHerrajes: pConfig.tiempoFinHerrajes || 0,
            distanciaAproximacionHerrajesCm: distGlobalCm,
          });
          if (durInsertMaster > 0) {
            tiempoAcumulado += durInsertMaster + 0.4;
          }
        }
        return;
      }

      const duracionInsercion = duracionInsercionFisica;

      const duracionTraslacion =
        modoTiempo === "por_capa"
          ? Math.max(0.5, pConfig.tiempoAnimacionSegundos || 2.5)
          : Math.max(1.5, Math.round((distEspera / vPiezaM_s) * 10) / 10);

      nuevaSecuencia.push({
        id: `seq_${pConfig.nombrePieza}`,
        nombreNodo: pConfig.nombrePieza,
        tipo: "pieza",
        tiempoInicio: tiempoAcumulado,
        duracionInsercionHerrajes: duracionInsercion,
        duracionMovimiento: duracionTraslacion,
        popIn: false,
        distanciaAproximacion: distEspera,
        herrajesCohesionados: mallasCohesionadas,
        herrajesNuevos: mallasNuevas,
        herrajesCongelados: mallasCongeladas,
        direccionesHerrajes: pConfig.direccionesHerrajes || {},
        tiemposAparicionHerrajes: pConfig.tiemposAparicionHerrajes || {},
        tiempoAparicionPieza: pConfig.tiempoAparicionPieza || 0,
        tiempoFinHerrajes: pConfig.tiempoFinHerrajes || 0,
        distanciaAproximacionHerrajesCm: distGlobalCm,
      });

      tiempoAcumulado += duracionInsercion + duracionTraslacion + 0.5;
    });

    let maxTiempoAparicion = 0;
    nuevaLista.forEach((p) => {
      if (typeof p.tiempoAparicionPieza === "number" && p.tiempoAparicionPieza > maxTiempoAparicion) {
        maxTiempoAparicion = p.tiempoAparicionPieza;
      }
      if (typeof p.tiempoFinHerrajes === "number" && p.tiempoFinHerrajes > maxTiempoAparicion) {
        maxTiempoAparicion = p.tiempoFinHerrajes;
      }
      Object.values(p.tiemposAparicionHerrajes || {}).forEach((t) => {
        if (typeof t === "number" && t > maxTiempoAparicion) {
          maxTiempoAparicion = t;
        }
      });
    });

    const duracionFinal = Math.max(
      6,
      Math.max(
        Math.round((tiempoAcumulado + 0.5) * 10) / 10,
        maxTiempoAparicion > 0 ? Math.round((maxTiempoAparicion + 4.0) * 10) / 10 : 0
      )
    );

    // 🛡️ REGLA SOBERANA: La duración total de la animación es controlada EXCLUSIVAMENTE por el usuario.
    // Ningún cambio en tiempos de aparición de piezas o herrajes debe alterar el duracionTotal establecido.
    const duracionPreservada = (pasoActivo.duracionTotal && pasoActivo.duracionTotal > 0)
      ? pasoActivo.duracionTotal
      : duracionFinal;

    actualizarPasoManual(pasoActivo.id, {
      duracionTotal: duracionPreservada,
      secuencia: nuevaSecuencia,
      configuracionCinematica: {
        ...confActiva,
        piezasEspera: nuevaLista,
      },
    });

    if (typeof window !== "undefined") {
      const searchRoot = (window as any).__threeScene3BF;
      if (searchRoot) {
        aplicarPosicionesEscena3D(
          searchRoot,
          nuevaLista,
          contactosPorHerraje,
          vistaPiezasDesplazadas ? "desplazada" : "original",
          distGlobalCm
        );
      }
    }
  };

  const comprobarHerrajeActivoEnTiempo = (
    nombrePieza: string,
    herrajeId: string,
    instKey: string
  ): boolean => {
    if (pestanaActiva !== "manual") return true;
    const pConf = piezasConConfig.find(
      (pc) =>
        pc.nombrePieza === nombrePieza ||
        perteneceAMismaFamiliaPieza(pc.nombrePieza, nombrePieza)
    );
    if (!pConf) return true;

    const tPieza = pConf.tiempoAparicionPieza || 0;
    const tiemposHw = pConf.tiemposAparicionHerrajes || {};
    let tHerraje = tPieza;

    for (const [k, v] of Object.entries(tiemposHw)) {
      if (
        k === herrajeId ||
        k === instKey ||
        coincidenMismoHerraje(k, herrajeId) ||
        coincidenMismoHerraje(k, instKey)
      ) {
        if (typeof v === "number" && v > 0) {
          tHerraje = v;
          break;
        }
      }
    }

    if (timelineCurrentTime < tPieza) return false;
    if (timelineCurrentTime < tHerraje) return false;

    return true;
  };

  const handleDragStart = (e: React.DragEvent, nombrePieza: string) => {
    e.dataTransfer.setData("text/plain", nombrePieza);
    setDraggedPiezaNombre(nombrePieza);
  };

  const handleDragOver = (e: React.DragEvent, nombrePieza: string) => {
    e.preventDefault();
    if (draggedPiezaNombre && draggedPiezaNombre !== nombrePieza) {
      setDragOverPiezaNombre(nombrePieza);
    }
  };

  const handleDragLeave = () => {
    setDragOverPiezaNombre(null);
  };

  const handleDrop = (e: React.DragEvent, targetPiezaNombre: string) => {
    e.preventDefault();
    const sourcePiezaNombre = e.dataTransfer.getData("text/plain") || draggedPiezaNombre;
    setDragOverPiezaNombre(null);
    setDraggedPiezaNombre(null);

    if (!sourcePiezaNombre || sourcePiezaNombre === targetPiezaNombre) return;

    const secundarias = piezasConConfig.filter((p) => p.nombrePieza !== piezaMasterNombre);
    const sourceIdx = secundarias.findIndex((p) => p.nombrePieza === sourcePiezaNombre);
    const targetIdx = secundarias.findIndex((p) => p.nombrePieza === targetPiezaNombre);

    if (sourceIdx === -1 || targetIdx === -1) return;

    const reordenadas = [...secundarias];
    const [movida] = reordenadas.splice(sourceIdx, 1);
    reordenadas.splice(targetIdx, 0, movida);

    const masterItem = piezasConConfig.find((p) => p.nombrePieza === piezaMasterNombre);
    const resultadoFinal: PiezaEsperaConfig[] = [];
    if (masterItem) {
      resultadoFinal.push({ ...masterItem, ordenEnsamble: 1 });
    }
    reordenadas.forEach((p, idx) => {
      resultadoFinal.push({ ...p, ordenEnsamble: idx + 2 });
    });

    sincronizarYGuardarSecuencia(resultadoFinal);
  };

  const handleDragEnd = () => {
    setDraggedPiezaNombre(null);
    setDragOverPiezaNombre(null);
  };

  const handleCambiarTiempoAparicionHerraje = (nombrePieza: string, herrajeId: string, segundos: number) => {
    const valorValido = Math.max(0, isNaN(segundos) ? 0 : Number(segundos));
    const nuevaLista = piezasConConfig.map((p) => {
      if (p.nombrePieza === nombrePieza) {
        const tiempos = { ...(p.tiemposAparicionHerrajes || {}) };
        tiempos[herrajeId] = valorValido;

        const herrajesPieza = herrajesEnContactoPorPieza[nombrePieza] || [];
        const item = herrajesPieza.find((h) => h.id === herrajeId);
        if (item) {
          item.nombresMallas.forEach((mId) => {
            tiempos[mId] = valorValido;
          });
        }

        return {
          ...p,
          tiemposAparicionHerrajes: tiempos,
        };
      }
      return p;
    });

    sincronizarYGuardarSecuencia(nuevaLista);
  };

  const handleCambiarTiempoAparicionPieza = (nombrePieza: string, segundos: number) => {
    const valorValido = Math.max(0, isNaN(segundos) ? 0 : Number(segundos));

    const nuevaLista = piezasConConfig.map((p) => {
      if (p.nombrePieza === nombrePieza) {
        return {
          ...p,
          tiempoAparicionPieza: valorValido,
        };
      }
      return p;
    });

    sincronizarYGuardarSecuencia(nuevaLista);
  };

  const handleCambiarTiempoFinHerrajesPieza = (nombrePieza: string, segundos: number) => {
    const valorValido = Math.max(0, isNaN(segundos) ? 0 : Number(segundos));
    const nuevaLista = piezasConConfig.map((p) => {
      if (p.nombrePieza === nombrePieza) {
        return {
          ...p,
          tiempoFinHerrajes: valorValido,
        };
      }
      return p;
    });

    sincronizarYGuardarSecuencia(nuevaLista);
  };

  const handleCambiarTiempoPieza = (nombrePieza: string, delta: number) => {
    const nuevaLista = piezasConConfig.map((p) => {
      if (p.nombrePieza !== nombrePieza) return p;
      const actual = p.tiempoAnimacionSegundos || 2.5;
      const nuevo = Math.max(0.5, Math.min(15.0, Number((actual + delta).toFixed(1))));
      return {
        ...p,
        tiempoAnimacionSegundos: nuevo,
      };
    });

    actualizarPasoManual(pasoActivo.id, {
      configuracionCinematica: {
        ...config,
        piezasEspera: nuevaLista,
      },
    });

    sincronizarYGuardarSecuencia(nuevaLista);
  };

  // Generar la coreografía matemática automática de tracks en el paso
  const compilarCinematicaAutomatica = () => {
    const piezasOrdenadas = [...piezasConConfig].sort((a, b) => a.ordenEnsamble - b.ordenEnsamble);
    sincronizarYGuardarSecuencia(piezasOrdenadas);

    use3BFStore.setState({
      timelineCurrentTime: 0,
      isTimelinePlaying: true,
      piezaEnPosicionamientoManual: null,
    });
    setMensajeGuion("Animación generada y sincronizada exitosamente con la física de taller.");
  };

  return {
    colapsado,
    setColapsado,
    config,
    tablerosAsignados,
    piezasConConfig,
    piezaMasterNombre,
    contactosPorHerraje,
    herrajesEnContactoPorPieza,
    piezaEnPosicionamientoManual,
    vistaPiezasDesplazadas,
    autoEnfoqueCamaraManual,
    setAutoEnfoqueCamaraManual,
    draggedPiezaNombre,
    dragOverPiezaNombre,
    mensajeGuion,
    draggedHerraje,
    setDraggedHerraje,
    dragOverCongeladorPieza,
    setDragOverCongeladorPieza,
    dragOverNormalPieza,
    setDragOverNormalPieza,
    setHerrajesHovered,
    handleCambiarParametroGlobal,
    handleCambiarOffsetPieza,
    handleResetOffsetPieza,
    handleResetearTodasLasPosiciones,
    handleToggleVistaDesplazadas,
    handleSincronizarHerrajesYEscena,
    handleTogglePosicionarEnEscenario,
    handleDefinirPiezaMaster,
    handleExtraerOrdenDesdeGuion,
    handleToggleHerraje,
    handleCongelarHerraje,
    handleDescongelarHerraje,
    handleCambiarDireccionHerraje,
    handleCambiarModoTiempo,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleCambiarTiempoAparicionHerraje,
    handleCambiarTiempoAparicionPieza,
    handleCambiarTiempoFinHerrajesPieza,
    handleCambiarTiempoPieza,
    comprobarHerrajeActivoEnTiempo,
    compilarCinematicaAutomatica,
  };
}

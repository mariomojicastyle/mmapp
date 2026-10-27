"use client";

import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { use3BFStore } from "@/lib/store";
import { getSafeRestPosition, coincidenMismoHerraje } from "@/lib/engine/cadStateUtils";

interface EstadoGamma {
  activo: boolean;
  mensaje: string;
  pasoId?: string;
  capaId?: string;
  payload?: any;
  timestamp: number;
}

export function GammaLiveIndicator() {
  const [estado, setEstado] = useState<EstadoGamma>({
    activo: false,
    mensaje: "",
    timestamp: 0,
  });
  const [visible, setVisible] = useState(false);
  const [esExito, setEsExito] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevActivoRef = useRef(false);
  const ultimoTimestampAplicadoRef = useRef(0);

  useEffect(() => {
    let montado = true;

    const consultarEstado = async () => {
      try {
        const res = await fetch("/api/gamma-status");
        if (!res.ok) return;
        const data: EstadoGamma = await res.json();
        if (!montado) return;

        const stateGlobal = use3BFStore.getState();
        const tieneModeloAbierto = Boolean(
          stateGlobal.pasosManual && 
          stateGlobal.pasosManual.length > 0 &&
          (stateGlobal.resultado || Object.keys(stateGlobal.instancias || {}).length > 0)
        );

        // 🛡️ BLINDAJE DE APERTURA: El modal solo puede aparecer si el modelo y su manual están abiertos
        if (!tieneModeloAbierto) {
          if (visible) setVisible(false);
          return;
        }

        const yaFueAplicado = Boolean(data.timestamp && data.timestamp <= ultimoTimestampAplicadoRef.current);

        // 🎯 Si Gamma está activo trabajando en una tarea nueva
        if (data.activo && !yaFueAplicado) {
          setEsExito(false);
          setVisible(true);
          if (!timeoutRef.current) {
            timeoutRef.current = setTimeout(() => {
              if (montado) setVisible(false);
            }, 3500);
          }
        }

        // 🎯 Si llegó un nuevo payload (con timestamp más reciente que el último procesado), aplicarlo SIEMPRE
        if (data.payload && data.timestamp && data.timestamp > ultimoTimestampAplicadoRef.current) {
          ultimoTimestampAplicadoRef.current = data.timestamp;
          setEsExito(true);
          setVisible(true);

          try {
            const state = use3BFStore.getState();
            const pasoId = data.pasoId || (state as any).pasoActivoManualId || "P02";
            const paso = (state.pasosManual || []).find((p: any) => p.id === pasoId);
            const capaId = data.capaId || paso?.multiplePlus?.capas?.[0]?.id || "capa_plus_1";

            // 🎯 FILTRADO GEOMÉTRICO EN VIVO Y GARANTÍA DETERMINÍSTICA DE HERRAJES
            const gruposEnsamble: { slideId: string; screwIds: string[] }[] = [];
            const targetPiezaFiltro = data.payload?.filtrarPorContactoPieza || data.payload?.piezaTarget;

            if (targetPiezaFiltro && typeof window !== "undefined" && (window as any).__threeScene3BF) {
              try {
                const searchRoot = (window as any).__threeScene3BF;
                const normalizeStr = (s: string) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const nombreTarget = normalizeStr(targetPiezaFiltro);

                const boxPieza = new THREE.Box3();
                let piezaEncontrada = false;

                searchRoot.traverse((child: any) => {
                  if (child.isMesh) {
                    const cn = normalizeStr(child.userData?.cleanName || child.name || "");
                    const ik = normalizeStr(child.userData?.instanciaKey || "");
                    if (cn.includes(nombreTarget) || ik.includes(nombreTarget)) {
                      const pRest = getSafeRestPosition(child);
                      const curPos = child.position.clone();
                      child.position.copy(pRest);
                      child.updateWorldMatrix(true, true);
                      boxPieza.setFromObject(child);
                      child.position.copy(curPos);
                      child.updateWorldMatrix(true, true);
                      piezaEncontrada = true;
                    }
                  }
                });

                if (piezaEncontrada && !boxPieza.isEmpty()) {
                  const candidatasCorr: { mesh: any; id: string; dist: number; z: number }[] = [];
                  const candidatasTorn: { mesh: any; id: string; dist: number; pWorld: THREE.Vector3 }[] = [];

                  searchRoot.traverse((child: any) => {
                    if (child.isMesh) {
                      const cn = (child.userData?.cleanName || child.name || "").toLowerCase();
                      const ik = (child.userData?.instanciaKey || "").toLowerCase();
                      const raw = (child.name || "").toLowerCase();
                      const esCorr = cn.includes("corredi") || ik.includes("corredi") || raw.includes("corredi") || cn.includes("fixa");
                      const esTorn = cn.includes("parafuso") || ik.includes("parafuso") || raw.includes("parafuso") || cn.includes("tornillo");

                      if (esCorr || esTorn) {
                        const pRest = getSafeRestPosition(child);
                        const pWorld = child.parent ? child.parent.localToWorld(pRest.clone()) : pRest.clone();
                        const dist = boxPieza.distanceToPoint(pWorld);
                        const idHw = child.userData?.instanciaKey || child.userData?.cleanName || child.name;

                        if (esCorr) {
                          candidatasCorr.push({ mesh: child, id: idHw, dist, z: pWorld.z });
                        } else if (esTorn && dist < 0.20) {
                          candidatasTorn.push({ mesh: child, id: idHw, dist, pWorld });
                        }
                      }
                    }
                  });

                  candidatasCorr.sort((a, b) => a.dist - b.dist);
                  const unicasCorr: { mesh: any; id: string; z: number }[] = [];
                  for (const c of candidatasCorr) {
                    if (!unicasCorr.some((u) => coincidenMismoHerraje(u.id, c.id))) {
                      unicasCorr.push({ mesh: c.mesh, id: c.id, z: c.z });
                      if (unicasCorr.length >= 3) break;
                    }
                  }
                  unicasCorr.sort((a, b) => b.z - a.z);

                  const tornillosDisponibles = [...candidatasTorn];
                  for (const corr of unicasCorr) {
                    const pRestCorr = getSafeRestPosition(corr.mesh);
                    const curPosCorr = corr.mesh.position.clone();
                    corr.mesh.position.copy(pRestCorr);
                    corr.mesh.updateWorldMatrix(true, true);
                    const boxSlide = new THREE.Box3().setFromObject(corr.mesh);
                    corr.mesh.position.copy(curPosCorr);
                    corr.mesh.updateWorldMatrix(true, true);

                    const tornillosOrdenados = tornillosDisponibles.map((t) => ({
                      item: t,
                      distToSlide: boxSlide.distanceToPoint(t.pWorld),
                    }));
                    tornillosOrdenados.sort((a, b) => a.distToSlide - b.distToSlide);

                    const misTornillos: string[] = [];
                    for (const cand of tornillosOrdenados) {
                      if (!misTornillos.some((id) => coincidenMismoHerraje(id, cand.item.id))) {
                        misTornillos.push(cand.item.id);
                        const idxDisp = tornillosDisponibles.findIndex((t) => coincidenMismoHerraje(t.id, cand.item.id));
                        if (idxDisp >= 0) tornillosDisponibles.splice(idxDisp, 1);
                        if (misTornillos.length >= 2) break;
                      }
                    }

                    gruposEnsamble.push({ slideId: corr.id, screwIds: misTornillos });
                  }
                }
              } catch (scanErr) {
                console.warn("[GammaLiveIndicator] Advertencia en escaneo 3D, usando fallback garantizado:", scanErr);
              }
            }

            // 🛡️ Asignación Determinística Garantizada (Matriz Completa 12 Correderas + 24 Tornillos en 58s)
            const tiemposGrupos = [
              // 1. Peça 7 (Lateral Izquierdo)
              { tSlide: 0.5,  tScrews: 2.0 },   // Fixa 1  + Tornillos 61, 25
              { tSlide: 5.0,  tScrews: 6.5 },   // Fixa 5  + Tornillos 31, 65
              { tSlide: 9.5,  tScrews: 11.0 },  // Fixa 9  + Tornillos 38, 69

              // 2. Peça 6 Cara A (Divisor Central, Cara Frontal/Superior)
              { tSlide: 13.5, tScrews: 15.0 },  // Fixa 3  + Tornillos 63, 41
              { tSlide: 17.5, tScrews: 19.0 },  // Fixa 7  + Tornillos 67, 42
              { tSlide: 21.5, tScrews: 23.0 },  // Fixa 11 + Tornillos 71, 45

              // 3. Peça 10 (Lateral Derecho)
              { tSlide: 25.5, tScrews: 27.0 },  // Fixa 4  + Tornillos 34, 64
              { tSlide: 29.5, tScrews: 31.0 },  // Fixa 8  + Tornillos 43, 68
              { tSlide: 33.5, tScrews: 35.0 },  // Fixa 12 + Tornillos 48, 72

              // 4. Peça 6 Cara B (Divisor Central tras volteo de 180° a los 38.5s)
              { tSlide: 43.5, tScrews: 45.0 },  // Fixa 2  + Tornillos 62, 28
              { tSlide: 47.5, tScrews: 49.0 },  // Fixa 6  + Tornillos 66, 35
              { tSlide: 51.5, tScrews: 53.0 },  // Fixa 10 + Tornillos 44, 70
            ];

            const gruposFinales = [
              // Peça 7
              { slideId: "Corrediça - Fixa (1)",  screwIds: ["Parafuso E (61)", "Parafuso E (25)"] },
              { slideId: "Corrediça - Fixa (5)",  screwIds: ["Parafuso E (31)", "Parafuso E (65)"] },
              { slideId: "Corrediça - Fixa (9)",  screwIds: ["Parafuso E (38)", "Parafuso E (69)"] },
              // Peça 6 Cara A
              { slideId: "Corrediça - Fixa (3)",  screwIds: ["Parafuso E (63)", "Parafuso E (41)"] },
              { slideId: "Corrediça - Fixa (7)",  screwIds: ["Parafuso E (67)", "Parafuso E (42)"] },
              { slideId: "Corrediça - Fixa (11)", screwIds: ["Parafuso E (71)", "Parafuso E (45)"] },
              // Peça 10
              { slideId: "Corrediça - Fixa (4)",  screwIds: ["Parafuso E (34)", "Parafuso E (64)"] },
              { slideId: "Corrediça - Fixa (8)",  screwIds: ["Parafuso E (43)", "Parafuso E (68)"] },
              { slideId: "Corrediça - Fixa (12)", screwIds: ["Parafuso E (48)", "Parafuso E (72)"] },
              // Peça 6 Cara B
              { slideId: "Corrediça - Fixa (2)",  screwIds: ["Parafuso E (62)", "Parafuso E (28)"] },
              { slideId: "Corrediça - Fixa (6)",  screwIds: ["Parafuso E (66)", "Parafuso E (35)"] },
              { slideId: "Corrediça - Fixa (10)", screwIds: ["Parafuso E (44)", "Parafuso E (70)"] },
            ];

            const distCm = (typeof data.payload?.capaActualizada?.desplazamientoCm === "number" && data.payload.capaActualizada.desplazamientoCm > 0)
              ? data.payload.capaActualizada.desplazamientoCm
              : 30; // 🎯 30 cm exactos

            const capaActual = paso?.multiplePlus?.capas?.find((c: any) => c.id === capaId) || paso?.multiplePlus?.capas?.[0];
            const herrajesPayload = data.payload?.capaActualizada?.herrajes;
            const tieneTiemposCompletos = Array.isArray(herrajesPayload) && herrajesPayload.some((h: any) => h.tiempoAparicion > 12 && h.tiempoAparicion < 900);

            let listaHerrajesATrabajar: any[] = [];

            if (tieneTiemposCompletos) {
              // 🚀 Usar directamente la lista enriquecida enviada por Gamma
              listaHerrajesATrabajar = herrajesPayload.map((h: any) => ({ ...h }));
            } else {
              listaHerrajesATrabajar = (capaActual?.herrajes && capaActual.herrajes.length > 0)
                ? capaActual.herrajes.map((h: any) => ({ ...h }))
                : (data.payload?.capaActualizada?.herrajes || []).map((h: any) => ({ ...h }));

              listaHerrajesATrabajar.forEach((h: any) => {
                let asignado = false;
                for (let g = 0; g < gruposFinales.length; g++) {
                  const grupo = gruposFinales[g];
                  const timing = tiemposGrupos[g] || { tSlide: 0.5, tScrews: 2.0 };

                  if (coincidenMismoHerraje(grupo.slideId, h.id)) {
                    h.tiempoAparicion = timing.tSlide;
                    h.ejeAproximacion = "+Y";
                    h.desplazamientoCm = distCm;
                    h.escalaInicial = 1.0;
                    h.duracionEscalaSegundos = undefined;
                    asignado = true;
                    break;
                  }

                  if (grupo.screwIds.some((sId: string) => coincidenMismoHerraje(sId, h.id))) {
                    h.tiempoAparicion = timing.tScrews;
                    h.ejeAproximacion = "+Y";
                    h.desplazamientoCm = distCm;
                    h.escalaInicial = 2.0;
                    h.duracionEscalaSegundos = 1.0;
                    asignado = true;
                    break;
                  }
                }

                if (!asignado) {
                  const esCavilha = h.id?.toLowerCase().includes("cavilha") || h.cleanName?.toLowerCase().includes("cavilha");
                  if (esCavilha) {
                    h.tiempoAparicion = 0;
                    h.desplazamientoCm = undefined;
                    h.congelado = true;
                  } else {
                    h.tiempoAparicion = 999;
                    h.desplazamientoCm = undefined;
                  }
                }
              });
            }

            if (!data.payload.capaActualizada) data.payload.capaActualizada = {};
            data.payload.capaActualizada.herrajes = listaHerrajesATrabajar;
            data.payload.duracionTotal = data.payload.duracionTotal || 58.0;
            data.payload.duracionAudioSegundos = data.payload.duracionTotal || 58.0;

            if (typeof (state as any).aplicarCinematicaCopilot === "function") {
                (state as any).aplicarCinematicaCopilot(pasoId, capaId, data.payload);
              }

              // 🛡️ Notificar inmediatamente al backend para liberar el estado activo
              fetch("/api/gamma-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activo: false, mensaje: "Cinemática aplicada con éxito" })
              }).catch(() => {});
            } catch (err) {
              console.error("[GammaLiveIndicator] Error al aplicar cinemática en store:", err);
            }

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              setVisible(false);
            }, 1200);
          } else if (prevActivoRef.current && !data.activo) {
            // Transición a inactivo sin nuevo payload
            setEsExito(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              if (montado) setVisible(false);
            }, 3000);
          }

        prevActivoRef.current = data.activo;
        setEstado(data);
      } catch {
        // Silencio en caso de error de red
      }
    };

    // Polling reactivo cada 600ms
    const interval = setInterval(consultarEstado, 600);
    consultarEstado();

    // 📡 Escaneo silencioso de la escena 3D viva para mapear herrajes a piezas en backend
    const reportarEscena = async () => {
      try {
        if (typeof window === "undefined" || !(window as any).__threeScene3BF) return;
        const searchRoot = (window as any).__threeScene3BF;

        // 1. Recolectar cajas de las piezas
        const piezas: Record<string, THREE.Box3> = {};
        searchRoot.traverse((child: any) => {
          if (child.isMesh) {
            const cn = (child.userData?.cleanName || child.name || "").toLowerCase();
            const ik = (child.userData?.instanciaKey || "").toLowerCase();
            ["peça 7", "peça 6", "peça 10"].forEach((nombre) => {
              if (cn.includes(nombre) || ik.includes(nombre)) {
                const pRest = getSafeRestPosition(child);
                const curPos = child.position.clone();
                child.position.copy(pRest);
                child.updateWorldMatrix(true, true);
                const b = new THREE.Box3().setFromObject(child);
                child.position.copy(curPos);
                child.updateWorldMatrix(true, true);
                piezas[nombre] = b;
              }
            });
          }
        });

        if (Object.keys(piezas).length === 0) return;

        // 2. Mapear cada corredera y tornillo a su pieza más cercana
        const correderasInfo: { id: string; pieza: string; dist: number; z: number }[] = [];
        const tornillosInfo: { id: string; pieza: string; dist: number; z: number }[] = [];

        searchRoot.traverse((child: any) => {
          if (child.isMesh) {
            const cn = (child.userData?.cleanName || child.name || "").toLowerCase();
            const ik = (child.userData?.instanciaKey || "").toLowerCase();
            const raw = (child.name || "").toLowerCase();
            const esCorr = cn.includes("corredi") || ik.includes("corredi") || raw.includes("corredi") || cn.includes("fixa");
            const esTorn = cn.includes("parafuso") || ik.includes("parafuso") || raw.includes("parafuso") || cn.includes("tornillo");

            if (esCorr || esTorn) {
              const idHw = child.userData?.instanciaKey || child.userData?.cleanName || child.name;
              const pRest = getSafeRestPosition(child);
              const pWorld = child.parent ? child.parent.localToWorld(pRest.clone()) : pRest.clone();

              let mejorPieza = "";
              let menorDist = Infinity;
              for (const [nom, box] of Object.entries(piezas)) {
                const d = box.distanceToPoint(pWorld);
                if (d < menorDist) {
                  menorDist = d;
                  mejorPieza = nom;
                }
              }

              if (mejorPieza) {
                if (esCorr) {
                  correderasInfo.push({ id: idHw, pieza: mejorPieza, dist: menorDist, z: pWorld.z });
                } else if (esTorn) {
                  tornillosInfo.push({ id: idHw, pieza: mejorPieza, dist: menorDist, z: pWorld.z });
                }
              }
            }
          }
        });

        // 3. Agrupar por pieza ordenadas de fondo a frente en Z
        const resultadoFinal: Record<string, { correderas: any[]; tornillos: any[] }> = {
          "peça 7": { correderas: [], tornillos: [] },
          "peça 6": { correderas: [], tornillos: [] },
          "peça 10": { correderas: [], tornillos: [] },
        };

        for (const nom of ["peça 7", "peça 6", "peça 10"]) {
          // Correderas
          const deEstaCorr = correderasInfo.filter((c) => c.pieza === nom);
          deEstaCorr.sort((a, b) => a.dist - b.dist);
          const unicasCorr: { id: string; z: number }[] = [];
          for (const c of deEstaCorr) {
            if (!unicasCorr.some((u) => coincidenMismoHerraje(u.id, c.id))) {
              unicasCorr.push({ id: c.id, z: c.z });
            }
          }
          unicasCorr.sort((a, b) => b.z - a.z);

          // Tornillos
          const deEstaTorn = tornillosInfo.filter((t) => t.pieza === nom);
          deEstaTorn.sort((a, b) => a.dist - b.dist);
          const unicasTorn: { id: string; z: number }[] = [];
          for (const t of deEstaTorn) {
            if (!unicasTorn.some((u) => coincidenMismoHerraje(u.id, t.id))) {
              unicasTorn.push({ id: t.id, z: t.z });
            }
          }
          unicasTorn.sort((a, b) => a.z - b.z);

          resultadoFinal[nom] = {
            correderas: unicasCorr.map((u) => ({ id: u.id, z: Math.round(u.z * 100) / 100 })),
            tornillos: unicasTorn.map((u) => ({ id: u.id, z: Math.round(u.z * 100) / 100 })),
          };
        }

        await fetch("/api/gamma-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resultadoFinal),
        });
      } catch {
        // Silencio en fondo
      }
    };

    const intervalReport = setInterval(reportarEscena, 2000);
    setTimeout(reportarEscena, 1000);

    return () => {
      montado = false;
      clearInterval(interval);
      clearInterval(intervalReport);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setVisible(false);
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 dark:bg-slate-950/65 backdrop-blur-md transition-all duration-300 animate-in fade-in"
    >
      <div className="relative max-w-sm w-full mx-4 p-6 rounded-3xl bg-white/95 dark:bg-[#131B2E]/95 border border-[#0088AA]/40 dark:border-[#1368AA]/50 shadow-2xl flex flex-col items-center text-center transition-all scale-100">
        
        {/* Botón de Cierre Manual (Cápsula Redonda) */}
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            fetch("/api/gamma-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ activo: false, mensaje: "Cerrado por usuario" })
            }).catch(() => {});
          }}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-xs font-bold"
          title="Cerrar modal"
        >
          ✕
        </button>
        
        {/* Orbe Holográfico / Esfera de Datos Tech Ethos */}
        <div className="relative flex items-center justify-center w-16 h-16 mb-4">
          {esExito ? (
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 text-2xl font-black shadow-lg shadow-emerald-500/20 animate-in zoom-in-75">
              ✓
            </div>
          ) : (
            <>
              {/* Ondas expansivas de pulso */}
              <span className="absolute w-full h-full rounded-full bg-[#0088AA] dark:bg-[#1368AA] opacity-25 animate-ping" />
              <span className="absolute w-12 h-12 rounded-full bg-cyan-400/20 dark:bg-cyan-500/20 animate-pulse" />
              
              {/* Esfera Núcleo con Gamma */}
              <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-[#0088AA] via-cyan-500 to-sky-300 dark:from-[#1368AA] dark:via-cyan-600 dark:to-sky-400 text-white font-black text-lg shadow-md shadow-[#0088AA]/30">
                Γ
              </div>
            </>
          )}
        </div>

        {/* Título Principal */}
        <h3 className="text-sm font-extrabold tracking-wide mb-1.5 text-slate-900 dark:text-slate-100">
          {esExito ? (
            <span className="text-emerald-600 dark:text-emerald-400">¡Cinemática Sincronizada!</span>
          ) : (
            <span className="text-[#0088AA] dark:text-cyan-400 flex items-center justify-center gap-1.5">
              <span>Gamma en Operación</span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#0088AA] dark:bg-cyan-400 animate-pulse" />
            </span>
          )}
        </h3>

        {/* Descripción / Tarea */}
        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mb-3">
          {esExito
            ? "El prompt técnico y las trayectorias físicas 3D se han integrado a este paso."
            : estado.mensaje || "Calculando vectores colineales y transformaciones en el banco..."}
        </p>

        {/* Píldora de Acción / Estado */}
        <div className="pt-1">
          {esExito ? (
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Presiona PLAY para reproducir (o clic aquí)
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
              Sincronizando con Three.js en vivo...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

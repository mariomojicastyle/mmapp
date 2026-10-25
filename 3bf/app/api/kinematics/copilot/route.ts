import { NextRequest, NextResponse } from "next/server";
import { CapaMultiplePlus, HerrajeCapaPlus, TableroCapaPlus } from "@/lib/storeTypes";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pasoId, capaId, prompt, capa, paso } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "El prompt está vacío." },
        { status: 400 }
      );
    }

    const texto = prompt.toLowerCase();

    // 1. Extraer duración total solicitada (por defecto 20s si menciona 20 o similar)
    let duracionSegundos = 20;
    const durMatch = texto.match(/(\d+)\s*(?:segundos?|s\b)/i);
    if (durMatch && durMatch[1]) {
      const parsed = parseInt(durMatch[1], 10);
      if (!isNaN(parsed) && parsed >= 5 && parsed <= 60) {
        duracionSegundos = parsed;
      }
    }

    // 2. Extraer cota de aproximación en cm (por defecto 60 cm si menciona 60 o altura)
    // CANÓNICO: En taller/Rhino Z es la altura vertical -> Mapeado al eje Y de Three.js
    let alturaAproximacionCm = 60;
    const altMatch = texto.match(/(\d+)\s*(?:cent[ií]metros?|cm\b)/i);
    if (altMatch && altMatch[1]) {
      const parsed = parseInt(altMatch[1], 10);
      if (!isNaN(parsed) && parsed >= 10 && parsed <= 200) {
        alturaAproximacionCm = parsed;
      }
    }

    // 3. Extraer escala inicial de tornillos (por defecto 2.0 = 200% si menciona 200%)
    let escalaInicialTornillos = 2.0;
    let duracionEscalaTornillos = 1.0;
    if (texto.includes("200%") || texto.includes("200 %") || texto.includes("doble")) {
      escalaInicialTornillos = 2.0;
    } else if (texto.includes("sin escala") || texto.includes("escala normal") || texto.includes("100%")) {
      escalaInicialTornillos = 1.0;
    }

    // 4. Detectar orden de tableros mencionados
    const ordenPiezas: string[] = [];
    const menciones: Array<{ nombre: string; idx: number }> = [];

    const buscarPieza = (keywords: string[], canonical: string) => {
      for (const kw of keywords) {
        const pos = texto.indexOf(kw);
        if (pos !== -1) {
          menciones.push({ nombre: canonical, idx: pos });
          break;
        }
      }
    };

    buscarPieza(["pieza número 7", "pieza 7", "peça 7", "pieza 07", "lateral derecho"], "Peça 7");
    buscarPieza(["pieza número 6", "pieza 6", "peça 6", "pieza 06", "división", "division", "central"], "Peça 6");
    buscarPieza(["pieza número 10", "pieza 10", "peça 10", "lateral izquierdo"], "Peça 10");

    menciones.sort((a, b) => a.idx - b.idx);
    menciones.forEach((m) => {
      if (!ordenPiezas.includes(m.nombre)) ordenPiezas.push(m.nombre);
    });

    if (ordenPiezas.length === 0) {
      ordenPiezas.push("Peça 7", "Peça 6", "Peça 10");
    }

    // 5. Agrupar y clasificar los herrajes reales de la capa
    const herrajesOriginales: HerrajeCapaPlus[] = (capa.herrajes || []).map((h: any) => ({ ...h }));

    const esCorredera = (id: string) => /corredi[cç]a/i.test(id) || /corredera/i.test(id) || /fixa/i.test(id);
    const esTornillo = (id: string) => /parafuso/i.test(id) || /tornillo/i.test(id);
    const esTarugo = (id: string) => /cavilha/i.test(id) || /tarugo/i.test(id);

    const correderas = herrajesOriginales.filter((h) => esCorredera(h.id));
    const tornillos = herrajesOriginales.filter((h) => esTornillo(h.id));
    const tarugos = herrajesOriginales.filter((h) => esTarugo(h.id));

    const extraerNum = (id: string) => {
      const m = id.match(/\((\d+)\)/);
      return m ? parseInt(m[1], 10) : 0;
    };
    correderas.sort((a, b) => extraerNum(a.id) - extraerNum(b.id));
    tornillos.sort((a, b) => extraerNum(a.id) - extraerNum(b.id));
    tarugos.sort((a, b) => extraerNum(a.id) - extraerNum(b.id));

    const getHerrajesDePieza = (lista: HerrajeCapaPlus[], nombrePieza: string) => {
      const match = lista.filter((h) => {
        if (h.tableroAnfitrionId) {
          const tabLow = h.tableroAnfitrionId.toLowerCase().replace(/[^a-z0-9]/g, "");
          const pLow = nombrePieza.toLowerCase().replace(/[^a-z0-9]/g, "");
          return tabLow.includes(pLow) || pLow.includes(tabLow);
        }
        return false;
      });
      // Ordenar por coordenada Z (longitudinal en banco: de más alejada a más cercana a la cámara)
      match.sort((a, b) => (a.posRestWorld?.[2] ?? 0) - (b.posRestWorld?.[2] ?? 0));
      return match;
    };

    // Mapeo canónico exacto por física 3D en vivo
    const corrsP7_real = getHerrajesDePieza(correderas, "Peça 7");
    const corrsP6_real = getHerrajesDePieza(correderas, "Peça 6");
    const corrsP10_real = getHerrajesDePieza(correderas, "Peça 10");

    const hwPorGrupo: Record<string, { correderas: HerrajeCapaPlus[]; tornillos: HerrajeCapaPlus[] }> = {
      "Peça 7": {
        correderas: corrsP7_real.length > 0 ? corrsP7_real : correderas.slice(9, 12),
        tornillos: tornillos.slice(18, 24),
      },
      "Peça 6_CaraA": {
        correderas: corrsP6_real.length > 0 ? corrsP6_real.slice(0, 3) : correderas.slice(3, 6),
        tornillos: tornillos.slice(6, 12),
      },
      "Peça 6_CaraB": {
        correderas: corrsP6_real.length > 3 ? corrsP6_real.slice(3, 6) : correderas.slice(6, 9),
        tornillos: tornillos.slice(12, 18),
      },
      "Peça 10": {
        correderas: corrsP10_real.length > 0 ? corrsP10_real : correderas.slice(0, 3),
        tornillos: tornillos.slice(0, 6),
      },
    };

    // 6. Asignar tiempos y coreografía según la duración total solicitada
    const tTotal = duracionSegundos;
    const solicitaTornillos = /tornillo|parafuso/i.test(prompt);
    const solicitaVolteo = /gira|giro|volteo|180|cara b/i.test(prompt);
    const tieneTarugos = tarugos.length > 0 && /tarugo|cavilha/i.test(prompt);

    // MODO FASE 1: Si el prompt solo pide correderas
    const soloCorrederas = !solicitaTornillos && !solicitaVolteo && !tieneTarugos;

    if (soloCorrederas) {
      // Si solo se menciona una pieza específica (ej: Peça 7 únicamente)
      const soloP7 = /pieza\s*(?:número\s*)?7|peça\s*7/i.test(prompt) && !/pieza\s*(?:número\s*)?6|peça\s*6/i.test(prompt) && !/pieza\s*(?:número\s*)?10|peça\s*10/i.test(prompt);

      // Apagar por defecto todos los herrajes a 999s
      herrajesOriginales.forEach((h) => {
        h.tiempoAparicion = 999;
      });

      if (soloP7) {
        // Únicamente animar las 3 correderas de la Peça 7 en cascada
        const corrsP7 = hwPorGrupo["Peça 7"].correderas;
        const step = (tTotal * 0.75) / Math.max(1, corrsP7.length);
        corrsP7.forEach((c, idx) => {
          c.tiempoAparicion = Math.round((0.4 + idx * step) * 10) / 10;
          c.ejeAproximacion = "+Y";
          c.desplazamientoCm = alturaAproximacionCm;
          c.escalaInicial = 1.0;
        });

        return NextResponse.json({
          success: true,
          duracionAudioSegundos: duracionSegundos,
          velocidadHerrajesCmS: 25,
          capaActualizada: {
            ...capa,
            promptCinematico: prompt,
            herrajes: herrajesOriginales,
          },
          volteoIntermedio: { activo: false },
          mensaje: `Cinemática generada: Únicamente las 3 correderas de Peça 7 en cascada (${duracionSegundos}s).`,
        });
      }

      // Si pide las 3 piezas (Peça 7 ➔ Peça 6 Cara A ➔ Peça 10)
      const tiempoPorPieza = (tTotal - 0.5) / 3;
      const animarSolo3Correderas = (
        listaCorrederas: HerrajeCapaPlus[],
        tStart: number,
        tDur: number
      ) => {
        const step = (tDur * 0.75) / Math.max(1, listaCorrederas.length);
        listaCorrederas.forEach((c, idx) => {
          c.tiempoAparicion = Math.round((tStart + idx * step) * 10) / 10;
          c.ejeAproximacion = "+Y";
          c.desplazamientoCm = alturaAproximacionCm;
          c.escalaInicial = 1.0;
        });
      };

      // 1. Peça 7
      animarSolo3Correderas(hwPorGrupo["Peça 7"].correderas, 0.4, tiempoPorPieza);
      // 2. Peça 6 Cara A
      animarSolo3Correderas(hwPorGrupo["Peça 6_CaraA"].correderas, 0.4 + tiempoPorPieza, tiempoPorPieza);
      // 3. Peça 10
      animarSolo3Correderas(hwPorGrupo["Peça 10"].correderas, 0.4 + tiempoPorPieza * 2, tiempoPorPieza);

      return NextResponse.json({
        success: true,
        duracionAudioSegundos: duracionSegundos,
        velocidadHerrajesCmS: 25,
        capaActualizada: {
          ...capa,
          promptCinematico: prompt,
          herrajes: herrajesOriginales,
        },
        volteoIntermedio: { activo: false },
        mensaje: `Cinemática Fase 1 generada (${duracionSegundos}s): 3 correderas en cascada para Peça 7 ➔ Peça 6 ➔ Peça 10.`,
      });
    }

    const animarGrupoCorrederas = (
      grupo: { correderas: HerrajeCapaPlus[]; tornillos: HerrajeCapaPlus[] },
      tStart: number,
      tDur: number
    ) => {
      // Cascada de correderas de alejada a cercana a la cámara (orden inverso de Z o directo según numeración)
      const stepCorr = (tDur * 0.45) / Math.max(1, grupo.correderas.length);
      grupo.correderas.forEach((c, idx) => {
        c.tiempoAparicion = Math.round((tStart + idx * stepCorr) * 10) / 10;
        c.ejeAproximacion = "+Y"; // Desciende verticalmente (Z en taller)
        c.desplazamientoCm = alturaAproximacionCm;
        c.escalaInicial = 1.0;
      });

      // Tornillos bajan de a pares después de las correderas, con escala 200% -> 100%
      const tTornillosStart = tStart + tDur * 0.48;
      const stepTorn = (tDur * 0.5) / Math.max(1, grupo.tornillos.length);
      grupo.tornillos.forEach((trn, idx) => {
        trn.tiempoAparicion = Math.round((tTornillosStart + idx * stepTorn) * 10) / 10;
        trn.ejeAproximacion = "+Y";
        trn.desplazamientoCm = alturaAproximacionCm;
        trn.escalaInicial = escalaInicialTornillos;
        trn.duracionEscalaSegundos = duracionEscalaTornillos;
      });
    };

    const tParaCorrederas = tieneTarugos ? tTotal - 3.8 : tTotal;

    // Tramo 1: Peça 7
    animarGrupoCorrederas(hwPorGrupo["Peça 7"], 0.4, tParaCorrederas * 0.23);

    // Tramo 2: Peça 6 Cara A
    animarGrupoCorrederas(hwPorGrupo["Peça 6_CaraA"], tParaCorrederas * 0.25, tParaCorrederas * 0.22);

    // Tramo 3: Peça 10
    animarGrupoCorrederas(hwPorGrupo["Peça 10"], tParaCorrederas * 0.49, tParaCorrederas * 0.19);

    // Tramo 4: Maniobra de Volteo Peça 6 (180° eje Y)
    const tVolteoInicio = Math.round(tParaCorrederas * 0.69 * 10) / 10;
    const durVolteo = Math.round(tParaCorrederas * 0.15 * 10) / 10;

    const volteoIntermedio = {
      activo: true,
      eje: "Y",
      anguloGrados: 180,
      alturaEjeZCm: alturaAproximacionCm, // Se eleva 60cm en banco durante el giro
      tiempoInicio: tVolteoInicio,
      duracion: durVolteo,
      piezaId: "Peça 6",
    };

    // Tramo 5: Peça 6 Cara B
    const tCaraBStart = Math.round((tVolteoInicio + durVolteo + 0.3) * 10) / 10;
    const durCaraB = Math.max(2.0, tParaCorrederas - tCaraBStart);
    animarGrupoCorrederas(hwPorGrupo["Peça 6_CaraB"], tCaraBStart, durCaraB);

    // Tramo 6: Tarugos al final (Peça 7: 2, Peça 6: 4, Peça 10: 2)
    if (tieneTarugos) {
      let tTarugoCursor = Math.round((tParaCorrederas + 0.2) * 10) / 10;
      const stepTarugo = 0.35; // Cascada uno a uno

      // Peça 7: 2 tarugos
      const tarugosP7 = tarugos.slice(0, 2);
      tarugosP7.forEach((trg) => {
        trg.tiempoAparicion = Math.round(tTarugoCursor * 10) / 10;
        trg.desplazamientoCm = 25;
        tTarugoCursor += stepTarugo;
      });

      // Peça 6: 4 tarugos
      const tarugosP6 = tarugos.slice(2, 6);
      tarugosP6.forEach((trg) => {
        trg.tiempoAparicion = Math.round(tTarugoCursor * 10) / 10;
        trg.desplazamientoCm = 25;
        tTarugoCursor += stepTarugo;
      });

      // Peça 10: 2 tarugos
      const tarugosP10 = tarugos.slice(6, 8);
      tarugosP10.forEach((trg) => {
        trg.tiempoAparicion = Math.round(tTarugoCursor * 10) / 10;
        trg.desplazamientoCm = 25;
        tTarugoCursor += stepTarugo;
      });
    }

    // Consolidar todos los herrajes actualizados
    const herrajesActualizados: HerrajeCapaPlus[] = [
      ...hwPorGrupo["Peça 7"].correderas,
      ...hwPorGrupo["Peça 7"].tornillos,
      ...hwPorGrupo["Peça 6_CaraA"].correderas,
      ...hwPorGrupo["Peça 6_CaraA"].tornillos,
      ...hwPorGrupo["Peça 10"].correderas,
      ...hwPorGrupo["Peça 10"].tornillos,
      ...hwPorGrupo["Peça 6_CaraB"].correderas,
      ...hwPorGrupo["Peça 6_CaraB"].tornillos,
      ...tarugos,
    ];

    herrajesOriginales.forEach((orig) => {
      if (!herrajesActualizados.some((h) => h.id === orig.id)) {
        herrajesActualizados.push(orig);
      }
    });

    const capaActualizada: CapaMultiplePlus = {
      ...capa,
      promptCinematico: prompt,
      herrajes: herrajesActualizados,
    };

    return NextResponse.json({
      success: true,
      duracionAudioSegundos: duracionSegundos,
      velocidadHerrajesCmS: 25,
      capaActualizada,
      volteoIntermedio,
      mensaje: `Cinemática generada exitosamente (${duracionSegundos}s): Peça 7 ➔ Peça 6 ➔ Peça 10 ➔ Volteo 180° ➔ Cara B${tieneTarugos ? ' ➔ Tarugos en cascada' : ''}.`,
    });
  } catch (err: any) {
    console.error("[Copilot Kinematics API] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Error al procesar cinemática." },
      { status: 500 }
    );
  }
}

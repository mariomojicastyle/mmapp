import React from 'react';
import * as THREE from 'three';
import { MaterialPBRDef, CapaDef, AsignacionParteDef } from '@/lib/store';

export interface MaterialPropertiesInput {
  name: string;
  cleanName: string;
  instanciaKey?: string;
  size?: [number, number, number];
  mainColor: string;
  modoVisual: string;
  capas: CapaDef[];
  materialesPBR: MaterialPBRDef[];
  asignacionesPartes: Record<string, AsignacionParteDef>;
  calibracion: any;
  coloresApariencia: any;
  hasMap: boolean;
  esDuplicado: boolean;
  estaSeleccionadaEnPicking: boolean;
  pestanaActiva?: string;
}

export interface ResolvedMaterialProperties {
  finalMeshColor: string;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  roughness: number;
  metalness: number;
  isWireframe: boolean;
  nombreMaterialEfectivo: string;
  normalScaleVal: number;
  envMapIntensityEfectivo: number;
  materialPBR: MaterialPBRDef | null;
  capaAsignada: CapaDef | null;
  isWoodBoard: boolean;
  isHardware: boolean;
  isHardwareCorredera: boolean;
  isHardwareCantoneira: boolean;
  isHardwarePata: boolean;
  isHardwarePorca: boolean;
  isHardwareTampa: boolean;
  isHardwarePerno: boolean;
  isHardwarePrego: boolean;
  isHardwareSuporte: boolean;
  isHardwareTarugo: boolean;
  isHardwareCaja: boolean;
  isBalance: boolean;
  isMdpExpuesto: boolean;
  esParalelepipedo: boolean;
}

export function resolverPropiedadesMaterial(p: MaterialPropertiesInput): ResolvedMaterialProperties {
  const normalizeKey = (k: string) => k.replace(/^RH_OUT:/i, '').replace(/[_\s]+/g, ' ').trim().toLowerCase();
  const normName = normalizeKey(p.name);

  // 1. Asignación de parte
  let asignacion = p.asignacionesPartes[p.name] || 
                   p.asignacionesPartes[p.cleanName] || 
                   p.asignacionesPartes[`RH_OUT:${p.cleanName}`];

  if (!asignacion) {
    const exactMatchedKey = Object.keys(p.asignacionesPartes).find((k) => normalizeKey(k) === normName);
    if (exactMatchedKey) {
      asignacion = p.asignacionesPartes[exactMatchedKey];
    } else {
      const baseCleanName = p.cleanName.replace(/2$/, '').replace(/_Color$|_MDP$|_Balance$/i, '').trim();
      const normBase = baseCleanName ? normalizeKey(baseCleanName) : '';
      if (normBase && normBase !== normName) {
        const baseMatchedKey = Object.keys(p.asignacionesPartes).find((k) => normalizeKey(k) === normBase);
        if (baseMatchedKey) asignacion = p.asignacionesPartes[baseMatchedKey];
      }
    }
  }

  const isWireframe = false;
  const isTransparent = p.modoVisual === 'semitransparente' || p.modoVisual === 'lineas';
  const isHardwarePerno = normName.includes('perno') || normName.includes('tornillo') || normName.includes('parafuso');
  const isHardwarePrego = normName.includes('prego') || normName.includes('puntilla') || normName.includes('clavo') || normName.includes('tachuela') || normName.includes('grampo');
  const isHardwareCaja = (normName.includes('caja') && !normName.includes('cajon') && !normName.includes('cajón')) || normName === 'caja' || normName.includes('minifix') || normName.includes('girofix') || normName.includes('tambor');
  const isHardwareTarugo = normName.includes('tarugo') || normName.includes('cavilha') || normName.includes('clavilha') || normName.includes('espiga');
  const isHardwareSuporte = normName.includes('suporte') || normName.includes('soporte') || normName.includes('esquadro') || normName.includes('mao francesa') || normName.includes('mão francesa');
  const isHardwarePata = normName.includes('pes') || normName.includes('pés') || normName.includes('pata') || normName.includes('pie') || normName.includes('sapata') || normName.includes('deslizador') || normName.includes('nivelador');
  const isHardwareCorredera = normName.includes('corredera') || normName.includes('corredi') || normName.includes('trilho');
  const isHardwareCorrederaSeguro =
    (p.instanciaKey && (p.instanciaKey.toLowerCase().includes('segur') || p.instanciaKey.toLowerCase().includes('gatill'))) ||
    normName.includes('segur') ||
    normName.includes('gatill') ||
    (isHardwareCorredera && (p.size && p.size.length === 3 && Math.min(p.size[0], p.size[1], p.size[2]) < 0.005 && p.size[1] < 0.015));
  const isHardwareCantoneira = normName.includes('cantoneira') || normName.includes('cantonera') || normName.includes('angulo') || normName.includes('ángulo') || normName.includes('esquinero');
  const isHardwarePorca = normName.includes('porca') || normName.includes('tuerca') || normName.includes('bucha');
  const isHardwareTampa = normName.includes('tampa') || normName.includes('tapa') || normName.includes('adesivo') || normName.includes('tapon') || normName.includes('tapón');
  const isHardware = isHardwarePerno || isHardwarePrego || isHardwareCaja || isHardwareTarugo || isHardwareSuporte || isHardwarePata || isHardwareCorredera || isHardwareCantoneira || isHardwarePorca || isHardwareTampa || normName.includes('bisagra') || normName.includes('dobradiça') || normName.includes('dobradi') || normName.includes('puxador') || normName.includes('manija') || normName.includes('tirador') || normName.includes('jaladera') || normName.includes('perfil');
  const isMachining = normName.includes('maquinado') || normName.includes('perforado');
  const isWoodBoard = !isHardware && !isMachining;

  const isBalance = (
    normName.includes('balance') ||
    normName.includes('equilibrio') ||
    normName.includes('reverso') ||
    normName.endsWith(' b') ||
    normName.endsWith('_b') ||
    normName.endsWith('-b') ||
    /pe[cç]a\s*\d+\s*b$/i.test(normName) ||
    /pk\s*\d+\s*b$/i.test(normName)
  );

  const isFondoBoard = (
    normName.includes('fondo') ||
    normName.includes('fundo') ||
    normName.includes('tono fondo') ||
    normName.includes('costa') ||
    normName.includes('costas') ||
    normName.includes('espaldar') ||
    normName.includes('trasera') ||
    normName.includes('back') ||
    normName.includes('peça 15') ||
    normName.includes('peca 15') ||
    normName.includes('pk15') ||
    normName.includes('peça 18') ||
    normName.includes('peca 18') ||
    normName.includes('pk18') ||
    (isWoodBoard && p.size && p.size.length === 3 && Math.min(p.size[0], p.size[1], p.size[2]) <= 0.005 && Math.min(p.size[0], p.size[1], p.size[2]) >= 0.001)
  ) && !normName.includes('mdf') && !normName.includes('mdp');

  // 2. Capa asignada
  let capaAsignada: any = null;
  if (asignacion && asignacion.capaId && asignacion.capaId !== 'por_defecto') {
    capaAsignada = p.capas.find((c) => c.id === asignacion.capaId) || null;
  }
  
  // Heurísticas automáticas SOLO si no hay asignación manual explícita
  if (!capaAsignada) {
    if (normName.includes('mdf')) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_mdf' || c.nombre.toLowerCase() === 'mdf') || p.capas[0];
    } else if (isFondoBoard) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_tono_fondo' || c.nombre.toLowerCase().includes('tono fondo') || c.nombre.toLowerCase().includes('fondo')) || p.capas[0];
    } else if (isHardwareCorredera || isHardwarePrego) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_acero' || c.id === 'capa_zincado' || c.nombre.toLowerCase().includes('acero') || c.nombre.toLowerCase().includes('zinc')) || p.capas.find((c) => c.id === 'capa_herrajes') || p.capas[0];
    } else if (isHardwareCantoneira) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_zincado' || c.id === 'capa_zinc' || c.id === 'capa_acero' || c.nombre.toLowerCase().includes('zinc') || c.nombre.toLowerCase().includes('acero')) || p.capas.find((c) => c.id === 'capa_herrajes') || p.capas[0];
    } else if (isHardwarePata) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_plastico_1' || c.id === 'capa_plastico_2' || c.nombre.toLowerCase().includes('plastico')) || p.capas.find((c) => c.id === 'capa_herrajes') || p.capas[0];
    } else if (isHardwareTampa) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_tono' || (c.nombre.toLowerCase().includes('tono') && !c.nombre.toLowerCase().includes('fondo'))) || p.capas[0];
    } else if (isHardwarePorca || isHardwareSuporte || normName.includes('perfil')) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_plastico_2' || c.id === 'capa_plastico_1' || c.nombre.toLowerCase().includes('plastico')) || p.capas.find((c) => c.id === 'capa_herrajes') || p.capas[0];
    } else if (isHardwarePerno) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_herrajes' || c.id === 'capa_acero' || c.nombre.toLowerCase().includes('acero') || c.nombre.toLowerCase().includes('herraje'));
    } else if (isHardwareCaja) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_zincado' || c.id === 'capa_zinc' || c.nombre.toLowerCase().includes('zinc'));
    } else if (isHardwareTarugo) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_madera' || c.nombre.toLowerCase().includes('madera'));
    } else if (isMachining) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_perforados' || c.nombre.toLowerCase().includes('perforad'));
    } else if (isBalance) {
      capaAsignada = p.capas.find((c) => c.id === 'capa_back' || c.id === 'capa_espaldar' || c.nombre.toLowerCase().includes('back') || c.nombre.toLowerCase().includes('balance'));
    } else if (normName.includes('mdp')) {
      if (p.pestanaActiva === 'manual') {
        capaAsignada = p.capas.find((c) => c.id === 'capa_tono' || (c.nombre.toLowerCase().includes('tono') && !c.nombre.toLowerCase().includes('fondo'))) || p.capas[0];
      } else {
        capaAsignada = p.capas.find((c) => c.id === 'capa_mdp' || c.nombre.toLowerCase() === 'mdp');
      }
    } else {
      capaAsignada = p.capas.find((c) => c.id === 'capa_tono' || (c.nombre.toLowerCase().includes('tono') && !c.nombre.toLowerCase().includes('fondo'))) || p.capas.find(c => c.id !== 'capa_acero') || p.capas[0];
    }
  }
  if (!capaAsignada && p.capas.length > 0) {
    capaAsignada = p.capas[0];
  }

  // 3. Material PBR
  let materialPBR: MaterialPBRDef | null = null;
  if (asignacion && asignacion.materialId && asignacion.materialId !== 'por_capa') {
    materialPBR = p.materialesPBR.find((m) => m.id === asignacion.materialId) || null;
  } else if (capaAsignada) {
    materialPBR = p.materialesPBR.find((m) => m.id === capaAsignada.materialId) || null;
  }

  const isMdpExpuesto = normName.includes('mdp');
  const isMelaminaCara = (normName.includes('color') || !isBalance) && !isMdpExpuesto;

  // 4. Color y Shaders
  let meshColor = p.mainColor;
  let metalness = p.calibracion.metalicidadMadera ?? 0.1;
  let roughness = p.calibracion.rugosidadMadera ?? 0.4;
  let opacity = isTransparent ? 0.52 : (p.calibracion.opacidadMadera ?? 1.0);
  let transparent = isTransparent || opacity < 0.99;
  let depthWrite = !transparent || opacity >= 0.95;

  if (p.esDuplicado) {
    meshColor = '#EF4444';
    metalness = 0.3;
    roughness = 0.25;
    opacity = 0.95;
    transparent = false;
    depthWrite = true;
  } else if (isHardwareCorrederaSeguro) {
    meshColor = '#1E293B';
    metalness = 0.05;
    roughness = 0.65;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwareCorredera || isHardwarePrego) {
    meshColor = p.coloresApariencia.colorHerrajes || '#E2E8F0';
    metalness = 0.92;
    roughness = 0.18;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwareCantoneira) {
    meshColor = p.coloresApariencia.colorHerrajes || '#94A3B8';
    metalness = 0.88;
    roughness = 0.22;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwarePerno) {
    meshColor = p.coloresApariencia.colorHerrajes || '#9CA3AF';
    metalness = 0.85;
    roughness = 0.25;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwareCaja) {
    meshColor = p.coloresApariencia.colorHerrajes || '#D97706';
    metalness = 0.75;
    roughness = 0.3;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwareTarugo) {
    meshColor = p.coloresApariencia.colorHerrajes || '#B45309';
    metalness = 0.0;
    roughness = 0.8;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwarePata) {
    meshColor = '#1E293B';
    metalness = 0.1;
    roughness = 0.6;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwareTampa) {
    meshColor = p.mainColor || '#F4F4F5';
    metalness = p.calibracion.metalicidadMadera ?? 0.05;
    roughness = p.calibracion.rugosidadMadera ?? 0.55;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isHardwarePorca || isHardwareSuporte) {
    meshColor = '#F4F4F5';
    metalness = 0.05;
    roughness = 0.35;
    opacity = 1.0;
    transparent = false;
    depthWrite = true;
  } else if (isMachining) {
    meshColor = '#EF4444';
    metalness = 0.2;
    roughness = 0.5;
    opacity = 0.6;
    transparent = true;
  } else if (isWoodBoard) {
    roughness = isTransparent ? 0.75 : (isMdpExpuesto ? 0.85 : (isBalance ? 0.5 : (p.calibracion.rugosidadMadera ?? 0.58)));
    metalness = isTransparent ? 0.0 : (isMdpExpuesto ? 0.0 : (isBalance ? 0.0 : (p.calibracion.metalicidadMadera ?? 0.20)));
    opacity = isTransparent ? 0.52 : (p.calibracion.opacidadMadera ?? 1.0);
    transparent = isTransparent || opacity < 0.99;
    depthWrite = !isTransparent && opacity >= 0.95;
  }

  if (materialPBR && p.modoVisual !== 'semitransparente') {
    meshColor = materialPBR.colorBase;
    const esMaderaCalibrada = isWoodBoard && (materialPBR.tipo === 'Madera' || materialPBR.tipo === 'Melamina');
    metalness = esMaderaCalibrada ? (p.calibracion.metalicidadMadera ?? materialPBR.metalico) : materialPBR.metalico;
    roughness = esMaderaCalibrada ? (p.calibracion.rugosidadMadera ?? materialPBR.rugosidad) : materialPBR.rugosidad;
    if (materialPBR.opacidad < 1.0 || (p.calibracion.opacidadMadera ?? 1.0) < 0.99) {
      opacity = Math.min(materialPBR.opacidad, p.calibracion.opacidadMadera ?? 1.0);
      transparent = true;
      depthWrite = opacity >= 0.95;
    }
  }

  let finalMeshColor = meshColor;
  if (p.modoVisual === 'semitransparente') {
    if (isHardware) {
      finalMeshColor = (isHardwareCorredera || isHardwarePrego)
        ? '#F8FAFC' 
        : (isHardwareCantoneira ? '#E2E8F0' : (isHardwarePata ? '#1E293B' : (isHardwareTampa ? meshColor : (isHardwarePorca || isHardwareSuporte ? '#F4F4F5' : (p.coloresApariencia.colorHerrajes || '#CBD5E1')))));
      opacity = 1.0;
      roughness = (isHardwarePata || isHardwarePorca || isHardwareSuporte || isHardwareTampa) ? 0.4 : 0.18;
      metalness = (isHardwarePata || isHardwarePorca || isHardwareSuporte || isHardwareTampa) ? 0.05 : 0.92;
      transparent = false;
      depthWrite = true;
    } else {
      finalMeshColor = p.coloresApariencia.mallasCristal || '#0284C7';
      opacity = 0.35;
      roughness = 0.25;
      metalness = 0.05;
      transparent = true;
      depthWrite = false;
    }
  } else if (p.modoVisual === 'lineas') {
    if (isHardware) {
      finalMeshColor = isHardwareCorredera 
        ? '#334155' 
        : (isHardwarePata 
            ? '#334155' 
            : (isHardwareCantoneira 
                ? '#64748B' 
                : (isHardwarePorca || isHardwareTampa ? '#E2E8F0' : (p.coloresApariencia.colorHerrajes || '#64748B'))));
      opacity = 0.35;
      roughness = 0.5;
      metalness = 0.2;
      transparent = true;
      depthWrite = false;
    } else {
      finalMeshColor = capaAsignada?.color || (materialPBR ? materialPBR.colorBase : (p.coloresApariencia.materialPorDefecto || p.calibracion.colorSolido || '#CBD5E1'));
      opacity = 0.35;
      roughness = 0.75;
      metalness = 0.0;
      transparent = true;
      depthWrite = false;
    }
  } else if (p.modoVisual === 'solido') {
    finalMeshColor = capaAsignada?.color || (materialPBR ? materialPBR.colorBase : (p.coloresApariencia.materialPorDefecto || p.calibracion.colorSolido || '#CBD5E1'));
    if (isWoodBoard) {
      roughness = p.calibracion.rugosidadMadera ?? 0.58;
      metalness = p.calibracion.metalicidadMadera ?? 0.20;
      opacity = p.calibracion.opacidadMadera ?? 1.0;
      transparent = opacity < 0.99;
      depthWrite = opacity >= 0.95;
    }
  } else if (p.modoVisual === 'renderizado') {
    if (p.hasMap) {
      finalMeshColor = '#ffffff';
    } else if (materialPBR) {
      finalMeshColor = materialPBR.colorBase;
    } else if (isMdpExpuesto) {
      finalMeshColor = p.pestanaActiva === 'manual' ? (p.mainColor || p.calibracion.colorSolido || '#CBD5E1') : '#D5B88A';
    } else if (isBalance) {
      finalMeshColor = '#F9FAFB';
    } else {
      finalMeshColor = p.calibracion.colorSolido || '#CBD5E1';
    }
    if (materialPBR) {
      const esMaderaCalibrada = isWoodBoard && (materialPBR.tipo === 'Madera' || materialPBR.tipo === 'Melamina');
      roughness = esMaderaCalibrada ? (p.calibracion.rugosidadMadera ?? materialPBR.rugosidad) : materialPBR.rugosidad;
      metalness = esMaderaCalibrada ? (p.calibracion.metalicidadMadera ?? materialPBR.metalico) : materialPBR.metalico;
      if (materialPBR.opacidad !== undefined) {
        opacity = materialPBR.opacidad;
        transparent = opacity < 0.99;
        depthWrite = opacity >= 0.95;
      }
    } else if (isWoodBoard) {
      roughness = p.calibracion.rugosidadMadera ?? 0.58;
      metalness = p.calibracion.metalicidadMadera ?? 0.20;
      opacity = p.calibracion.opacidadMadera ?? 1.0;
      transparent = opacity < 0.99;
      depthWrite = opacity >= 0.95;
    }
  }

  const nombreMaterialEfectivo = materialPBR ? materialPBR.nombre : (isWoodBoard ? 'M_Marfil' : (isHardwarePata || isHardwarePorca || isHardwareTampa || isHardwareSuporte || normName.includes('perfil') ? 'P_Blanco' : (isHardwarePerno || isHardwarePrego ? 'Acero' : (isHardwareCaja ? 'Zinc' : 'PBR_Default'))));
  const normalScaleVal = materialPBR?.normalScale ?? 1.0;

  const luzEntornoConfig = p.calibracion.lucesEstudio?.['env_hdri'];
  const baseEnvIntensity = (p.modoVisual === 'renderizado' && (luzEntornoConfig ? luzEntornoConfig.activa : true))
    ? (luzEntornoConfig?.intensidad ?? p.calibracion.intensidadLuzEntorno ?? 0.55)
    : 0.0;
  const esPiezaMetalica = isHardware || metalness >= 0.5 || materialPBR?.tipo === 'Metal';
  const envMapIntensityEfectivo = esPiezaMetalica
    ? Math.max(baseEnvIntensity * 1.5, 1.15)
    : baseEnvIntensity;

  const noEsParalelepipedo = isHardware || isMachining || isHardwareTampa || isHardwareSuporte || isHardwarePrego ||
    normName.includes('tampa') || 
    normName.includes('suporte') || 
    normName.includes('soporte') || 
    normName.includes('prego') || 
    normName.includes('puntilla') || 
    normName.includes('clavo') || 
    normName.includes('tarugo') || 
    normName.includes('cavilha') || 
    normName.includes('curv') || 
    normName.includes('arco') || 
    normName.includes('cilindr') || 
    normName.includes('chaflan') || 
    normName.includes('bisel') ||
    normName.includes('frente') ||
    normName.includes('gaveta') ||
    normName.includes('cajon') ||
    normName.includes('uñero') ||
    normName.includes('unero') ||
    normName.includes('peça 19') ||
    normName.includes('peca 19') ||
    normName.includes('angulo');

  const esParalelepipedo = !isHardware && isWoodBoard && !noEsParalelepipedo;


  return {
    finalMeshColor,
    opacity,
    transparent,
    depthWrite,
    roughness,
    metalness,
    isWireframe,
    nombreMaterialEfectivo,
    normalScaleVal,
    envMapIntensityEfectivo,
    materialPBR,
    capaAsignada,
    isWoodBoard,
    isHardware,
    isHardwareCorredera,
    isHardwareCantoneira,
    isHardwarePata,
    isHardwarePorca,
    isHardwareTampa,
    isHardwarePerno,
    isHardwarePrego,
    isHardwareSuporte,
    isHardwareTarugo,
    isHardwareCaja,
    isBalance,
    isMdpExpuesto,
    esParalelepipedo
  };
}

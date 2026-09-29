/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from "three";
import JSZip from "jszip";
import { PasoManualStudio, use3BFStore } from "./store";
import { compilarAnimacionPaso } from "./manualAnimationEngine";
import { extraerPiezaMadre, perteneceAMismaFamiliaPieza, esHerrajeNombre } from "./piezaMadreUtils";
import { coincidenMismoHerraje, isHardwareMeshName } from "./engine/cadStateUtils";
import { coincideMallaConTablero } from "./engine/multiplePlusKinematics";

/**
 * Exporta un único paso como archivo GLB animado estándar glTF 2.0.
 */
/**
 * Exporta un único paso como archivo GLB animado estándar glTF 2.0
 * ultra-optimizado (512px JPEG, deduplicación de geometrías/materiales, sin planos/aristas y compresión Draco < 2 MB).
 */
export async function exportarGlbPasoManual(
  scene: THREE.Object3D,
  paso: PasoManualStudio
): Promise<{ buffer: ArrayBuffer; filename: string; sizeMb: string }> {
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const exporter = new GLTFExporter();

  // 📦 SOPORTE NATIVO PARA BLOQUES ESTÁNDAR (Ej: Corredera Telescópica 350 desacoplable)
  if (paso.tipo === "bloque_estandar") {
    let bloqueGroup: THREE.Object3D | null = null;
    if (typeof window !== "undefined" && (window as any).__bloqueEstandarGroup) {
      bloqueGroup = (window as any).__bloqueEstandarGroup;
    } else {
      scene.traverse((child) => {
        if (child.name === "Guia_Fija" || child.name === "Guia_Intermedia" || child.name === "Guia_Movil") {
          bloqueGroup = child.parent || child;
        }
      });
    }

    if (!bloqueGroup) {
      throw new Error("El modelo 3D del bloque estándar aún no ha terminado de cargar en el visor.");
    }

    // Clonar la jerarquía limpia del bloque estándar
    const exportBloqueScene = new THREE.Scene();
    exportBloqueScene.name = "Scene";
    const clonBloque = bloqueGroup.clone(true);
    exportBloqueScene.add(clonBloque);

    // Identificar los nodos clave para animación por nombre
    let nodeFija: THREE.Object3D | null = null;
    let nodeIntermedia: THREE.Object3D | null = null;
    let nodeMovil: THREE.Object3D | null = null;
    let nodeSeguroGroup: THREE.Object3D | null = null;
    let nodeSeguroPivot: THREE.Object3D | null = null;

    clonBloque.traverse((child) => {
      if (child.name === "Guia_Fija") nodeFija = child;
      if (child.name === "Guia_Intermedia") nodeIntermedia = child;
      if (child.name === "Guia_Movil") nodeMovil = child;
      if (child.name === "Seguro_Group") nodeSeguroGroup = child;
      if (child.name === "Seguro_Pivot") nodeSeguroPivot = child;
    });

    const duracion = Math.max(paso.duracionTotal || 8.0, 1.0);
    const centroZOffset = 0.175;
    const PIVOTE_SEGURO: [number, number, number] = [0.001, 0.0016, -0.159];

    // Fases temporales proporcionales a la duración del paso:
    const durExt = duracion * 0.35;
    const startGiro = duracion * 0.35;
    const durGiro = duracion * 0.15;
    const startSep = duracion * 0.50;
    const durSep = duracion * 0.30;
    const startRetorno = duracion * 0.78;
    const durRetorno = duracion * 0.11;

    // Resamplear 81 keyframes a lo largo de la duración total del paso usando la cinemática física exacta
    const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const times: number[] = [];
    const posIntermediaVals: number[] = [];
    const posMovilVals: number[] = [];
    const rotSeguroVals: number[] = [];

    const numSamples = 81;
    for (let i = 0; i < numSamples; i++) {
      const curT = (i / (numSamples - 1)) * duracion;
      times.push(curT);

      // Fase 1: Extensión total (0% a 35%)
      const tExt = Math.min(durExt, curT);
      const pExt = easeInOutCubic(durExt > 0 ? tExt / durExt : 1);
      const despIntermedia = pExt * 0.145;
      const despMovilFase1 = pExt * 0.275;

      // Fase 2 & 4: Rotación de palanca (35% a 50% giro, 78% a 89% retorno)
      let rotSeguroY = 0;
      if (curT > startGiro && curT <= startRetorno) {
        const tGiro = Math.min(durGiro, curT - startGiro);
        const pGiro = easeInOutCubic(durGiro > 0 ? tGiro / durGiro : 1);
        rotSeguroY = -pGiro * ((10.0 * Math.PI) / 180);
      } else if (curT > startRetorno) {
        const tRetorno = Math.min(durRetorno, curT - startRetorno);
        const pRetorno = easeInOutCubic(durRetorno > 0 ? tRetorno / durRetorno : 1);
        rotSeguroY = -(1 - pRetorno) * ((10.0 * Math.PI) / 180);
      }

      // Fase 3: Desacople recto (50% a 80%)
      let despSeparacionZ = 0;
      if (curT > startSep) {
        const tSep = Math.min(durSep, curT - startSep);
        const pSep = easeInOutCubic(durSep > 0 ? tSep / durSep : 1);
        despSeparacionZ = pSep * 0.32;
      }

      const posTotalMovilZ = centroZOffset + despMovilFase1 + despSeparacionZ;

      // Posición de Intermedia
      posIntermediaVals.push(0, 0, centroZOffset + despIntermedia);

      // Posición de Móvil y Grupo Seguro
      posMovilVals.push(0, 0, posTotalMovilZ);

      // Cuaternión de Rotación de Seguro en su eje Y
      const qSeguro = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotSeguroY);
      rotSeguroVals.push(qSeguro.x, qSeguro.y, qSeguro.z, qSeguro.w);
    }

    const bloqueTracks: THREE.KeyframeTrack[] = [];
    if (nodeIntermedia) {
      bloqueTracks.push(new THREE.VectorKeyframeTrack(`${(nodeIntermedia as any).uuid}.position`, times, posIntermediaVals));
    }
    if (nodeMovil) {
      bloqueTracks.push(new THREE.VectorKeyframeTrack(`${(nodeMovil as any).uuid}.position`, times, posMovilVals));
    }
    if (nodeSeguroGroup) {
      bloqueTracks.push(new THREE.VectorKeyframeTrack(`${(nodeSeguroGroup as any).uuid}.position`, times, posMovilVals));
    }
    if (nodeSeguroPivot) {
      bloqueTracks.push(new THREE.QuaternionKeyframeTrack(`${(nodeSeguroPivot as any).uuid}.quaternion`, times, rotSeguroVals));
    }

    const bloqueClip = new THREE.AnimationClip("default", duracion, bloqueTracks);

    // Parsear con GLTFExporter
    const rawBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(
        exportBloqueScene,
        (gltf) => resolve(gltf as ArrayBuffer),
        (error) => {
          console.error("[ExportManualGLB] Error al parsear bloque estándar glTF:", error);
          reject(error);
        },
        {
          binary: true,
          animations: [bloqueClip],
          maxTextureSize: 512,
          includeCustomExtensions: false,
        }
      );
    });

    let finalBuffer: ArrayBuffer = rawBuffer;
    try {
      const res = await fetch(`/api/compress-glb?mode=download&name=${encodeURIComponent(paso.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: rawBuffer,
      });
      if (res.ok) {
        finalBuffer = await res.arrayBuffer();
      }
    } catch (compErr) {
      console.warn("[ExportManualGLB] Fallback compresión bloque estándar:", compErr);
    }

    const filename = `${paso.id}.glb`;
    const sizeMb = (finalBuffer.byteLength / (1024 * 1024)).toFixed(2);
    console.log(`[ExportManualGLB] 🚀 Bloque estándar ${filename}: ${sizeMb} MB`);

    return {
      buffer: finalBuffer,
      filename,
      sizeMb,
    };
  }

  // 0. Purgar cualquier residuo de auras de destello que hayan quedado en la escena viva
  const aurasEnEscena = scene.children.filter((c) => c.name?.startsWith("Aura_") || (c as any).userData?.isAuraDestelloHelper);
  aurasEnEscena.forEach((a) => scene.remove(a));
  scene.traverse((child) => {
    if (child.children && child.children.length > 0) {
      const auras = child.children.filter((c) => c.name?.startsWith("Aura_") || c.name?.includes("AuraDestello") || (c as any).userData?.isAuraDestelloHelper);
      auras.forEach((a) => child.remove(a));
    }
  });

  // 1. Crear escena de exportación limpia y aislada
  const exportScene = new THREE.Scene();
  exportScene.name = "Scene";

  // 1.1. Crear el grupo raíz del mueble preservando rigurosamente su orientación en el banco de trabajo
  // (rotación de taller X/Y/Z y apoyo físico en el suelo Y = 0)
  const furnitureRoot = new THREE.Group();
  furnitureRoot.name = (scene.name && scene.name !== "Scene") ? scene.name : "Mueble";

  scene.getWorldPosition(furnitureRoot.position);
  scene.getWorldQuaternion(furnitureRoot.quaternion);
  scene.getWorldScale(furnitureRoot.scale);
  furnitureRoot.updateMatrix();
  furnitureRoot.updateMatrixWorld(true);

  exportScene.add(furnitureRoot);

  // Caché para optimizar exactamente 1 solo bitmap (512x512 JPEG) por textura única
  const textureOptimizedCache = new Map<string, THREE.Texture>();
  const getOptimized512Texture = (srcTexture: THREE.Texture): THREE.Texture => {
    const cacheKey = (srcTexture.image as any)?.src || srcTexture.uuid || srcTexture.name || "tex";
    if (textureOptimizedCache.has(cacheKey)) {
      return textureOptimizedCache.get(cacheKey)!;
    }

    try {
      const targetSize = 512;
      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d");

      if (ctx && srcTexture.image) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(srcTexture.image, 0, 0, targetSize, targetSize);

        const optTexture = new THREE.CanvasTexture(canvas);
        optTexture.name = (srcTexture.name || "Texture") + "_512";
        optTexture.wrapS = srcTexture.wrapS;
        optTexture.wrapT = srcTexture.wrapT;
        optTexture.repeat.copy(srcTexture.repeat);
        optTexture.offset.copy(srcTexture.offset);
        optTexture.rotation = srcTexture.rotation;
        optTexture.center.copy(srcTexture.center);
        optTexture.flipY = srcTexture.flipY;
        optTexture.userData = { mimeType: "image/jpeg" };
        optTexture.needsUpdate = true;

        textureOptimizedCache.set(cacheKey, optTexture);
        return optTexture;
      }
    } catch (err) {
      console.warn("[ExportManualGLB] Fallback textura original:", err);
    }
    return srcTexture;
  };

  const materialOptimizedCache = new Map<string, THREE.MeshStandardMaterial>();

  // 1.1. Asegurar que las mallas estén en su posición de reposo del banco de trabajo
  // (cajones cerrados a 0.0 mm y sin desfase de scrubber), preservando rigurosamente
  // las coordenadas del banco de trabajo (__bancoPosition / __baseRestPosition).
  const animatedStates = new Map<THREE.Object3D, { pos: THREE.Vector3; quat: THREE.Quaternion; scale: THREE.Vector3 }>();
  scene.traverse((child) => {
    if (child.userData?.__bancoPosition || child.userData?.__baseRestPosition) {
      animatedStates.set(child, {
        pos: child.position.clone(),
        quat: child.quaternion.clone(),
        scale: child.scale.clone(),
      });
      const restPos = child.userData.__bancoPosition || child.userData.__baseRestPosition;
      const restQuat = child.userData.__bancoQuaternion || child.userData.__baseRestQuaternion;
      if (restPos) {
        child.position.copy(restPos);
      }
      if (restQuat) {
        child.quaternion.copy(restQuat);
      }
      if (child.userData.__baseRestScale) {
        child.scale.copy(child.userData.__baseRestScale);
      }
    }
  });
  scene.updateMatrixWorld(true);

  // 1.9. Preparar el conjunto de piezas y herrajes heredados de pasos previos
  const storeState = use3BFStore.getState();
  const todosLosPasos = storeState.pasosManual || [];
  const currentIndex = todosLosPasos.findIndex((p: any) => p.id === paso.id);
  const pasosPrevios = currentIndex > 0 ? todosLosPasos.slice(0, currentIndex) : [];

  const bloquesHeredadosIds = [
    ...(paso.bloquesHeredadosIds || []),
    ...((paso.multiplePlus?.capas || []).flatMap((c: any) => c.bloquesHeredadosIds || [])),
  ];

  const pasosAProcesar = new Map<string, PasoManualStudio>();
  const piezasHeredadasSet = new Set<string>();
  const herrajesHeredadosSet = new Set<string>();

  // 🛡️ REGLA DE BANCO AISLADO: Si el paso tiene "ocultarNoAsignadas: true" (Mesa Limpia) o declara bloques específicos, NO forzar la carcasa previa
  const heredarCronologicoAuto = !paso.ocultarNoAsignadas && (bloquesHeredadosIds.length === 0);
  if (heredarCronologicoAuto) {
    pasosPrevios.forEach((p: any) => pasosAProcesar.set(p.id, p));
  }

  bloquesHeredadosIds.forEach((id) => {
    if (paso.bloquesHeredadosVisibles?.[id] !== false) {
      // ⚡ A) ¿Es un Bloque Funcional individual?
      const cleanBfId = id.replace(/^BF:/i, "").trim().toLowerCase();
      const pasoShowcase = todosLosPasos.find((x: any) => x.showcase?.gruposCinematicos && x.showcase.gruposCinematicos.length > 0) || todosLosPasos[0];
      const grupoBF = pasoShowcase?.showcase?.gruposCinematicos?.find(
        (g: any) => g.id.toLowerCase() === cleanBfId || g.nombre.toLowerCase() === cleanBfId
      );

      if (grupoBF) {
        grupoBF.piezas.forEach((pz: string) => {
          if (esHerrajeNombre(pz)) {
            herrajesHeredadosSet.add(pz.toLowerCase().trim());
          } else {
            piezasHeredadasSet.add(pz.toLowerCase().trim());
          }
        });
      } else {
        // 🧱 B) Paso previo de ensamble
        const p = todosLosPasos.find((x: any) => x.id === id);
        if (p) pasosAProcesar.set(p.id, p);
      }
    }
  });

  pasosAProcesar.forEach((pasoPrevio) => {
    if (pasoPrevio.multiplePlus?.capas && pasoPrevio.multiplePlus.capas.length > 0) {
      pasoPrevio.multiplePlus.capas.forEach((capa: any) => {
        (capa.tableros || []).forEach((t: any) => piezasHeredadasSet.add(t.id.toLowerCase().trim()));
        (capa.herrajes || []).forEach((h: any) => herrajesHeredadosSet.add(h.id.toLowerCase().trim()));
        (capa.congelados || []).forEach((c: any) => herrajesHeredadosSet.add(c.id.toLowerCase().trim()));
      });
    } else if (pasoPrevio.tipo === "ensamble") {
      (pasoPrevio.piezasAsignadas || []).forEach((p: any) => piezasHeredadasSet.add(p.toLowerCase().trim()));
      (pasoPrevio.herrajesAsignados || []).forEach((h: any) => {
        const id = typeof h === "string" ? h : h.id;
        if (id) herrajesHeredadosSet.add(id.toLowerCase().trim());
      });
    }
  });

  const activosSet = new Set<string>();
  if (paso.multiplePlus?.capas) {
    paso.multiplePlus.capas.forEach((capa: any) => {
      (capa.tableros || []).forEach((t: any) => activosSet.add(t.id.toLowerCase().trim()));
      (capa.herrajes || []).forEach((h: any) => activosSet.add(h.id.toLowerCase().trim()));
      (capa.congelados || []).forEach((c: any) => activosSet.add(c.id.toLowerCase().trim()));
    });
  }

  const modoHeredados = paso.multiplePlus?.modoVisualizacionHeredados || "solido";

  // 2. Extraer ÚNICAMENTE mallas físicas reales (tableros y herrajes),
  // descartando de raíz planos de corte, maquinados, aristas drei, helpers, nurbs, etc.
  scene.traverse((child) => {
    // Descartar líneas o aristas (Drei Edges / LineSegments) que generan planos / cables visuales
    if ((child as any).isLine || (child as any).isLineSegments) {
      return;
    }

    const mesh = child as THREE.Mesh;
    if (!mesh || !mesh.isMesh) return;

    const meshName = (mesh.name || "").trim();
    if (!meshName) return;

    const u = mesh.userData || {};
    const isPhysicalPart = Boolean(
      u.isWoodBoard ||
      u.isHardware ||
      isHardwareMeshName(meshName) ||
      isHardwareMeshName(u.cleanName || "") ||
      /pe[cç]a\s*\d+/i.test(meshName) ||
      /pe[cç]a\s*\d+/i.test(u.cleanName || "")
    );

    // Omitir mallas no visibles salvo que sean piezas físicas del mueble
    if (!mesh.visible && !isPhysicalPart) return;

    const nLow = meshName.toLowerCase();
    // 🛡️ Filtro estricto antimanchas/antiplanos/antiauras: Omitir maquinados CNC, perforaciones, planos de corte, nurbs, auras de destello
    if (
      (child as any).userData?.isAuraDestelloHelper ||
      (child as any).userData?.isWireframeHelper ||
      nLow.includes("auradestello") ||
      nLow.includes("destello") ||
      nLow.includes("aura") ||
      nLow.includes("perforado") ||
      nLow.includes("maquinado") ||
      nLow.includes("machining") ||
      nLow.includes("helper") ||
      nLow.includes("plane") ||
      nLow.includes("plano") ||
      nLow.includes("nurbs") ||
      nLow.includes("edges") ||
      nLow.includes("outline") ||
      nLow.includes("silhouette") ||
      nLow.includes("shadow") ||
      nLow.includes("axis") ||
      nLow.includes("grid") ||
      nLow.includes("gizmo") ||
      nLow.includes("ambient")
    ) {
      return;
    }

    // Omitir mallas que cuelguen de grupos espurios (ej: grupo "Maquinados", "Otros")
    let parent = mesh.parent;
    let omitirPorPadre = false;
    while (parent && parent !== scene) {
      const pName = (parent.name || "").toLowerCase();
      if (
        pName.includes("maquinados") ||
        pName.includes("otros") ||
        pName.includes("helper") ||
        pName.includes("gizmo")
      ) {
        omitirPorPadre = true;
        break;
      }
      parent = parent.parent;
    }
    if (omitirPorPadre) return;

    // Omitir duplicados de Grasshopper marcados
    if (mesh.userData?.esDuplicado) {
      return;
    }

    if (!mesh.geometry || !mesh.geometry.attributes.position || mesh.geometry.attributes.position.count === 0) {
      return;
    }

    // 3. Clonar y limpiar geometría: solo posición, normales y UVs estándar
    let cleanGeo = mesh.geometry.clone();
    Object.keys(cleanGeo.attributes).forEach((attrKey) => {
      if (!["position", "normal", "uv"].includes(attrKey)) {
        cleanGeo.deleteAttribute(attrKey);
      }
    });

    if (!cleanGeo.attributes.normal) {
      cleanGeo.computeVertexNormals();
    }
    cleanGeo.clearGroups();

    // 4. Material y textura deduplicados con preservación PBR fotorrealista física
    const srcMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const srcTexture = (mesh.userData?.pbrDiffuse) || ((srcMat as any)?.map) || null;
    let optTexture: THREE.Texture | null = null;
    if (srcTexture) {
      optTexture = getOptimized512Texture(srcTexture);
    }

    const cleanName = (mesh.userData?.cleanName || meshName.replace(/^RH_OUT:/i, "")).trim();
    const cLow = cleanName.toLowerCase();
    const rawClean = meshName.replace(/^RH_(?:OUT|IN):\s*/i, "").trim().toLowerCase();
    const piezaMadre = mesh.userData?.piezaMadre || extraerPiezaMadre(cleanName);
    const pm = (piezaMadre || "").toLowerCase().trim();
    const ik = (mesh.userData?.instanciaKey || "").toLowerCase().trim();

    // Determinar si es activa del paso actual o heredada
    const esActivaDelPaso =
      paso.tipo === "showcase" ||
      paso.tipo === "insercion_cajones" ||
      Boolean(paso.insercionCajones) ||
      Array.from(activosSet).some((aId) =>
        coincideMallaConTablero(aId, cLow, pm, ik) ||
        coincidenMismoHerraje(aId, ik) ||
        coincidenMismoHerraje(aId, cLow)
      );

    const esHeredada = !esActivaDelPaso && (
      Array.from(piezasHeredadasSet).some((pId) => coincideMallaConTablero(pId, cLow, pm, ik)) ||
      Array.from(herrajesHeredadosSet).some((hId) =>
        coincidenMismoHerraje(hId, ik) ||
        coincidenMismoHerraje(hId, cLow) ||
        coincidenMismoHerraje(hId, rawClean)
      )
    );

    // Si es una pieza heredada pero el usuario configuró modoHeredados === "oculto", se omite
    if (esHeredada && modoHeredados === "oculto") {
      return;
    }

    const esCristalHeredado = esHeredada && modoHeredados === "cristal";

    // Detección semántica de tipos de herraje y componentes
    const isHwCorredera = Boolean(mesh.userData?.isHardwareCorredera || nLow.includes("corredera") || nLow.includes("corredi") || nLow.includes("trilho"));
    const isHwCantoneira = Boolean(mesh.userData?.isHardwareCantoneira || nLow.includes("cantoneira") || nLow.includes("cantonera") || nLow.includes("esquinero"));
    const isHwPerno = Boolean(mesh.userData?.isHardwarePerno || nLow.includes("perno") || nLow.includes("tornillo") || nLow.includes("parafuso"));
    const isHwPrego = Boolean(mesh.userData?.isHardwarePrego || nLow.includes("prego") || nLow.includes("puntilla") || nLow.includes("clavo") || nLow.includes("tachuela"));
    const isHwGrampo = Boolean(mesh.userData?.isHardwareGrampo || nLow.includes("grampo") || nLow.includes("grapa"));
    const isHwSuporte = Boolean(mesh.userData?.isHardwareSuporte || nLow.includes("suporte") || nLow.includes("soporte") || nLow.includes("esquadro"));
    const isHwCaja = Boolean(mesh.userData?.isHardwareCaja || ((nLow.includes("caja") || nLow.includes("minifix") || nLow.includes("girofix") || nLow.includes("tambor")) && !nLow.includes("cajon") && !nLow.includes("cajón") && !nLow.includes("gaveta")));
    const isHwTarugo = Boolean(mesh.userData?.isHardwareTarugo || nLow.includes("tarugo") || nLow.includes("cavilha") || nLow.includes("clavilha") || nLow.includes("espiga"));
    const isHwPata = Boolean(mesh.userData?.isHardwarePata || nLow.includes("pes") || nLow.includes("pés") || nLow.includes("pata") || nLow.includes("pie") || nLow.includes("sapata") || nLow.includes("deslizador") || nLow.includes("nivelador"));
    const isHwPorca = Boolean(mesh.userData?.isHardwarePorca || nLow.includes("porca") || nLow.includes("tuerca") || nLow.includes("bucha"));
    const isHwTampa = Boolean(mesh.userData?.isHardwareTampa || nLow.includes("tampa") || nLow.includes("tapa") || nLow.includes("adesivo"));
    const isHwPuxador = Boolean(nLow.includes("puxador") || nLow.includes("manija") || nLow.includes("tirador") || nLow.includes("jaladera"));
    const isHw = Boolean(mesh.userData?.isHardware || isHwCorredera || isHwCantoneira || isHwPerno || isHwPrego || isHwGrampo || isHwSuporte || isHwCaja || isHwTarugo || isHwPata || isHwPorca || isHwTampa || isHwPuxador || nLow.includes("bisagra") || nLow.includes("dobradiça") || nLow.includes("dobradi"));

    // Detección de tableros de fondo de 3 mm (costas, traseras, fondos de cajón, Peça 15, Peça 18)
    const isFondoBoard = Boolean(
      mesh.userData?.isFondoBoard ||
      nLow.includes("fondo") ||
      nLow.includes("fundo") ||
      nLow.includes("costa") ||
      nLow.includes("costas") ||
      nLow.includes("espaldar") ||
      nLow.includes("trasera") ||
      nLow.includes("back") ||
      nLow.includes("peça 15") ||
      nLow.includes("peca 15") ||
      nLow.includes("pk15") ||
      nLow.includes("peça 18") ||
      nLow.includes("peca 18") ||
      nLow.includes("pk18")
    ) && !nLow.includes("mdf") && !nLow.includes("mdp");

    // Detección de frentes de gaveta / cajón (Peça 19, frentes)
    const isFrenteCajon = Boolean(
      nLow.includes("frente") ||
      nLow.includes("peça 19") ||
      nLow.includes("peca 19") ||
      nLow.includes("pk19") ||
      (nLow.includes("gaveta") && !nLow.includes("cuerpo") && !nLow.includes("fondo") && !nLow.includes("lateral"))
    );

    const isBalance = Boolean(
      mesh.userData?.isBalance ||
      nLow.includes("balance") ||
      nLow.includes("reverso") ||
      nLow.endsWith(" b") ||
      nLow.endsWith("_b") ||
      /pe[cç]a\s*\d+\s*b$/i.test(nLow)
    );

    // Resolución de Asignación y Material PBR específico
    const storeState = use3BFStore.getState();
    const { capas = [], materialesPBR = [], asignacionesPartes = {} } = storeState;

    let assignedPbr: any = mesh.userData?.materialPBR || null;
    if (!assignedPbr) {
      const asig = asignacionesPartes[meshName] || 
                   asignacionesPartes[cleanName] || 
                   asignacionesPartes[piezaMadre] ||
                   asignacionesPartes[`RH_OUT:${cleanName}`];
      if (asig && asig.materialId && asig.materialId !== "por_capa") {
        assignedPbr = materialesPBR.find((m: any) => m.id === asig.materialId) || null;
      } else if (asig && asig.capaId) {
        const capa = capas.find((c: any) => c.id === asig.capaId);
        if (capa && capa.materialId) {
          assignedPbr = materialesPBR.find((m: any) => m.id === capa.materialId) || null;
        }
      }
    }

    if (!assignedPbr && isHwPata) {
      // Buscar si existe una capa de plástico con material o Plastico_3
      const capaPlastico = capas.find((c: any) => (c.nombre || "").toLowerCase().includes("plastico_3") || (c.nombre || "").toLowerCase().includes("plástico 3") || c.id === "capa_plastico_3");
      if (capaPlastico && capaPlastico.materialId) {
        assignedPbr = materialesPBR.find((m: any) => m.id === capaPlastico.materialId) || null;
      }
      if (!assignedPbr) {
        assignedPbr = materialesPBR.find((m: any) => (m.nombre || "").toLowerCase() === "plastico_3" || (m.id || "").toLowerCase() === "mat_plastico_3") || null;
      }
    }

    // Resolución de color hex, rugosidad, metalicidad y nombre canónico de material
    let finalColorHex = "FFFFFF";
    let roughValNum = 0.45;
    let metalValNum = 0.05;
    let baseMatName = (mesh.userData?.nombreMaterialEfectivo || assignedPbr?.nombre || srcMat?.name || "M_Material").trim();

    if (optTexture) {
      // 🌟 Tablero con textura difusa (Madera Marfil / Castaño / Duna / Cinamomo)
      finalColorHex = "FFFFFF";
      roughValNum = assignedPbr?.rugosidad ?? 0.58;
      metalValNum = assignedPbr?.metalico ?? 0.05;
      baseMatName = assignedPbr?.nombre || "M_MaderaTexturada";
    } else if (isHwCorredera) {
      // 🔩 Correderas telescópicas (acero/zinc brillante)
      finalColorHex = "E2E8F0";
      roughValNum = 0.22;
      metalValNum = 0.92;
      baseMatName = "Herraje_Corredera";
    } else if (isHwPata) {
      // 🦶 Patas del mueble (Respetar siempre material PBR asignado Plastico_3 / capa / color real en Three.js)
      if (assignedPbr?.colorBase) {
        finalColorHex = assignedPbr.colorBase.replace("#", "").toUpperCase();
        roughValNum = assignedPbr.rugosidad ?? 0.45;
        metalValNum = assignedPbr.metalico ?? 0.10;
        baseMatName = (assignedPbr.nombre || "Plastico_3").trim();
      } else {
        const rawHex = (srcMat as any)?.color ? (srcMat as any).color.getHexString().toUpperCase() : "";
        if (rawHex && rawHex !== "000000" && rawHex !== "18181B" && rawHex !== "1E293B" && rawHex !== "F59E0B" && rawHex !== "EAB308") {
          finalColorHex = rawHex;
          roughValNum = (srcMat as any)?.roughness ?? 0.45;
          metalValNum = (srcMat as any)?.metalness ?? 0.10;
          baseMatName = ((srcMat as any)?.name || mesh.userData?.nombreMaterialEfectivo || "Plastico_3").trim();
        } else {
          finalColorHex = "AA8B6F";
          roughValNum = 0.45;
          metalValNum = 0.10;
          baseMatName = "Plastico_3";
        }
      }
    } else if (isHwCantoneira || isHwPerno || isHwCaja) {
      // 🔩 Herrajes metálicos de unión (Zamak / Acero)
      finalColorHex = isHwCaja ? "D97706" : "CBD5E1";
      roughValNum = 0.25;
      metalValNum = 0.88;
      baseMatName = isHwCaja ? "Herraje_CajaMinifix" : "Herraje_Acero";
    } else if (isHwPorca) {
      // 🔩 Bujes o tuercas plásticas
      finalColorHex = "F4F4F5";
      roughValNum = 0.35;
      metalValNum = 0.05;
      baseMatName = "P_Blanco_Buje";
    } else if (isHwPuxador) {
      // 🚪 Tiradores / Manijas
      finalColorHex = assignedPbr?.colorBase ? assignedPbr.colorBase.replace("#", "") : "27272A";
      roughValNum = 0.28;
      metalValNum = 0.85;
      baseMatName = "Herraje_Tirador";
    } else if (isHwTarugo) {
      // 🪵 Tarugo de madera
      finalColorHex = "B45309";
      roughValNum = 0.80;
      metalValNum = 0.00;
      baseMatName = "Herraje_Tarugo";
    } else if (isFondoBoard) {
      // 🪵 Fondos de 3 mm (Peça 15, Peça 18, costas, traseras, fondos cajón)
      // 🛡️ REGLA B2B: Siempre blanco glacial (#FFFFFF / mat_blanco), NUNCA naranja CAD (#F59E0B)
      finalColorHex = (assignedPbr && assignedPbr.id !== "mat_marfil" && assignedPbr.colorBase && !assignedPbr.colorBase.includes("F59E0B") && !assignedPbr.colorBase.includes("EAB308"))
        ? assignedPbr.colorBase.replace("#", "")
        : "FFFFFF";
      roughValNum = 0.70;
      metalValNum = 0.05;
      baseMatName = "M_Blanco_Fondo";
    } else if (isFrenteCajon) {
      // 🗄️ Frentes de cajón / gaveta (Peça 19)
      if (assignedPbr && assignedPbr.colorBase && !assignedPbr.colorBase.includes("CBD5E1") && !assignedPbr.colorBase.includes("F59E0B") && !assignedPbr.colorBase.includes("EAB308")) {
        finalColorHex = assignedPbr.colorBase.replace("#", "");
      } else {
        finalColorHex = "FFFFFF";
      }
      roughValNum = 0.65;
      metalValNum = 0.05;
      baseMatName = "M_Blanco_Frente";
    } else if (isBalance) {
      // 🪵 Reverso / Balance
      finalColorHex = assignedPbr?.colorBase ? assignedPbr.colorBase.replace("#", "") : "F9FAFB";
      roughValNum = 0.55;
      metalValNum = 0.02;
      baseMatName = "M_Balance";
    } else if (nLow.includes("mdf")) {
      finalColorHex = "BDB088";
      roughValNum = 0.85;
      metalValNum = 0.00;
      baseMatName = "MDF_Crudo";
    } else if (nLow.includes("mdp")) {
      finalColorHex = "D5B88A";
      roughValNum = 0.80;
      metalValNum = 0.00;
      baseMatName = "MDP_Canto";
    } else if (assignedPbr?.colorBase) {
      finalColorHex = assignedPbr.colorBase.replace("#", "");
      roughValNum = assignedPbr.rugosidad ?? 0.45;
      metalValNum = assignedPbr.metalico ?? 0.05;
    } else {
      const rawHex = (srcMat as any)?.color ? (srcMat as any).color.getHexString().toUpperCase() : "FFFFFF";
      finalColorHex = (rawHex === "F59E0B" || rawHex === "EAB308") ? "FFFFFF" : rawHex;
      roughValNum = (srcMat as any)?.roughness ?? 0.45;
      metalValNum = (srcMat as any)?.metalness ?? 0.05;
    }

    let esTransparente = false;
    let opacidadVal = 1.0;
    let escribirProfundidad = true;

    if (esCristalHeredado) {
      finalColorHex = "0284C7";
      roughValNum = 0.18;
      metalValNum = 0.08;
      baseMatName = "M_Cristal_Heredado";
      esTransparente = true;
      opacidadVal = 0.45;
      escribirProfundidad = false;
      optTexture = null;
    }

    const texKey = optTexture ? ((optTexture.image as any)?.src || optTexture.uuid || "tex") : "no_tex";
    const matCacheKey = `${baseMatName}_${finalColorHex}_${roughValNum.toFixed(2)}_${metalValNum.toFixed(2)}_${opacidadVal.toFixed(2)}_${texKey}`;

    if (!materialOptimizedCache.has(matCacheKey)) {
      materialOptimizedCache.set(
        matCacheKey,
        new THREE.MeshStandardMaterial({
          name: baseMatName,
          color: new THREE.Color(`#${finalColorHex}`),
          roughness: roughValNum,
          metalness: metalValNum,
          map: optTexture,
          transparent: esTransparente,
          opacity: opacidadVal,
          depthWrite: escribirProfundidad,
          side: THREE.DoubleSide,
        })
      );
    }
    const cleanMat = materialOptimizedCache.get(matCacheKey)!;

    // 5. Crear malla exportable preservando su posición local exacta en el mueble
    const exportMesh = new THREE.Mesh(cleanGeo, cleanMat);
    exportMesh.name = mesh.name;

    mesh.getWorldPosition(exportMesh.position);
    mesh.getWorldQuaternion(exportMesh.quaternion);
    mesh.getWorldScale(exportMesh.scale);

    const invSceneMatrix = scene.matrixWorld.clone().invert();
    exportMesh.applyMatrix4(invSceneMatrix);

    exportMesh.userData = {
      ...mesh.userData,
      initialPosition: exportMesh.position.clone(),
      __cadOrigPosition: exportMesh.position.clone(),
      __cadOrigQuaternion: exportMesh.quaternion.clone(),
      __cadOrigScale: exportMesh.scale.clone(),
      __cadOrigMatrix: exportMesh.matrix.clone(),
      __baseRestPosition: exportMesh.position.clone(),
      __baseRestQuaternion: exportMesh.quaternion.clone(),
      __baseRestScale: exportMesh.scale.clone(),
      __bancoPosition: exportMesh.position.clone(),
      __bancoQuaternion: exportMesh.quaternion.clone(),
      instanciaKey: mesh.userData?.instanciaKey,
      cleanName: mesh.userData?.cleanName || mesh.name,
      piezaMadre: mesh.userData?.piezaMadre,
      isHardware: mesh.userData?.isHardware,
      isWoodBoard: mesh.userData?.isWoodBoard,
      esHeredada,
      esCristalHeredado,
    };

    furnitureRoot.add(exportMesh);
  });

  // 1.2. Restaurar inmediatamente la escena viva a su estado temporal del scrubber
  animatedStates.forEach((val, child) => {
    child.position.copy(val.pos);
    child.quaternion.copy(val.quat);
    child.scale.copy(val.scale);
  });
  scene.updateMatrixWorld(true);

  if (furnitureRoot.children.length === 0) {
    throw new Error("No se encontraron piezas físicas visibles para exportar.");
  }

  // 6. Compilar el clip de animación glTF a partir de la escena limpia en reposo
  // 🛡️ Asignar nombre canónico a furnitureRoot para que GLTFExporter lo enlace al nodo raíz glTF
  furnitureRoot.name = (furnitureRoot.name && furnitureRoot.name !== "Scene") ? furnitureRoot.name : "Mueble";

  const { clip, actualizarTiempo } = compilarAnimacionPaso(furnitureRoot, paso, {
    omitirTransformBanco: true,
    todosLosPasos,
  });
  clip.name = "default";

  // 🛡️ CRÍTICO: Evaluar la escena exportable en t = 0.0001
  // Para que todo herraje o tablero que aparezca en el futuro adopte scale = 0 inmediatamente en el archivo GLB
  if (actualizarTiempo) {
    actualizarTiempo(0.0001);
  }
  furnitureRoot.updateMatrix();
  furnitureRoot.updateMatrixWorld(true);
  exportScene.updateMatrixWorld(true);

  // 6.2. Incorporar Cámara Cinematográfica Animada nativa en glTF 2.0 (compatible con Babylon Sandbox y Blender)
  const keyframesCamara = (paso.keyframesCamara || []).slice().sort((a, b) => a.tiempo - b.tiempo);
  const duracionTotal = Math.max(paso.duracionTotal || 10, 1.0);

  if (keyframesCamara.length > 0) {
    const fovInicial = keyframesCamara[0]?.fov || 45;
    const cameraNode = new THREE.PerspectiveCamera(fovInicial, 16 / 9, 0.05, 1000);
    cameraNode.name = "Camera";

    // Evaluar curva continua Hermite suave para obtener la pose en cualquier tiempo t
    const evaluarPoseCamara = (t: number) => {
      if (keyframesCamara.length === 1 || t <= keyframesCamara[0].tiempo) {
        const kf = keyframesCamara[0];
        return {
          pos: new THREE.Vector3(kf.posicion[0], kf.posicion[1], kf.posicion[2]),
          target: new THREE.Vector3(kf.target[0], kf.target[1], kf.target[2]),
          fov: kf.fov || 45,
        };
      }
      if (t >= keyframesCamara[keyframesCamara.length - 1].tiempo) {
        const kf = keyframesCamara[keyframesCamara.length - 1];
        return {
          pos: new THREE.Vector3(kf.posicion[0], kf.posicion[1], kf.posicion[2]),
          target: new THREE.Vector3(kf.target[0], kf.target[1], kf.target[2]),
          fov: kf.fov || 45,
        };
      }
      let kfA = keyframesCamara[0];
      let kfB = keyframesCamara[1];
      for (let i = 0; i < keyframesCamara.length - 1; i++) {
        if (t >= keyframesCamara[i].tiempo && t <= keyframesCamara[i + 1].tiempo) {
          kfA = keyframesCamara[i];
          kfB = keyframesCamara[i + 1];
          break;
        }
      }
      const dur = Math.max(0.0001, kfB.tiempo - kfA.tiempo);
      const alpha = Math.max(0, Math.min(1, (t - kfA.tiempo) / dur));
      const smooth = alpha * alpha * (3 - 2 * alpha);

      const posA = new THREE.Vector3(kfA.posicion[0], kfA.posicion[1], kfA.posicion[2]);
      const posB = new THREE.Vector3(kfB.posicion[0], kfB.posicion[1], kfB.posicion[2]);
      const tgtA = new THREE.Vector3(kfA.target[0], kfA.target[1], kfA.target[2]);
      const tgtB = new THREE.Vector3(kfB.target[0], kfB.target[1], kfB.target[2]);

      const pos = new THREE.Vector3().lerpVectors(posA, posB, smooth);
      const target = new THREE.Vector3().lerpVectors(tgtA, tgtB, smooth);
      const fovA = kfA.fov || 45;
      const fovB = kfB.fov || 45;
      const fov = fovA + (fovB - fovA) * smooth;
      return { pos, target, fov };
    };

    // Establecer pose inicial en t = 0
    const pose0 = evaluarPoseCamara(0);
    cameraNode.position.copy(pose0.pos);
    cameraNode.lookAt(pose0.target);
    cameraNode.fov = pose0.fov;
    cameraNode.updateMatrix();
    cameraNode.updateMatrixWorld(true);

    exportScene.add(cameraNode);

    // Muestreo denso de la trayectoria cinematográfica (15 FPS + marcas exactas de cada keyframe)
    const tiemposSet = new Set<number>();
    tiemposSet.add(0);
    tiemposSet.add(duracionTotal);
    keyframesCamara.forEach((k) => {
      if (k.tiempo >= 0 && k.tiempo <= duracionTotal) {
        tiemposSet.add(Number(k.tiempo.toFixed(4)));
      }
    });

    const fpsMuestreo = 15;
    const totalFrames = Math.ceil(duracionTotal * fpsMuestreo);
    for (let f = 0; f <= totalFrames; f++) {
      const t = Math.min(duracionTotal, f / fpsMuestreo);
      tiemposSet.add(Number(t.toFixed(4)));
    }

    const tiemposOrdenados = Array.from(tiemposSet).sort((a, b) => a - b);
    const camTimes: number[] = [];
    const camPosVals: number[] = [];
    const camQuatVals: number[] = [];

    const dummyCam = new THREE.PerspectiveCamera(45, 16 / 9, 0.05, 1000);

    for (let i = 0; i < tiemposOrdenados.length; i++) {
      const t = tiemposOrdenados[i];
      if (camTimes.length > 0 && Math.abs(camTimes[camTimes.length - 1] - t) < 0.002) {
        continue;
      }

      const { pos, target } = evaluarPoseCamara(t);
      dummyCam.position.copy(pos);
      dummyCam.lookAt(target);
      dummyCam.updateMatrix();

      camTimes.push(t);
      camPosVals.push(
        Number(pos.x.toFixed(4)),
        Number(pos.y.toFixed(4)),
        Number(pos.z.toFixed(4))
      );
      camQuatVals.push(
        Number(dummyCam.quaternion.x.toFixed(5)),
        Number(dummyCam.quaternion.y.toFixed(5)),
        Number(dummyCam.quaternion.z.toFixed(5)),
        Number(dummyCam.quaternion.w.toFixed(5))
      );
    }

    if (camTimes.length >= 2) {
      const camPosTrack = new THREE.VectorKeyframeTrack(
        `${cameraNode.name}.position`,
        camTimes,
        camPosVals
      );
      const camQuatTrack = new THREE.QuaternionKeyframeTrack(
        `${cameraNode.name}.quaternion`,
        camTimes,
        camQuatVals
      );
      clip.tracks.push(camPosTrack);
      clip.tracks.push(camQuatTrack);
    }
  } else {
    // Si no hay keyframes cinematográficos específicos, incorporar una cámara fija de encuadre
    const cameraNode = new THREE.PerspectiveCamera(45, 16 / 9, 0.05, 1000);
    cameraNode.name = "Camera";
    cameraNode.position.set(0, 1.2, 2.5);
    cameraNode.lookAt(0, 0.4, 0);
    cameraNode.updateMatrix();
    cameraNode.updateMatrixWorld(true);
    exportScene.add(cameraNode);
  }

  // 7. Parsear a binario glTF estándar universal glTF 2.0 (compatible al 100% con Windows 3D Viewer, Babylon Sandbox, Blender)
  const rawBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      exportScene,
      (gltf) => {
        resolve(gltf as ArrayBuffer);
      },
      (error) => {
        console.error("[ExportManualGLB] Error al parsear glTF:", error);
        reject(error);
      },
      {
        binary: true,
        animations: [clip],
        maxTextureSize: 512,
        includeCustomExtensions: false,
      }
    );
  });

  // 8. Compresión Draco de alta eficiencia con el pipeline oficial de 3dBimFab (@gltf-transform: dedup + resample + prune + draco)
  let finalBuffer: ArrayBuffer = rawBuffer;
  try {
    const res = await fetch(`/api/compress-glb?mode=download&name=${encodeURIComponent(paso.id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: rawBuffer,
    });

    if (res.ok) {
      finalBuffer = await res.arrayBuffer();
      console.log(`[ExportManualGLB] 🗜️ Compresión 3dBimFab exitosa: ${(rawBuffer.byteLength / (1024 * 1024)).toFixed(2)} MB ➔ ${(finalBuffer.byteLength / (1024 * 1024)).toFixed(2)} MB`);
    } else {
      console.warn("[ExportManualGLB] API de compresión devolvió status:", res.status);
    }
  } catch (compErr) {
    console.warn("[ExportManualGLB] Fallback a GLB sin comprimir por:", compErr);
  }

  const filename = `${paso.id}.glb`;
  const sizeMb = (finalBuffer.byteLength / (1024 * 1024)).toFixed(2);
  console.log(`[ExportManualGLB] 🚀 ${filename}: ${sizeMb} MB`);

  return {
    buffer: finalBuffer,
    filename,
    sizeMb,
  };
}

/**
 * Dispara la descarga directa de un ArrayBuffer como archivo en el navegador
 */
export function descargarBufferComoArchivo(buffer: ArrayBuffer | Blob, filename: string) {
  const blob = buffer instanceof Blob ? buffer : new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Genera el paquete completo ZIP con todos los GLBs, audios MP3 y el archivo configuracion_manual.json
 */
export async function exportarPaqueteCompletoManualZip(
  scene: THREE.Object3D,
  pasos: PasoManualStudio[],
  nombreMueble: string = "Manual_3dBimFab"
): Promise<void> {
  const zip = new JSZip();
  const modelsFolder = zip.folder("models");
  const audioEsFolder = zip.folder("audio_es");
  const audioPtFolder = zip.folder("audio_pt");
  const audioEnFolder = zip.folder("audio_en");

  const manifest = {
    nombre: nombreMueble,
    fechaCreacion: new Date().toISOString(),
    motor: "3dBimFab",
    pasos: pasos.map((p) => ({
      id: p.id,
      numero: p.numero,
      tipo: p.tipo,
      titulo: p.titulo,
      descripcion: p.descripcion,
      duracionTotal: p.duracionTotal,
      piezaMaster: p.piezaMaster,
      guionEs: p.guionEs,
      guionPt: p.guionPt,
      guionEn: p.guionEn,
      piezasAsignadas: p.piezasAsignadas,
      herrajesAsignados: p.herrajesAsignados,
      glbUrl: `models/${p.id}.glb`,
      audioEsUrl: `audio_es/${p.id}.mp3`,
      audioPtUrl: `audio_pt/${p.id}.mp3`,
      audioEnUrl: `audio_en/${p.id}.mp3`,
    })),
  };

  zip.file("configuracion_manual.json", JSON.stringify(manifest, null, 2));

  // Exportar cada GLB
  for (const paso of pasos) {
    try {
      const { buffer, filename } = await exportarGlbPasoManual(scene, paso);
      modelsFolder?.file(filename, buffer);

      // Si tiene audios generados en base64
      if (paso.audioUrlEs && paso.audioUrlEs.startsWith("data:audio")) {
        const base64Data = paso.audioUrlEs.split(",")[1];
        audioEsFolder?.file(`${paso.id}.mp3`, base64Data, { base64: true });
      }
      if (paso.audioUrlPt && paso.audioUrlPt.startsWith("data:audio")) {
        const base64Data = paso.audioUrlPt.split(",")[1];
        audioPtFolder?.file(`${paso.id}.mp3`, base64Data, { base64: true });
      }
      if (paso.audioUrlEn && paso.audioUrlEn.startsWith("data:audio")) {
        const base64Data = paso.audioUrlEn.split(",")[1];
        audioEnFolder?.file(`${paso.id}.mp3`, base64Data, { base64: true });
      }
    } catch (err) {
      console.warn(`[ExportManualGLB] Error en paso ${paso.id}:`, err);
    }
  }

  const zipContent = await zip.generateAsync({ type: "blob" });
  descargarBufferComoArchivo(zipContent, `${nombreMueble.replace(/\s+/g, "_")}_Manual3D.zip`);
}

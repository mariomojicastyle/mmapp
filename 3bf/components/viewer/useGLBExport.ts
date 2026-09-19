"use client";

import React, { useState } from "react";
import * as THREE from "three";
import { use3BFStore } from "@/lib/store";
import { exportarGlbPasoManual, descargarBufferComoArchivo } from "@/lib/exportManualGlb";
import { saveLocalARModel } from "@/lib/arStorage";

export function useGLBExport(furnitureGroup: THREE.Group | null) {
  const {
    parametros,
    instancias,
    pestanaActiva,
    coloresApariencia,
    calibracion,
    modoVisual,
    pasosManual,
    pasoActivoManualId,
    timelineCurrentTime,
    isTimelinePlaying,
  } = use3BFStore();

  const [exportandoGLB, setExportandoGLB] = useState(false);
  const [generandoAR, setGenerandoAR] = useState(false);
  const [modalARAbierto, setModalARAbierto] = useState(false);
  const [arData, setArData] = useState<{
    id: string | null;
    sizeBefore?: number;
    sizeAfter?: number;
  }>({ id: null });

  // 1. Generador central de escena limpia y GLB optimizado (con perfil ultra-liviano para AR)
  const generateCleanGLB = async (
    isForAR = false,
    includeEdges = false
  ): Promise<{ arrayBuffer: ArrayBuffer; piecesCount: number } | null> => {
    const instanceMap: Map<string, THREE.Group> | undefined =
      typeof window !== "undefined" ? (window as any).__3bfInstanceGroups : undefined;
    const targetGroups: THREE.Group[] = [];
    if (furnitureGroup) {
      targetGroups.push(furnitureGroup);
    } else if (instanceMap && instanceMap.size > 0) {
      instanceMap.forEach((grp) => targetGroups.push(grp));
    }

    if (targetGroups.length === 0) {
      alert("Espera a que el modelo esté cargado en pantalla para exportar.");
      return null;
    }

    const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
    const exporter = new GLTFExporter();

    // Caché para optimizar exactamente 1 solo bitmap (256 para AR o 512 para desktop) por textura única
    const textureOptimizedCache = new Map<string, THREE.Texture>();

    const getOptimized512Texture = (srcTexture: THREE.Texture): THREE.Texture => {
      const cacheKey = (srcTexture.image as any)?.src || srcTexture.uuid || srcTexture.name || "tex";
      if (textureOptimizedCache.has(cacheKey)) {
        return textureOptimizedCache.get(cacheKey)!;
      }

      try {
        const targetSize = isForAR ? 256 : 512;
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");

        if (ctx && srcTexture.image) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(srcTexture.image, 0, 0, targetSize, targetSize);

          const optTexture = new THREE.CanvasTexture(canvas);
          optTexture.name = (srcTexture.name || "Texture") + "_" + targetSize;
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
        console.warn("[3dBimFab GLB] Fallback a textura directa por:", err);
      }

      return srcTexture;
    };

    // Caché de materiales compartidos para reutilizar 1 solo material por acabado
    const materialOptimizedCache = new Map<string, THREE.MeshStandardMaterial>();

    // 1. Recolectar mallas visibles elegibles de todos los grupos
    const candidateMeshes: Array<{ mesh: THREE.Mesh; groupWorldPos: THREE.Vector3 }> = [];

    targetGroups.forEach((targetGroup) => {
      targetGroup.updateWorldMatrix(true, true);
      const groupWorldPos = new THREE.Vector3();
      targetGroup.getWorldPosition(groupWorldPos);

      targetGroup.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh || !mesh.isMesh) return;
        if (!mesh.visible) return;
        const meshName = (mesh.name || "").trim();
        if (!meshName) return;

        const nLow = meshName.toLowerCase();
        if (
          nLow.includes("perforado") || 
          nLow.includes("maquinado") || 
          nLow.includes("helper") || 
          nLow.includes("plane") || 
          nLow.includes("nurbs") ||
          nLow.includes("edges") ||
          nLow.includes("outline") ||
          nLow.includes("silhouette") ||
          nLow.includes("shadow") ||
          nLow.includes("axis")
        ) {
          return;
        }

        // En perfil AR: omitir herrajes internos ocultos
        if (isForAR) {
          if (
            nLow.includes("cavilha") ||
            nLow.includes("tarugo") ||
            nLow.includes("parafuso") ||
            nLow.includes("tornillo") ||
            nLow.includes("minifix") ||
            nLow.includes("perno") ||
            nLow.includes("tampa") ||
            nLow.includes("tapa") ||
            nLow.includes("prego") ||
            nLow.includes("clavo") ||
            nLow.includes("porca") ||
            nLow.includes("tuerca")
          ) {
            return;
          }
        }

        candidateMeshes.push({ mesh, groupWorldPos });
      });
    });

    if (candidateMeshes.length === 0) {
      alert("No se encontraron mallas visibles para exportar.");
      return null;
    }

    // 2. Clasificador de mallas
    const isHardwareMesh = (name: string): boolean => {
      const n = name.toLowerCase();
      return (
        n.includes("cavilha") ||
        n.includes("tarugo") ||
        n.includes("tampa") ||
        n.includes("minifix") ||
        n.includes("tornillo") ||
        n.includes("parafuso") ||
        n.includes("porca") ||
        n.includes("tuerca") ||
        n.includes("corredera") ||
        n.includes("corredi") ||
        n.includes("cantoneira") ||
        n.includes("soporte") ||
        n.includes("pata") ||
        n.includes("pes") ||
        n.includes("pés") ||
        n.includes("bisagra") ||
        n.includes("dobradiça") ||
        n.includes("puxador") ||
        n.includes("manija")
      ) && !n.includes("cajon") && !n.includes("cajón");
    };

    const getCleanPieceBaseName = (rawName: string): string => {
      let clean = rawName
        .replace(/^RH_OUT:/i, "")
        .trim();

      if (isHardwareMesh(clean)) {
        return clean;
      }

      clean = clean
        .replace(/^(MDP|MDF|HDF|Compensado|Aglomerado|Melamina|Tablero|Madera|Fondo|Fundo|Canto|Borde)\s+/i, "")
        .replace(/^(Color|Balance|Back|Cara|Reverso|Nucleo|Sustrato)\s+/i, "")
        .trim();

      clean = clean
        .replace(/(_Color|_MDP|_MDF|_Balance|_Back|_Cara|_Nucleo|_B|-Color|-MDP|-MDF|-Balance|-Back|-B)$/i, "")
        .replace(/(\s+Color|\s+MDP|\s+MDF|\s+Balance|\s+Back|\s+B)$/i, "")
        .trim();

      clean = clean.replace(/^(Pe[cç]a\s*)(\d)$/i, (_, prefix, num) => `${prefix}0${num}`);
      clean = clean.replace(/^(PK\s*)(\d)$/i, (_, prefix, num) => `PK${String(num).padStart(2, "0")}`);
      clean = clean.replace(/^(P\s*)(\d)$/i, (_, prefix, num) => `P${String(num).padStart(2, "0")}`);

      if (!clean) {
        clean = parametros.model_id ? `PK01_${parametros.model_id}` : "PK01";
      }

      return clean;
    };

    const splitDisconnectedIslands = (geo: THREE.BufferGeometry): THREE.BufferGeometry[] => {
      const nonIdx = geo.index ? geo.toNonIndexed() : geo.clone();
      const pos = nonIdx.attributes.position;
      const norm = nonIdx.attributes.normal;
      const uv = nonIdx.attributes.uv;
      if (!pos || pos.count === 0) return [geo];

      const triCount = Math.floor(pos.count / 3);
      if (triCount <= 1) return [nonIdx];

      const vertToTris = new Map<string, number[]>();
      const getVertKey = (idx: number) => {
        const x = Math.round(pos.getX(idx) * 1000);
        const y = Math.round(pos.getY(idx) * 1000);
        const z = Math.round(pos.getZ(idx) * 1000);
        return `${x}_${y}_${z}`;
      };

      for (let t = 0; t < triCount; t++) {
        for (let v = 0; v < 3; v++) {
          const k = getVertKey(t * 3 + v);
          if (!vertToTris.has(k)) vertToTris.set(k, []);
          vertToTris.get(k)!.push(t);
        }
      }

      const triVisited = new Uint8Array(triCount);
      const islands: number[][] = [];

      for (let t = 0; t < triCount; t++) {
        if (triVisited[t]) continue;
        const currentIsland: number[] = [];
        const queue: number[] = [t];
        triVisited[t] = 1;

        while (queue.length > 0) {
          const cur = queue.pop()!;
          currentIsland.push(cur);

          for (let v = 0; v < 3; v++) {
            const k = getVertKey(cur * 3 + v);
            const neighbors = vertToTris.get(k);
            if (neighbors) {
              for (let i = 0; i < neighbors.length; i++) {
                const n = neighbors[i];
                if (!triVisited[n]) {
                  triVisited[n] = 1;
                  queue.push(n);
                }
              }
            }
          }
        }

        islands.push(currentIsland);
      }

      if (islands.length <= 1) {
        return [nonIdx];
      }

      const resultGeos: THREE.BufferGeometry[] = [];
      for (const island of islands) {
        const islandTriCount = island.length;
        const newPos = new Float32Array(islandTriCount * 9);
        const newNorm = norm ? new Float32Array(islandTriCount * 9) : null;
        const newUv = uv ? new Float32Array(islandTriCount * 6) : null;

        let dstVert = 0;
        for (const triIdx of island) {
          const srcVert = triIdx * 3;
          for (let v = 0; v < 3; v++) {
            const src = srcVert + v;
            newPos[dstVert * 3] = pos.getX(src);
            newPos[dstVert * 3 + 1] = pos.getY(src);
            newPos[dstVert * 3 + 2] = pos.getZ(src);

            if (newNorm && norm) {
              newNorm[dstVert * 3] = norm.getX(src);
              newNorm[dstVert * 3 + 1] = norm.getY(src);
              newNorm[dstVert * 3 + 2] = norm.getZ(src);
            }

            if (newUv && uv) {
              newUv[dstVert * 2] = uv.getX(src);
              newUv[dstVert * 2 + 1] = uv.getY(src);
            }

            dstVert++;
          }
        }

        const islandGeo = new THREE.BufferGeometry();
        islandGeo.setAttribute("position", new THREE.BufferAttribute(newPos, 3));
        if (newNorm) islandGeo.setAttribute("normal", new THREE.BufferAttribute(newNorm, 3));
        if (newUv) islandGeo.setAttribute("uv", new THREE.BufferAttribute(newUv, 2));
        islandGeo.computeBoundingBox();
        islandGeo.computeBoundingSphere();
        resultGeos.push(islandGeo);
      }

      return resultGeos;
    };

    // 3. Agrupación y separación de piezas
    const rawBoardSubMeshes = new Map<string, Array<{ geo: THREE.BufferGeometry; mat: THREE.Material }>>();
    const hardwareItems: Array<{ baseName: string; geo: THREE.BufferGeometry; mat: THREE.Material }> = [];

    const getOptimizedExportMaterial = (srcMat: THREE.Material): THREE.Material => {
      const std = srcMat as THREE.MeshStandardMaterial;
      if (!std || !std.isMeshStandardMaterial) {
        return srcMat.clone();
      }

      const matKey = [
        std.color ? std.color.getHexString() : "def",
        std.roughness ?? 0.5,
        std.metalness ?? 0.0,
        std.map ? (std.map.image as any)?.src || std.map.uuid || "map" : "nomap",
        std.normalMap ? (std.normalMap.image as any)?.src || std.normalMap.uuid || "norm" : "nonorm",
        std.roughnessMap ? (std.roughnessMap.image as any)?.src || std.roughnessMap.uuid || "rough" : "norough",
        std.aoMap ? (std.aoMap.image as any)?.src || std.aoMap.uuid || "ao" : "noao",
      ].join("_");

      if (materialOptimizedCache.has(matKey)) {
        return materialOptimizedCache.get(matKey)!;
      }

      const exportMat = new THREE.MeshStandardMaterial({
        color: std.color ? std.color.clone() : new THREE.Color(0xd4af37),
        roughness: std.roughness !== undefined ? std.roughness : 0.45,
        metalness: std.metalness !== undefined ? std.metalness : 0.05,
      });

      if (std.map && std.map.isTexture) {
        exportMat.map = getOptimized512Texture(std.map);
      }
      if (std.normalMap && std.normalMap.isTexture) {
        exportMat.normalMap = getOptimized512Texture(std.normalMap);
        exportMat.normalScale = std.normalScale ? std.normalScale.clone() : new THREE.Vector2(0.5, 0.5);
      }
      if (std.roughnessMap && std.roughnessMap.isTexture) {
        exportMat.roughnessMap = getOptimized512Texture(std.roughnessMap);
      }
      if (std.aoMap && std.aoMap.isTexture) {
        exportMat.aoMap = getOptimized512Texture(std.aoMap);
        exportMat.aoMapIntensity = std.aoMapIntensity !== undefined ? std.aoMapIntensity : 1.0;
      }

      exportMat.name = std.name ? `${std.name}_Optimized` : `Mat_${matKey.slice(0, 8)}`;
      materialOptimizedCache.set(matKey, exportMat);
      return exportMat;
    };

    candidateMeshes.forEach(({ mesh, groupWorldPos }) => {
      const rawName = mesh.name || "";
      const isHw = isHardwareMesh(rawName);

      mesh.updateWorldMatrix(true, false);
      const meshWorldMatrix = mesh.matrixWorld.clone();

      const geom = mesh.geometry.clone();
      geom.applyMatrix4(meshWorldMatrix);

      const subMeshes = splitDisconnectedIslands(geom);

      subMeshes.forEach((islandGeo) => {
        let mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        mat = mat ? getOptimizedExportMaterial(mat) : new THREE.MeshStandardMaterial({ color: 0xcccccc });

        if (isHw) {
          const baseName = getCleanPieceBaseName(rawName);
          hardwareItems.push({ baseName, geo: islandGeo, mat });
        } else {
          const baseName = getCleanPieceBaseName(rawName);
          if (!rawBoardSubMeshes.has(baseName)) {
            rawBoardSubMeshes.set(baseName, []);
          }
          rawBoardSubMeshes.get(baseName)!.push({ geo: islandGeo, mat });
        }
      });
    });

    const exportScene = new THREE.Scene();
    exportScene.name = "3dBimFab_Scene";

    // 4. Tableros de madera
    const { mergeGeometries } = await import("three/examples/jsm/utils/BufferGeometryUtils.js");

    rawBoardSubMeshes.forEach((subItems, pieceBaseName) => {
      let unifiedGeo: THREE.BufferGeometry;
      let pieceMaterial = subItems[0].mat;

      if (subItems.length === 1) {
        unifiedGeo = subItems[0].geo.clone();
      } else {
        const geosToMerge = subItems.map((item) => {
          return item.geo.index ? item.geo : item.geo.clone();
        });
        const merged = mergeGeometries(geosToMerge, false);
        unifiedGeo = merged || subItems[0].geo.clone();
      }

      unifiedGeo.computeBoundingBox();
      const center = new THREE.Vector3();
      if (unifiedGeo.boundingBox) {
        unifiedGeo.boundingBox.getCenter(center);
      }

      unifiedGeo.translate(-center.x, -center.y, -center.z);
      unifiedGeo.computeVertexNormals();

      const boardMesh = new THREE.Mesh(unifiedGeo, pieceMaterial);
      boardMesh.name = pieceBaseName;
      boardMesh.geometry.name = pieceBaseName;
      boardMesh.position.copy(center);

      exportScene.add(boardMesh);
    });

    // 5. Herrajes individuales
    const hardwareSequenceCounters = new Map<string, number>();

    hardwareItems.forEach((sub) => {
      const baseName = sub.baseName;
      const count = (hardwareSequenceCounters.get(baseName) || 0) + 1;
      hardwareSequenceCounters.set(baseName, count);

      const hwName = count === 1 ? baseName : `${baseName}.${String(count - 1).padStart(3, "0")}`;
      const hwMeshName = hwName;

      const hwGeo = sub.geo.clone();
      hwGeo.computeBoundingBox();
      const hwCenter = new THREE.Vector3();
      if (hwGeo.boundingBox) {
        hwGeo.boundingBox.getCenter(hwCenter);
      }
      hwGeo.translate(-hwCenter.x, -hwCenter.y, -hwCenter.z);
      hwGeo.computeVertexNormals();

      const hwMesh = new THREE.Mesh(hwGeo, sub.mat);
      hwMesh.name = hwName;
      hwMesh.geometry.name = hwMeshName;
      hwMesh.position.copy(hwCenter);

      exportScene.add(hwMesh);
    });

    // 6. Centrar el mueble en X y Z y asentar su base en Y = 0
    exportScene.updateMatrixWorld(true);
    const totalBox = new THREE.Box3().setFromObject(exportScene);
    if (!totalBox.isEmpty()) {
      const center = new THREE.Vector3();
      totalBox.getCenter(center);
      const minY = totalBox.min.y;

      exportScene.children.forEach((child) => {
        child.position.x -= center.x;
        child.position.z -= center.z;
        child.position.y -= minY;
      });
      exportScene.updateMatrixWorld(true);
      console.log(
        `[3dBimFab GLB Cohesion] Mueble cohesionado con éxito: ${rawBoardSubMeshes.size} familias de piezas de madera y ${hardwareItems.length} herrajes.`
      );
    }

    return new Promise((resolve, reject) => {
      exporter.parse(
        exportScene,
        (gltf) => {
          resolve({ arrayBuffer: gltf as ArrayBuffer, piecesCount: exportScene.children.length });
        },
        (error) => {
          reject(error);
        },
        { binary: true, maxTextureSize: 512 }
      );
    });
  };

  // 📥 Exportar GLB (con compresión Draco automática a ~2.1 MB)
  const exportToGLB = async (comprimido = true) => {
    setExportandoGLB(true);
    try {
      const glbData = await generateCleanGLB();
      if (!glbData) {
        setExportandoGLB(false);
        return;
      }

      const modelName = parametros.model_id || "Cubierta";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(11, 19);

      let finalBlob: Blob;
      let finalFileName: string;

      if (comprimido) {
        try {
          const res = await fetch(`/api/compress-glb?mode=download&name=${encodeURIComponent(modelName)}`, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: glbData.arrayBuffer,
          });

          if (res.ok) {
            finalBlob = await res.blob();
            finalFileName = `${modelName}_${timestamp}_comprimido.glb`;
          } else {
            throw new Error("API de compresión devolvió status " + res.status);
          }
        } catch (compErr) {
          console.warn("Fallo compresión en servidor, descargando versión estándar:", compErr);
          finalBlob = new Blob([glbData.arrayBuffer], { type: "application/octet-stream" });
          finalFileName = `${modelName}_${timestamp}.glb`;
        }
      } else {
        finalBlob = new Blob([glbData.arrayBuffer], { type: "application/octet-stream" });
        finalFileName = `${modelName}_${timestamp}.glb`;
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(finalBlob);
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      console.log(
        `[3dBimFab GLB Exporter] Descarga completada: ${finalFileName} (${(finalBlob.size / (1024 * 1024)).toFixed(2)} MB)`
      );
    } catch (err: any) {
      console.error("Error al exportar GLB:", err);
      alert("Error en exportación: " + (err?.message || err));
    } finally {
      setExportandoGLB(false);
    }
  };

  // 🚀 Descargar GLB unificado según la pestaña activa (Estático en 3D / Animado en Manual 3D)
  const descargarGlbSegunModo = async () => {
    if (pestanaActiva === "manual") {
      const state = use3BFStore.getState();
      const pasos = state.pasosManual;
      const activeId = state.pasoActivoManualId;
      const pasoActivo = pasos.find((p) => p.id === activeId) || pasos[0];
      if (!pasoActivo) {
        exportToGLB(true);
        return;
      }
      try {
        setExportandoGLB(true);
        const prevTime = use3BFStore.getState().timelineCurrentTime;
        const prevPlaying = use3BFStore.getState().isTimelinePlaying;
        use3BFStore.setState({ isTimelinePlaying: false, timelineCurrentTime: 0 });

        if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
          (window as any).__3bfManualEngine.detener();
        }

        await new Promise((resolve) => setTimeout(resolve, 80));

        const scene = (window as any).__threeScene3BF || furnitureGroup || new THREE.Scene();
        const { buffer, filename, sizeMb } = await exportarGlbPasoManual(scene, pasoActivo);

        descargarBufferComoArchivo(buffer, filename);
        console.log(`[3dBimFab Manual] 🚀 GLB animado exportado: ${filename} (${sizeMb} MB)`);

        if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
          (window as any).__3bfManualEngine.actualizarTiempo(prevTime);
        }
        use3BFStore.setState({ timelineCurrentTime: prevTime, isTimelinePlaying: prevPlaying });
      } catch (err: any) {
        console.error("[3dBimFab Manual] Error al exportar paso animado:", err);
        alert(`Error al exportar paso animado: ${err.message}`);
      } finally {
        setExportandoGLB(false);
      }
    } else {
      exportToGLB(true);
    }
  };

  // ✨ Abrir Realidad Aumentada "Ver en tu espacio"
  const abrirRealidadAumentada = async () => {
    setGenerandoAR(true);
    try {
      let glbBuffer: ArrayBuffer;
      let rawSize = 0;
      let modelName = parametros.model_id || "Cubierta";

      if (pestanaActiva === "manual") {
        const state = use3BFStore.getState();
        const pasoActivo = state.pasosManual.find((p) => p.id === state.pasoActivoManualId) || state.pasosManual[0];
        if (pasoActivo) {
          modelName = `${modelName}_${pasoActivo.id}`;
          const prevTime = state.timelineCurrentTime;
          const prevPlaying = state.isTimelinePlaying;
          use3BFStore.setState({ isTimelinePlaying: false, timelineCurrentTime: 0 });

          if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
            (window as any).__3bfManualEngine.detener();
          }

          await new Promise((resolve) => setTimeout(resolve, 80));

          const scene = (window as any).__threeScene3BF || furnitureGroup || new THREE.Scene();
          const { buffer, sizeMb } = await exportarGlbPasoManual(scene, pasoActivo);
          glbBuffer = buffer;
          rawSize = buffer.byteLength;

          if (typeof window !== "undefined" && (window as any).__3bfManualEngine) {
            (window as any).__3bfManualEngine.actualizarTiempo(prevTime);
          }
          use3BFStore.setState({ timelineCurrentTime: prevTime, isTimelinePlaying: prevPlaying });
        } else {
          const glbData = await generateCleanGLB(true);
          if (!glbData) {
            setGenerandoAR(false);
            return;
          }
          glbBuffer = glbData.arrayBuffer;
          rawSize = glbData.arrayBuffer.byteLength;
        }
      } else {
        const glbData = await generateCleanGLB(true);
        if (!glbData) {
          setGenerandoAR(false);
          return;
        }
        glbBuffer = glbData.arrayBuffer;
        rawSize = glbData.arrayBuffer.byteLength;
      }

      const ua = typeof navigator !== "undefined" ? navigator.userAgent || navigator.vendor || (window as any).opera || "" : "";
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
      const isIPad = /macintosh/i.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1;
      const isTouch =
        typeof window !== "undefined" &&
        ("ontouchstart" in window ||
          (navigator && (navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0)) ||
          (window.matchMedia && window.matchMedia("(pointer: coarse)").matches));
      const esDispositivoMovil = isMobileUA || isIPad || isTouch;

      try {
        if (typeof window !== "undefined") {
          const snapshot = {
            parametros,
            instancias,
            modelName,
            timestamp: Date.now(),
          };
          sessionStorage.setItem("3bf_ar_return_session", JSON.stringify(snapshot));
        }
      } catch (e) {
        console.warn("No se pudo guardar la sesión de retorno AR:", e);
      }

      const arHost = "https://engine.mariomojica.com";
      const arUploadUrl =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
          ? "/api/compress-glb"
          : `${arHost}/api/compress-glb`;
      const arRedirectBase =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
          ? ""
          : arHost;

      if (esDispositivoMovil) {
        try {
          const glbBlob = new Blob([glbBuffer], { type: "model/gltf-binary" });
          await saveLocalARModel(glbBlob, modelName);
        } catch (storageErr) {
          console.warn("[3dBimFab AR] IndexedDB no disponible:", storageErr);
        }

        const abortCtrl = new AbortController();
        const timeoutId = setTimeout(() => abortCtrl.abort(), 10000);

        try {
          const res = await fetch(`${arUploadUrl}?mode=ar&name=${encodeURIComponent(modelName)}`, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: glbBuffer,
            signal: abortCtrl.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            if (data?.id) {
              setGenerandoAR(false);
              window.location.href = `${arRedirectBase}/ar?id=${data.id}&name=${encodeURIComponent(modelName)}`;
              return;
            }
          }
        } catch (apiErr) {
          clearTimeout(timeoutId);
          console.warn("[3dBimFab AR] Subida serverless demorada o fallida:", apiErr);
        }

        setGenerandoAR(false);
        window.location.href = `/ar?source=local&name=${encodeURIComponent(modelName)}`;
        return;
      }

      const res = await fetch(`${arUploadUrl}?mode=ar&name=${encodeURIComponent(modelName)}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: glbBuffer,
      });

      if (!res.ok) {
        throw new Error("No se pudo preparar el modelo para Realidad Aumentada.");
      }

      const data = await res.json();

      setArData({
        id: data.id,
        sizeBefore: data.sizeBefore,
        sizeAfter: data.sizeAfter,
      });
      setModalARAbierto(true);
    } catch (err: any) {
      console.error("Error al preparar AR:", err);
      alert("Error al preparar Realidad Aumentada: " + (err?.message || err));
    } finally {
      setGenerandoAR(false);
    }
  };

  return {
    exportandoGLB,
    generandoAR,
    modalARAbierto,
    setModalARAbierto,
    arData,
    generateCleanGLB,
    exportToGLB,
    descargarGlbSegunModo,
    abrirRealidadAumentada,
  };
}

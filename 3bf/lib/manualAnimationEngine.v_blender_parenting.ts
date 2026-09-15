/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ============================================================================
 * MOTOR CINEMÁTICO 3dBimFab - MANUAL ANIMATION ENGINE
 * ============================================================================
 * Versión: 2.1.2 (Edición Oficial Estable: Bahía Fisiomecánica y Cinemática Telescópica Pura)
 * Estado: Versión Oficial Consagrada / Producción Estable
 * Descripción:
 *   Motor matemático y cinemático puro para la compilación de pistas de animación
 *   (AnimationClip, VectorKeyframeTrack, QuaternionKeyframeTrack) en Three.js.
 *   Gobierna la apertura/cierre de cajones, curvas de desaceleración S-Curve (Smoothstep),
 *   cinemática telescópica de correderas (mallas 1 a 4), blindaje de bahía fisiomecánica
 *   y ensamblaje de piezas.
 * 
 * NOMENCLATURA CANÓNICA DE MALLAS DE CORREDERA TELESCÓPICA:
 *   - Malla 1 (Fija):       Perfil exterior metálico atornillado a la carcasa / lateral
 *                           del mueble. Se mantiene estática (desplazamiento 0%).
 *   - Malla 2 (Intermedia): Perfil telescópico central con rodamientos a bolas. Se desplaza
 *                           a media carrera telescópica (desplazamiento 50%).
 *   - Malla 3 (Móvil):      Perfil interior metálico atornillado directamente al costado
 *                           de madera del cajón. Acompaña íntegramente al cajón (desplazamiento 100%).
 *   - Malla 4 (Seguro):     Gatillo / pin plástico negro de retención y desacople.
 *                           Solidario a la guía móvil y al cajón de madera (desplazamiento 100%).
 * 
 * NOTA DE ARQUITECTURA OFICIAL:
 *   - Blindaje de Bahía Fisiomecánica: el eje central del mueble (centroXMueble = 0.6475 m)
 *     se calcula de la envolvente geométrica real. Cada cajón anima única y estrictamente
 *     las correderas de su propia columna, erradicando invasiones cruzadas.
 *   - Eliminadas todas las restricciones por índice numérico de pieza: la Malla 2 y Malla 3
 *     abren en perfecta sincronía bilateral en todos los cajones (pares e impares).
 * ============================================================================
 */
import * as THREE from "three";
import { PasoManualStudio, ElementoSecuenciaCinematica, SubBloqueArmado } from "./store";
import { extraerPiezaMadre } from "./piezaMadreUtils";

export interface KinematicEngineResult {
  clip: THREE.AnimationClip;
  mixer: THREE.AnimationMixer;
  actualizarTiempo: (segundos: number) => void;
  detener: () => void;
}

/**
 * Asegura que el objeto tenga guardado su estado CAD original inmutable.
 * Este estado representa el diseño exacto original sin ninguna transformación de banco.
 */
export function asegurarCadOriginal(obj: THREE.Object3D) {
  if (!obj.userData.__cadOrigPosition) {
    const init = obj.userData.initialPosition;
    if (init && typeof init.clone === "function") {
      obj.userData.__cadOrigPosition = init.clone();
    } else if (init && typeof init.x === "number") {
      obj.userData.__cadOrigPosition = new THREE.Vector3(init.x, init.y, init.z);
    } else {
      obj.userData.__cadOrigPosition = obj.position ? obj.position.clone() : new THREE.Vector3();
    }

    obj.userData.__cadOrigQuaternion = obj.quaternion ? obj.quaternion.clone() : new THREE.Quaternion();
    obj.userData.__cadOrigScale = obj.scale ? obj.scale.clone() : new THREE.Vector3(1, 1, 1);
    obj.userData.__cadOrigMatrix = new THREE.Matrix4().compose(
      obj.userData.__cadOrigPosition,
      obj.userData.__cadOrigQuaternion,
      obj.userData.__cadOrigScale
    );
  }
}

/**
 * Restaura el objeto a su posición, rotación, escala y matriz CAD original inmutable.
 */
export function restaurarACadOriginal(obj: THREE.Object3D) {
  asegurarCadOriginal(obj);
  obj.position.copy(obj.userData.__cadOrigPosition);
  obj.quaternion.copy(obj.userData.__cadOrigQuaternion);
  obj.scale.copy(obj.userData.__cadOrigScale);
  obj.matrix.copy(obj.userData.__cadOrigMatrix);
  obj.updateMatrix();
  obj.updateMatrixWorld(true);
}

/**
 * Obtiene de forma segura la posición de reposo como THREE.Vector3 con .clone(),
 * previniendo errores si userData fue serializado o clonado como objeto plano.
 */
export function getSafeRestPosition(obj: THREE.Object3D): THREE.Vector3 {
  const r = obj.userData?.__baseRestPosition;
  if (r) {
    if (typeof r.clone === "function") return r.clone();
    if (typeof r.x === "number" && typeof r.y === "number" && typeof r.z === "number") {
      return new THREE.Vector3(r.x, r.y, r.z);
    }
  }
  const init = obj.userData?.__cadOrigPosition || obj.userData?.initialPosition;
  if (init) {
    if (typeof init.clone === "function") return init.clone();
    if (typeof init.x === "number" && typeof init.y === "number" && typeof init.z === "number") {
      return new THREE.Vector3(init.x, init.y, init.z);
    }
  }
  return obj.position && typeof obj.position.clone === "function" ? obj.position.clone() : new THREE.Vector3();
}

/**
 * Obtiene de forma segura el cuaternión de reposo como THREE.Quaternion con .clone()
 */
export function getSafeRestQuaternion(obj: THREE.Object3D): THREE.Quaternion {
  const q = obj.userData?.__baseRestQuaternion;
  if (q) {
    if (typeof q.clone === "function") return q.clone();
    if (typeof q.x === "number" && typeof q.y === "number" && typeof q.z === "number" && typeof q.w === "number") {
      return new THREE.Quaternion(q.x, q.y, q.z, q.w);
    }
  }
  const initQ = obj.userData?.__cadOrigQuaternion;
  if (initQ) {
    if (typeof initQ.clone === "function") return initQ.clone();
    if (typeof initQ.x === "number" && typeof initQ.y === "number" && typeof initQ.z === "number" && typeof initQ.w === "number") {
      return new THREE.Quaternion(initQ.x, initQ.y, initQ.z, initQ.w);
    }
  }
  return obj.quaternion && typeof obj.quaternion.clone === "function" ? obj.quaternion.clone() : new THREE.Quaternion();
}

/**
 * Normaliza nombres de malla eliminando prefijos de Grasshopper y sufijos de instancia
 */
export function normalizarNombreNodo(nombre: string): string {
  if (!nombre) return "";
  return nombre.replace(/^RH_OUT:/i, "").trim();
}

/**
 * Encuentra todas las mallas de Three.js que corresponden a las piezas y herrajes asignados a un subbloque.
 */
/**
 * Encuentra todas las mallas de Three.js que corresponden a las piezas y herrajes asignados a un subbloque.
 * Si el objetivo tiene un número de instancia (ej. "Corrediça - Fija (5)"), la coincidencia es 100% estricta
 * para evitar capturar correderas de otros laterales o subbloques.
 */
export function obtenerMallasDeSubbloque(sceneMeshes: THREE.Mesh[], sub: SubBloqueArmado): THREE.Mesh[] {
  const piezasSet = new Set([...(sub.piezas || []), ...(sub.herrajes || [])].map((p) => p.toLowerCase().trim()));
  if (piezasSet.size === 0) return [];

  const resultado: THREE.Mesh[] = [];
  sceneMeshes.forEach((mesh) => {
    const u = mesh.userData || {};
    const cleanName = ((u.cleanName || mesh.name || "") as string).toLowerCase().trim();
    const pm = ((u.piezaMadre || extraerPiezaMadre(cleanName)) as string).toLowerCase().trim();
    const rawName = ((u.rawName || "") as string).toLowerCase().trim();
    const instKey = ((u.instanciaKey || "") as string).toLowerCase().trim();
    const meshName = (mesh.name || "").toLowerCase().trim();

    const coincide = Array.from(piezasSet).some((target) => {
      const tClean = target.replace(/^rh_out:\s*/i, "").trim().toLowerCase();
      const tieneInstancia = /\(\s*\d+\s*\)/.test(tClean);

      if (tieneInstancia) {
        // Coincidencia estricta de instancia (ej. "corrediça - fija (5)")
        return (
          instKey === tClean ||
          cleanName === tClean ||
          rawName === tClean ||
          meshName === tClean ||
          meshName.startsWith(tClean + "::") ||
          meshName.includes(tClean)
        );
      }

      // Pieza estructural o genérica sin número de instancia (ej. "Peça 7")
      const tPM = extraerPiezaMadre(tClean).toLowerCase().trim();
      return (
        target === cleanName ||
        target === rawName ||
        target === instKey ||
        target === meshName ||
        tClean === cleanName ||
        tClean === instKey ||
        (tPM && (tPM === pm || tPM === cleanName))
      );
    });

    if (coincide && !resultado.includes(mesh)) {
      resultado.push(mesh);
    }
  });

  return resultado;
}

/**
 * Aplica transformaciones de banco de trabajo (Acostar plano X,Y, Giros X/Y/Z ±90°, Offset X/Z)
 * a cada subbloque con EMPARENTAMIENTO RÍGIDO Y COHESIÓN ABSOLUTA:
 * 1. Todos los objetos del subbloque (correderas, tarugos, tornillos) están rígidamente fijados a la Pieza Máster.
 * 2. La rotación sobre el plano acostado se premultiplica para girar sobre la mesa horizontal (eje Y)
 *    DESPUÉS de haber acostado la pieza, garantizando que permanezca plana y atornillada.
 * 3. La transformación rígida completa se aplica solidariamente a todos los componentes del subbloque.
 */
export function aplicarTransformacionesBancoSubbloques(sceneMeshes: THREE.Mesh[], subbloques: SubBloqueArmado[]) {
  subbloques.forEach((sub) => {
    const tb = sub.transformBanco;
    const mallas = obtenerMallasDeSubbloque(sceneMeshes, sub);
    if (mallas.length === 0) return;

    // 1. Identificar la Pieza Máster de este subbloque
    let masterMesh: THREE.Mesh | null = null;
    if (sub.piezaMaster) {
      const pTarget = sub.piezaMaster.toLowerCase().trim();
      masterMesh = mallas.find((m) => {
        const u = m.userData || {};
        const cn = ((u.cleanName || m.name || "") as string).toLowerCase().trim();
        const pm = ((u.piezaMadre || extraerPiezaMadre(cn)) as string).toLowerCase().trim();
        const ik = ((u.instanciaKey || "") as string).toLowerCase().trim();
        return cn === pTarget || pm === pTarget || ik === pTarget;
      }) || null;
    }
    if (!masterMesh) {
      // Fallback a la primera pieza de madera del subbloque
      if (sub.piezas && sub.piezas.length > 0) {
        const pTarget = sub.piezas[0].toLowerCase().trim();
        masterMesh = mallas.find((m) => {
          const u = m.userData || {};
          const cn = ((u.cleanName || m.name || "") as string).toLowerCase().trim();
          const pm = ((u.piezaMadre || extraerPiezaMadre(cn)) as string).toLowerCase().trim();
          return cn === pTarget || pm === pTarget;
        }) || null;
      }
      if (!masterMesh) masterMesh = mallas[0];
    }

    if (!masterMesh) return;

    const acostado = tb?.acostado ?? false;
    const rotPlano = tb?.rotacionPlano ?? tb?.rotacionYDeg ?? (tb?.rotacion?.[1] || 0);
    const flipCara = tb?.flipCara ?? false;
    const offsetX = tb?.offsetX || 0;
    const offsetZ = tb?.offsetZ || 0;
    const apoyoEnPiso = tb?.apoyoEnPiso ?? true;

    // Asegurar que todas las mallas del subbloque arranquen desde su estado CAD inmutable
    mallas.forEach((m) => {
      restaurarACadOriginal(m);
    });

    // Si todo está en 0 y no hay que acostar, guardar reposo y continuar
    if (!acostado && rotPlano === 0 && !flipCara && offsetX === 0 && offsetZ === 0 && !apoyoEnPiso) {
      mallas.forEach((m) => {
        m.userData.__baseRestPosition = m.position.clone();
        m.userData.__baseRestQuaternion = m.quaternion.clone();
        m.userData.__bancoPosition = m.position.clone();
        m.userData.__bancoQuaternion = m.quaternion.clone();
      });
      return;
    }

    // =========================================================================
    // FASE 1: MATRIZ DE ACOSTAR LA PIEZA EN EL PLANO HORIZONTAL Y NIVELAR (Y = 0)
    // =========================================================================
    masterMesh.updateMatrixWorld(true);
    const origBox = new THREE.Box3().setFromObject(masterMesh);
    const pivotOrig = new THREE.Vector3();
    origBox.getCenter(pivotOrig);

    const mRotAcostar = new THREE.Matrix4();
    if (acostado) {
      const sz = new THREE.Vector3();
      origBox.getSize(sz);
      const minDim = Math.min(sz.x, sz.y, sz.z);
      if (minDim === sz.z) {
        mRotAcostar.makeRotationX(Math.PI / 2);
      } else if (minDim === sz.x) {
        mRotAcostar.makeRotationZ(Math.PI / 2);
      }
    }

    if (flipCara) {
      mRotAcostar.premultiply(new THREE.Matrix4().makeRotationX(Math.PI));
    }

    const mToOrig = new THREE.Matrix4().makeTranslation(-pivotOrig.x, -pivotOrig.y, -pivotOrig.z);
    const mFromOrig = new THREE.Matrix4().makeTranslation(pivotOrig.x, pivotOrig.y, pivotOrig.z);
    let mFase1 = new THREE.Matrix4().multiply(mFromOrig).multiply(mRotAcostar).multiply(mToOrig);

    if (apoyoEnPiso) {
      const boxAcostada = origBox.clone().applyMatrix4(mFase1);
      const deltaY = -boxAcostada.min.y;
      if (Math.abs(deltaY) > 0.0001) {
        const mFloor = new THREE.Matrix4().makeTranslation(0, deltaY, 0);
        mFase1 = mFloor.clone().multiply(mFase1);
      }
    }

    // =========================================================================
    // FASE 2: MATRIZ DE GIRO HORIZONTAL (EJE Y) ±90° Y JOYSTICK 2D
    // =========================================================================
    let M_banco = mFase1.clone();
    if (rotPlano !== 0 || offsetX !== 0 || offsetZ !== 0) {
      const boxPiso = origBox.clone().applyMatrix4(mFase1);
      const centroPiso = new THREE.Vector3();
      boxPiso.getCenter(centroPiso);

      // Centro 3D exacto de rotación sobre el piso horizontal (X, Y, Z completos)
      const mToCentro = new THREE.Matrix4().makeTranslation(-centroPiso.x, -centroPiso.y, -centroPiso.z);
      const mRotY = new THREE.Matrix4();
      if (rotPlano !== 0) {
        mRotY.makeRotationY(THREE.MathUtils.degToRad(rotPlano));
      }
      const mFromCentro = new THREE.Matrix4().makeTranslation(centroPiso.x + offsetX, centroPiso.y, centroPiso.z + offsetZ);
      const mGiroYOffset = new THREE.Matrix4().multiply(mFromCentro).multiply(mRotY).multiply(mToCentro);

      M_banco = mGiroYOffset.clone().multiply(mFase1);
    }

    // =========================================================================
    // FASE 3: APLICACIÓN RIGUROSA DE BLENDER PARENTING CANÓNICO
    // 1. W_master_banco = M_banco * W_cad_master
    // 2. M_rel = W_cad_master^-1 * W_cad_hijo (Matriz local inmutable de herrajes en el tablero)
    // 3. W_hijo_banco = W_master_banco * M_rel (Solidaridad física indestructible con Delta = 0.00000000)
    // =========================================================================

    // 3.1. Transformar primero la Pieza Máster
    asegurarCadOriginal(masterMesh);
    const cadWorldMaster = new THREE.Matrix4().compose(
      masterMesh.userData.__cadOrigPosition,
      masterMesh.userData.__cadOrigQuaternion,
      masterMesh.userData.__cadOrigScale || new THREE.Vector3(1, 1, 1)
    );
    let W_cad_master = cadWorldMaster;
    if (masterMesh.parent) {
      masterMesh.parent.updateMatrixWorld(true);
      W_cad_master = masterMesh.parent.matrixWorld.clone().multiply(cadWorldMaster);
    }

    const W_master_final = M_banco.clone().multiply(W_cad_master);
    if (masterMesh.parent) {
      const parentInv = masterMesh.parent.matrixWorld.clone().invert();
      const localMaster = parentInv.multiply(W_master_final);
      localMaster.decompose(masterMesh.position, masterMesh.quaternion, masterMesh.scale);
    } else {
      W_master_final.decompose(masterMesh.position, masterMesh.quaternion, masterMesh.scale);
    }
    masterMesh.updateMatrix();
    masterMesh.updateMatrixWorld(true);

    masterMesh.userData.__baseRestPosition = masterMesh.position.clone();
    masterMesh.userData.__baseRestQuaternion = masterMesh.quaternion.clone();
    masterMesh.userData.__bancoPosition = masterMesh.position.clone();
    masterMesh.userData.__bancoQuaternion = masterMesh.quaternion.clone();

    // Matriz inversa inmutable de la máster en CAD
    const invW_cad_master = W_cad_master.clone().invert();

    // 3.2. Emparentar de forma rígida cada una de las demás piezas y herrajes a la Pieza Máster
    mallas.forEach((m) => {
      if (m === masterMesh) return;

      asegurarCadOriginal(m);
      const cadWorldHijo = new THREE.Matrix4().compose(
        m.userData.__cadOrigPosition,
        m.userData.__cadOrigQuaternion,
        m.userData.__cadOrigScale || new THREE.Vector3(1, 1, 1)
      );
      let W_cad_hijo = cadWorldHijo;
      if (m.parent) {
        m.parent.updateMatrixWorld(true);
        W_cad_hijo = m.parent.matrixWorld.clone().multiply(cadWorldHijo);
      }

      // Matriz relativa inmutable del hijo respecto a la máster en CAD (Blender Parent Inverse)
      const M_rel = invW_cad_master.clone().multiply(W_cad_hijo);

      // Posición mundial exacta en banco: W_hijo = W_master_final * M_rel
      const W_hijo_final = masterMesh.matrixWorld.clone().multiply(M_rel);

      if (m.parent) {
        const parentInv = m.parent.matrixWorld.clone().invert();
        const localMat = parentInv.multiply(W_hijo_final);
        localMat.decompose(m.position, m.quaternion, m.scale);
      } else {
        W_hijo_final.decompose(m.position, m.quaternion, m.scale);
      }
      m.updateMatrix();
      m.updateMatrixWorld(true);

      m.userData.__baseRestPosition = m.position.clone();
      m.userData.__baseRestQuaternion = m.quaternion.clone();
      m.userData.__bancoPosition = m.position.clone();
      m.userData.__bancoQuaternion = m.quaternion.clone();
    });
  });
}

/**
 * Construye y hornea un AnimationClip glTF nativo para el paso especificado,
 * garantizando coherencia física, Pop-In 200%, trayectorias colineales y herramientas acopladas.
 */
export function compilarAnimacionPaso(
  rootScene: THREE.Object3D,
  paso: PasoManualStudio,
  toolMeshes?: {
    martillo?: THREE.Object3D | null;
    llaveAllen?: THREE.Object3D | null;
    destornillador?: THREE.Object3D | null;
    omitirTransformBanco?: boolean;
  }
): KinematicEngineResult {
  const tracks: THREE.KeyframeTrack[] = [];
  const duracionPaso = Math.max(paso.duracionTotal || 10.0, 1.0);
  const omitirBanco = Boolean(toolMeshes?.omitirTransformBanco);

  // Lista de todas las mallas y mapa por nombre normalizado
  const sceneMeshes: THREE.Mesh[] = [];
  const sceneObjects = new Map<string, THREE.Object3D>();
  rootScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh || (child as THREE.Group).isGroup) {
      if (!omitirBanco) {
        asegurarCadOriginal(child);
        restaurarACadOriginal(child);
        child.userData.__baseRestPosition = child.position.clone();
        child.userData.__baseRestQuaternion = child.quaternion.clone();
        child.userData.__baseRestScale = child.scale.clone();
      } else {
        child.userData.__baseRestPosition = child.position.clone();
        child.userData.__baseRestQuaternion = child.quaternion.clone();
        child.userData.__baseRestScale = child.scale.clone();
      }
    }
    if ((child as THREE.Mesh).isMesh) {
      sceneMeshes.push(child as THREE.Mesh);
    }
    if (child.name) {
      const norm = normalizarNombreNodo(child.name);
      sceneObjects.set(norm, child);
      sceneObjects.set(child.name, child);
    }
  });

  // 🛡️ Asegurar que cada malla arranque físicamente en su posición de reposo limpia (t = 0)
  if (!omitirBanco) {
    sceneMeshes.forEach((mesh) => {
      const rest = getSafeRestPosition(mesh);
      mesh.position.copy(rest);
      const restQ = getSafeRestQuaternion(mesh);
      mesh.quaternion.copy(restQ);
      mesh.updateMatrix();
      mesh.updateMatrixWorld(true);
    });

    // 🔨 Aplicar transformaciones de Banco de Trabajo si el paso contiene subbloques (Lay Flat, Rotar ±90°, Flip, Offset X/Z)
    if (paso.subbloques && paso.subbloques.length > 0 && paso.tipo !== "showcase") {
      aplicarTransformacionesBancoSubbloques(sceneMeshes, paso.subbloques);
    }
  }

  // =========================================================================
  // 1. PASO 00: SHOWCASE FUNCIONAL (Apertura y Cierre de Cajones / Puertas)
  // =========================================================================
  if (paso.tipo === "showcase") {
    const distanciaDefecto = (paso.showcase?.distanciaAperturaMm || 300) / 1000.0; // metros
    const tEnd = duracionPaso;
    const coreografia = paso.showcase?.coreografia || "secuencial";
    const ejeGlobal = paso.showcase?.ejeGlobal || "+Z";

    // Helper para resolver vector unitario según el eje
    const resolverVectorEje = (eje: string) => {
      switch (eje) {
        case "+Z": return new THREE.Vector3(0, 0, 1);
        case "-Z": return new THREE.Vector3(0, 0, -1);
        case "+Y": return new THREE.Vector3(0, 1, 0);
        case "-Y": return new THREE.Vector3(0, -1, 0);
        case "+X": return new THREE.Vector3(1, 0, 0);
        case "-X": return new THREE.Vector3(-1, 0, 0);
        default: return new THREE.Vector3(0, 0, 1);
      }
    };

    const grupos = paso.showcase?.gruposCinematicos || [];

    if (grupos.length > 0 && paso.showcase?.abrirCajones !== false) {
      const numGrupos = grupos.length;
      const tStartMargin = Math.max(0.2, 0.04 * tEnd);
      const tEndMargin = Math.max(0.2, 0.04 * tEnd);
      const tUsable = tEnd - tStartMargin - tEndMargin;

      grupos.forEach((grupo, idx) => {
        const dirVector = resolverVectorEje(grupo.ejeApertura || ejeGlobal);
        // 📏 Sincronización de carrera de apertura para cajones:
        // Por defecto activo (true). Todos los cajones comparten exactamente la misma carrera y plano de extensión.
        const sincronizarCajones = paso.showcase?.sincronizarCarreraCajones !== false;
        const distMmEfectiva = (grupo.tipo === "cajon" && sincronizarCajones)
          ? (paso.showcase?.distanciaAperturaMm ?? grupo.distanciaMm ?? 300)
          : (grupo.distanciaMm ?? paso.showcase?.distanciaAperturaMm ?? 300);
        const distMetros = distMmEfectiva / 1000.0;
        const offset = dirVector.clone().multiplyScalar(distMetros);

        // Calcular ventanas de tiempo distribuidas proporcionalmente según la coreografía solicitada
        let t0 = tStartMargin;
        let t1 = tStartMargin + tUsable * 0.35;
        let t2 = tStartMargin + tUsable * 0.65;
        let t3 = tStartMargin + tUsable * 0.95;

        if (coreografia === "secuencial") {
          // Cajón 1 abre suavemente -> pausa -> cierra; luego Cajón 2 abre suavemente -> pausa -> cierra
          const slot = tUsable / Math.max(1, numGrupos);
          t0 = tStartMargin + idx * slot;
          t1 = t0 + slot * 0.38; // Abre suavemente
          t2 = t0 + slot * 0.62; // Pausa abierto
          t3 = t0 + slot * 0.96; // Cierre suave
        } else if (coreografia === "cascada") {
          // Apertura escalonada: abre 1, abre 2, pausan ambos, y cierran en orden inverso
          const stepOpen = (0.28 * tUsable) / Math.max(1, numGrupos);
          const durOpen = 0.22 * tUsable;
          t0 = tStartMargin + idx * stepOpen;
          t1 = t0 + durOpen;
          const tPauseEnd = tStartMargin + 0.55 * tUsable;
          const stepClose = (0.22 * tUsable) / Math.max(1, numGrupos);
          const durClose = 0.20 * tUsable;
          t2 = Math.max(t1 + 0.1, tPauseEnd + (numGrupos - 1 - idx) * stepClose);
          t3 = t2 + durClose;
        } else {
          // Simultáneo: todos abren al unísono y cierran juntos
          t0 = tStartMargin;
          t1 = tStartMargin + 0.35 * tUsable;
          t2 = tStartMargin + 0.65 * tUsable;
          t3 = tStartMargin + 0.95 * tUsable;
        }

        const animatedMeshUuids = new Set<string>();

        if (grupo.tipo === "puerta") {
          // 🚪 MODO PUERTA: Rotación angular alrededor del eje de bisagra/pivote
          const doorMeshes: THREE.Mesh[] = [];
          grupo.piezas.forEach((nombrePieza) => {
            const piezaBuscada = nombrePieza.toLowerCase().trim();
            const pmBuscada = extraerPiezaMadre(nombrePieza).toLowerCase().trim();
            if (!piezaBuscada && !pmBuscada) return;

            sceneMeshes.forEach((obj) => {
              const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
              const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
              const nodeName = (obj.name || "").toLowerCase().trim();
              const pmObj = extraerPiezaMadre(instKey || cleanName || nodeName).toLowerCase().trim();

              const coincide =
                (instKey && (instKey === piezaBuscada || instKey === pmBuscada)) ||
                (nodeName && (nodeName === piezaBuscada || nodeName.startsWith(piezaBuscada + "::"))) ||
                (cleanName && (cleanName === piezaBuscada || cleanName === pmBuscada)) ||
                (pmObj && pmObj === pmBuscada && !nombrePieza.includes("("));

              if (coincide && !animatedMeshUuids.has(obj.uuid)) {
                animatedMeshUuids.add(obj.uuid);
                doorMeshes.push(obj);
              }
            });
          });

          if (doorMeshes.length > 0) {
            // Calcular BBox del conjunto de la puerta para ubicar el pivote de la bisagra
            const groupBbox = new THREE.Box3();
            doorMeshes.forEach((m) => {
              if (m.geometry) {
                if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
                const b = m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld);
                groupBbox.union(b);
              } else {
                groupBbox.expandByObject(m);
              }
            });

            const lado = grupo.ladoBisagra || "izquierda";
            const offsetM = (grupo.pivoteOffsetMm || 0) / 1000.0;
            const pivotX = lado === "derecha" ? groupBbox.max.x - offsetM : groupBbox.min.x + offsetM;
            const pivotY = groupBbox.min.y;
            const pivotZ = groupBbox.max.z; // Frente del mueble
            const pivot = new THREE.Vector3(pivotX, pivotY, pivotZ);

            const anguloDeg = grupo.anguloRotacionDeg ?? 90;
            // Para bisagra derecha gira positivo; para bisagra izquierda gira negativo hacia afuera
            const dirSign = lado === "derecha" ? 1 : -1;
            const totalAngRad = THREE.MathUtils.degToRad(anguloDeg * dirSign);

            doorMeshes.forEach((obj) => {
              const initPos = getSafeRestPosition(obj);
              const initQuat = getSafeRestQuaternion(obj);

              // Subdivisión de arco para trayectoria circular física suave
              const numSubsteps = 5;
              const posTimes: number[] = [0];
              const posValues: number[] = [initPos.x, initPos.y, initPos.z];
              const rotTimes: number[] = [0];
              const rotValues: number[] = [initQuat.x, initQuat.y, initQuat.z, initQuat.w];

              // Reposo inicial hasta t0
              posTimes.push(t0);
              posValues.push(initPos.x, initPos.y, initPos.z);
              rotTimes.push(t0);
              rotValues.push(initQuat.x, initQuat.y, initQuat.z, initQuat.w);

              // Apertura de t0 a t1 en arco circular continuo
              for (let s = 1; s <= numSubsteps; s++) {
                const frac = s / numSubsteps;
                const timeSub = t0 + (t1 - t0) * frac;
                const aSub = totalAngRad * frac;
                const qSub = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), aSub);
                const pSub = pivot.clone().add(initPos.clone().sub(pivot).applyQuaternion(qSub));
                const qCombined = qSub.clone().multiply(initQuat);

                posTimes.push(timeSub);
                posValues.push(pSub.x, pSub.y, pSub.z);
                rotTimes.push(timeSub);
                rotValues.push(qCombined.x, qCombined.y, qCombined.z, qCombined.w);
              }

              // Mantener abierto en reposo de t1 a t2
              const qOpen = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), totalAngRad);
              const pOpen = pivot.clone().add(initPos.clone().sub(pivot).applyQuaternion(qOpen));
              const qCombinedOpen = qOpen.clone().multiply(initQuat);

              posTimes.push(t2);
              posValues.push(pOpen.x, pOpen.y, pOpen.z);
              rotTimes.push(t2);
              rotValues.push(qCombinedOpen.x, qCombinedOpen.y, qCombinedOpen.z, qCombinedOpen.w);

              // Cierre de t2 a t3 en arco circular inverso
              for (let s = 1; s <= numSubsteps; s++) {
                const frac = s / numSubsteps;
                const timeSub = t2 + (t3 - t2) * frac;
                const aSub = totalAngRad * (1 - frac);
                const qSub = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), aSub);
                const pSub = pivot.clone().add(initPos.clone().sub(pivot).applyQuaternion(qSub));
                const qCombined = qSub.clone().multiply(initQuat);

                posTimes.push(timeSub);
                posValues.push(pSub.x, pSub.y, pSub.z);
                rotTimes.push(timeSub);
                rotValues.push(qCombined.x, qCombined.y, qCombined.z, qCombined.w);
              }

              // Reposo final cerrado hasta tEnd
              posTimes.push(tEnd);
              posValues.push(initPos.x, initPos.y, initPos.z);
              rotTimes.push(tEnd);
              rotValues.push(initQuat.x, initQuat.y, initQuat.z, initQuat.w);

              tracks.push(new THREE.VectorKeyframeTrack(`${obj.uuid}.position`, posTimes, posValues));
              tracks.push(new THREE.QuaternionKeyframeTrack(`${obj.uuid}.quaternion`, rotTimes, rotValues));
            });
          }
        } else {
          // 🗄️ MODO CAJÓN: Extracción lineal colineal con correderas telescópicas
          // 1. Identificar todas las correderas fijas de la escena para aislar con precisión sus tornillos de anclaje al lateral
          const correderasFijas: { x: number; y: number; z: number }[] = [];
          let minXMueble = Infinity;
          let maxXMueble = -Infinity;
          let sumYGrupo = 0;
          let countYGrupo = 0;
          let minXGrupo = Infinity;
          let maxXGrupo = -Infinity;

          sceneMeshes.forEach((obj) => {
            const ik = ((obj.userData?.instanciaKey || "") as string).toLowerCase();
            const cn = ((obj.userData?.cleanName || "") as string).toLowerCase();
            const nm = (obj.name || "").toLowerCase();
            const p = getSafeRestPosition(obj);
            if (p) {
              if (p.x < minXMueble) minXMueble = p.x;
              if (p.x > maxXMueble) maxXMueble = p.x;
              if (ik.includes("fija") || cn.includes("fija") || nm.includes("fija")) {
                correderasFijas.push({ x: p.x, y: p.y, z: p.z });
              }
              const coincideConGrupo = grupo.piezas.some((pz) => {
                const pLow = pz.toLowerCase().trim();
                return pLow === ik || pLow === cn || ik.startsWith(pLow) || cn.startsWith(pLow);
              });
              if (coincideConGrupo) {
                // Priorizar piezas estructurales de madera para calcular el centro real del cajón
                // y evitar distorsiones si se incluyeron accidentalmente tornillos de otras bahías
                const esHerrajeAux = ik.includes("parafuso") || cn.includes("parafuso") || ik.includes("corredi") || cn.includes("corredi");
                if (!esHerrajeAux) {
                  sumYGrupo += p.y;
                  countYGrupo++;
                  if (p.x < minXGrupo) minXGrupo = p.x;
                  if (p.x > maxXGrupo) maxXGrupo = p.x;
                }
              }
            }
          });

          // Fallback a todas las piezas si el grupo no tenía maderas explícitas
          if (countYGrupo === 0) {
            sceneMeshes.forEach((obj) => {
              const ik = ((obj.userData?.instanciaKey || "") as string).toLowerCase();
              const cn = ((obj.userData?.cleanName || "") as string).toLowerCase();
              const p = getSafeRestPosition(obj);
              if (p && grupo.piezas.some((pz) => {
                const pLow = pz.toLowerCase().trim();
                return pLow === ik || pLow === cn || ik.startsWith(pLow) || cn.startsWith(pLow);
              })) {
                sumYGrupo += p.y;
                countYGrupo++;
                if (p.x < minXGrupo) minXGrupo = p.x;
                if (p.x > maxXGrupo) maxXGrupo = p.x;
              }
            });
          }
          const centroXMueble = (minXMueble !== Infinity && maxXMueble !== -Infinity)
            ? (minXMueble + maxXMueble) / 2
            : 0.6475;
          const centroXCajon = (minXGrupo !== Infinity && maxXGrupo !== -Infinity)
            ? (minXGrupo + maxXGrupo) / 2
            : null;
          const yCajon = countYGrupo > 0 ? sumYGrupo / countYGrupo : null;

          // Función de curva cinemática suave (Smoothstep) garantizada estrictamente entre 0.0 y 1.0 (cero rebotes)
          const generarPistasCajon = (objUuid: string, basePos: THREE.Vector3, movOffset: THREE.Vector3) => {
            const times: number[] = [0];
            const values: number[] = [basePos.x, basePos.y, basePos.z];
            
            // Subpasos para aceleración y desaceleración fluida
            const steps = 8;
            
            // Fase 1: Reposo cerrado hasta t0
            times.push(t0);
            values.push(basePos.x, basePos.y, basePos.z);

            // Fase 2: Apertura suave de t0 a t1 (factor estrictamente de 0.0 a 1.0)
            for (let s = 1; s <= steps; s++) {
              const frac = s / steps;
              const ease = frac * frac * (3 - 2 * frac); // Smoothstep
              const t = t0 + (t1 - t0) * frac;
              const p = basePos.clone().add(movOffset.clone().multiplyScalar(ease));
              times.push(t);
              values.push(p.x, p.y, p.z);
            }

            // Fase 3: Mantener abierto de t1 a t2
            times.push(t2);
            const pAbierto = basePos.clone().add(movOffset);
            values.push(pAbierto.x, pAbierto.y, pAbierto.z);

            // Fase 4: Cierre suave de t2 a t3 (factor estrictamente de 1.0 a 0.0)
            for (let s = 1; s <= steps; s++) {
              const frac = s / steps;
              const ease = 1 - (frac * frac * (3 - 2 * frac)); // Smoothstep inverso
              const t = t2 + (t3 - t2) * frac;
              const p = basePos.clone().add(movOffset.clone().multiplyScalar(Math.max(0, ease)));
              times.push(t);
              values.push(p.x, p.y, p.z);
            }

            // Fase 5: Reposo cerrado estricto en 0.0 mm hasta tEnd
            times.push(tEnd);
            values.push(basePos.x, basePos.y, basePos.z);

            return new THREE.VectorKeyframeTrack(`${objUuid}.position`, times, values, THREE.InterpolateLinear);
          };

          // Buscar cada malla miembro del grupo
          grupo.piezas.forEach((nombrePieza) => {
            const piezaBuscada = nombrePieza.toLowerCase().trim();
            const pmBuscada = extraerPiezaMadre(nombrePieza).toLowerCase().trim();
            if (!piezaBuscada && !pmBuscada) return;

            sceneMeshes.forEach((obj) => {
              const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
              const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
              const nodeName = (obj.name || "").toLowerCase().trim();
              const pmObj = extraerPiezaMadre(instKey || cleanName || nodeName).toLowerCase().trim();

              // 🛡️ REGLA FÍSICA: Jamás mover elementos fijos
              const esFija = instKey.includes("fija") || cleanName.includes("fija") || nodeName.includes("fija");
              if (esFija) return;

              // 🛡️ REGLA FÍSICA: Tornillos fijados a la corredera fija o a la pared trasera del mueble
              // NOTA: Debe aplicar EXCLUSIVAMENTE a tornillos/parafusos, jamás a las correderas metálicas
              const initPos = getSafeRestPosition(obj);
              const esTornillo = pmObj.includes("parafuso") || pmObj.includes("tornillo") || cleanName.includes("parafuso") || instKey.includes("parafuso");
              if (esTornillo) {
                // 🛑 Si el tornillo está en la pared trasera del mueble (Z < -0.40 m, fondos/espalda Peça 15), JAMÁS se mueve con un cajón
                if (initPos.z < -0.40) return;

                // 🛑 Si el tornillo está pegado al lateral exterior del mueble o al montante divisorio central, es fijo
                const distMin = initPos.x - minXMueble;
                const distMax = maxXMueble - initPos.x;
                const distCentro = Math.abs(initPos.x - centroXMueble);
                if (distMin < 0.025 || distMax < 0.025 || distCentro < 0.010) return;

                if (correderasFijas.length > 0) {
                  const unidoACorrederaFija = correderasFijas.some((fija) => {
                    const dy = Math.abs(initPos.y - fija.y);
                    const dz = Math.abs(initPos.z - fija.z);
                    if (dy < 0.035 && dz < 0.28) {
                      if (fija.x < centroXMueble && initPos.x <= fija.x + 0.002) return true;
                      if (fija.x >= centroXMueble && initPos.x >= fija.x - 0.002) return true;
                    }
                    return false;
                  });
                  if (unidoACorrederaFija) {
                    // 🛑 Este tornillo fija la corredera al lateral del mueble: DEBE PERMANECER FIJO
                    return;
                  }
                }
              }

              const coincide =
                (instKey && (instKey === piezaBuscada || instKey === pmBuscada)) ||
                (nodeName && (nodeName === piezaBuscada || nodeName.startsWith(piezaBuscada + "::"))) ||
                (cleanName && (cleanName === piezaBuscada || cleanName === pmBuscada)) ||
                (pmObj && pmObj === pmBuscada && !nombrePieza.includes("("));

              if (coincide && !animatedMeshUuids.has(obj.uuid)) {
                animatedMeshUuids.add(obj.uuid);
                const isIntermedia =
                  instKey.includes("intermedia") || cleanName.includes("intermedia") || nodeName.includes("intermedia");
                const effectiveOffset = isIntermedia ? offset.clone().multiplyScalar(0.5) : offset;
                tracks.push(generarPistasCajon(obj.uuid, initPos, effectiveOffset));
              }
            });
          });

          // 🔩 Cinemática Telescópica Canónica: Garantizar que la parte metálica móvil atornillada al lateral del cajón avance al 100%
          // y la guía intermedia al 50%, manteniendo la fija estática
          if (yCajon !== null) {
            sceneMeshes.forEach((obj) => {
              const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
              const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
              const nodeName = (obj.name || "").toLowerCase().trim();
              const esCorredera = instKey.includes("corredi") || cleanName.includes("corredi") || nodeName.includes("corredi");

              if (esCorredera && !animatedMeshUuids.has(obj.uuid)) {
                const initPos = getSafeRestPosition(obj);
                // Coincidencia con la altura de este cajón específico (tolerancia vertical de 100 mm)
                if (Math.abs(initPos.y - yCajon) < 0.10) {
                  // 🛑 Blindaje de Bahía Fisiomecánica: En muebles con múltiples columnas (ej. Cómoda Ravenna),
                  // un cajón de la columna izquierda jamás puede arrastrar correderas de la columna derecha, y viceversa
                  if (centroXCajon !== null && Math.abs(centroXCajon - centroXMueble) > 0.05) {
                    const cajonEnBahiaIzquierda = centroXCajon < centroXMueble;
                    const correderaEnBahiaIzquierda = initPos.x < centroXMueble;
                    if (cajonEnBahiaIzquierda !== correderaEnBahiaIzquierda) return;
                  }

                  // Tolerancia en X dentro de su propia columna (holgura milimétrica de 15 mm)
                  if (minXGrupo !== Infinity && maxXGrupo !== -Infinity) {
                    const enMismaColumna = initPos.x >= minXGrupo - 0.015 && initPos.x <= maxXGrupo + 0.015;
                    if (!enMismaColumna) return;
                  }

                  const esFija = instKey.includes("fija") || cleanName.includes("fija") || nodeName.includes("fija");
                  if (esFija) return; // 🛑 La corredera fija al mueble jamás se mueve

                  animatedMeshUuids.add(obj.uuid);
                  const esIntermedia =
                    instKey.includes("intermedia") || cleanName.includes("intermedia") || nodeName.includes("intermedia");
                  if (esIntermedia) {
                    // Guía intermedia telescópica (Malla 2) al 50% de la carrera diferencial
                    tracks.push(generarPistasCajon(obj.uuid, initPos, offset.clone().multiplyScalar(0.5)));
                  } else {
                    // Guía móvil metálica interior (Malla 3) y gatillo plástico negro (Malla 4) al 100% (solidarios al cajón de madera)
                    tracks.push(generarPistasCajon(obj.uuid, initPos, offset));
                  }
                }
              }
            });

            // 🔩 Blindaje Fisiomecánico de Herrajes del Cajón:
            // Garantiza que cualquier soporte (Suporte), tornillo de fondo (Parafuso F)
            // o tornillos de fijación de corredera móvil y frente (Parafuso E)
            // ubicados en la bahía física de este cajón específico viajen automáticamente al 100% con él
            sceneMeshes.forEach((obj) => {
              if (animatedMeshUuids.has(obj.uuid)) return;

              const instKey = ((obj.userData?.instanciaKey || "") as string).toLowerCase().trim();
              const cleanName = ((obj.userData?.cleanName || "") as string).toLowerCase().trim();
              const nodeName = (obj.name || "").toLowerCase().trim();
              const pmObj = extraerPiezaMadre(instKey || cleanName || nodeName).toLowerCase().trim();

              const esHerrajeCajon =
                pmObj.includes("suporte") ||
                cleanName.includes("suporte") ||
                instKey.includes("suporte") ||
                pmObj.includes("parafuso f") ||
                cleanName.includes("parafuso f") ||
                instKey.includes("parafuso f") ||
                pmObj.includes("parafuso e") ||
                cleanName.includes("parafuso e") ||
                instKey.includes("parafuso e");

              if (esHerrajeCajon) {
                const initPos = getSafeRestPosition(obj);

                // 🛑 REGLA FÍSICA ABSOLUTA: Cualquier tornillo en la pared trasera del mueble
                // (Z < -0.40 m, como los tornillos y clavos de los fondos Peça 15) es 100% estático
                if (initPos.z < -0.40) return;

                // Coincidencia con la altura de este cajón específico (tolerancia vertical de 80 mm)
                if (Math.abs(initPos.y - yCajon) < 0.08) {
                  // 🛑 Blindaje de Bahía Fisiomecánica: Evitar cruces entre columna izquierda y derecha
                  if (centroXCajon !== null && Math.abs(centroXCajon - centroXMueble) > 0.05) {
                    const cajonEnBahiaIzquierda = centroXCajon < centroXMueble;
                    const herrajeEnBahiaIzquierda = initPos.x < centroXMueble;
                    if (cajonEnBahiaIzquierda !== herrajeEnBahiaIzquierda) return;
                  }

                  // 🛑 REGLA FÍSICA PARA TORNILLOS DE CORREDERA (Parafuso E):
                  // Si el tornillo está atornillando el riel exterior al lateral del mueble o al montante divisorio,
                  // DEBE PERMANECER 100% FIJO. Solo se mueven los tornillos atornillados al cuerpo del cajón.
                  const esTornilloCorredera =
                    pmObj.includes("parafuso e") ||
                    cleanName.includes("parafuso e") ||
                    instKey.includes("parafuso e");

                  if (esTornilloCorredera) {
                    const distMin = initPos.x - minXMueble;
                    const distMax = maxXMueble - initPos.x;
                    const distCentro = Math.abs(initPos.x - centroXMueble);
                    // Si está a < 25 mm del borde del mueble o a < 10 mm del centro, es un tornillo de riel fijo
                    const esFijoAlMueble = distMin < 0.025 || distMax < 0.025 || distCentro < 0.010;
                    if (esFijoAlMueble) return;
                  } else {
                    // Para Suporte y Parafuso F: tolerancia en X dentro de su propia columna
                    if (minXGrupo !== Infinity && maxXGrupo !== -Infinity) {
                      const enMismaColumna = initPos.x >= minXGrupo - 0.025 && initPos.x <= maxXGrupo + 0.025;
                      if (!enMismaColumna) return;
                    }
                  }

                  // ✅ Acoplamiento canónico al 100% de la apertura del cajón
                  animatedMeshUuids.add(obj.uuid);
                  tracks.push(generarPistasCajon(obj.uuid, initPos, offset));
                }
              }
            });
          }
        }
      });
    } else if (paso.showcase?.abrirCajones) {
      // Fallback genérico si no hay grupos configurados
      const dirVector = resolverVectorEje(ejeGlobal);
      const offset = dirVector.clone().multiplyScalar(distanciaDefecto);
      const tStartMargin = Math.max(0.2, 0.04 * tEnd);
      const tEndMargin = Math.max(0.2, 0.04 * tEnd);
      const tUsable = tEnd - tStartMargin - tEndMargin;
      const t0 = tStartMargin;
      const t1 = tStartMargin + tUsable * 0.35;
      const t2 = tStartMargin + tUsable * 0.65;
      const t3 = tStartMargin + tUsable * 0.95;

      sceneObjects.forEach((obj, name) => {
        const nLow = name.toLowerCase();
        const esCajon =
          nLow.includes("cajon") ||
          nLow.includes("gaveta") ||
          nLow.includes("drawer") ||
          nLow.includes("peça 6") ||
          nLow.includes("peça 7");

        if (esCajon && (obj as any).isMesh) {
          const initPos = getSafeRestPosition(obj);
          const openPos = initPos.clone().add(offset);

          const posTimes = [0, t0, t1, t2, t3, tEnd];
          const posValues = [
            initPos.x, initPos.y, initPos.z,
            initPos.x, initPos.y, initPos.z,
            openPos.x, openPos.y, openPos.z,
            openPos.x, openPos.y, openPos.z,
            initPos.x, initPos.y, initPos.z,
            initPos.x, initPos.y, initPos.z,
          ];

          tracks.push(
            new THREE.VectorKeyframeTrack(
              `${obj.uuid}.position`,
              posTimes,
              posValues,
              THREE.InterpolateSmooth
            )
          );
        }
      });
    }

    // Detectar puertas con rotación angular
    if (paso.showcase?.abrirPuertas) {
      const tStartMargin = Math.max(0.2, 0.04 * tEnd);
      const tEndMargin = Math.max(0.2, 0.04 * tEnd);
      const tUsable = tEnd - tStartMargin - tEndMargin;
      const t0 = tStartMargin + 0.05 * tUsable;
      const t1 = tStartMargin + 0.35 * tUsable;
      const t2 = tStartMargin + 0.65 * tUsable;
      const t3 = tStartMargin + 0.95 * tUsable;
      const anguloRad = THREE.MathUtils.degToRad(paso.showcase.anguloPuertasDeg || 90);

      sceneObjects.forEach((obj, name) => {
        const nLow = name.toLowerCase();
        const esPuerta = nLow.includes("puerta") || nLow.includes("porta") || nLow.includes("door");
        if (esPuerta && (obj as any).isMesh) {
          const q0 = getSafeRestQuaternion(obj);
          const qOpen = q0.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), anguloRad));

          const rotTimes = [0, t0, t1, t2, t3, tEnd];
          const rotValues = [
            q0.x, q0.y, q0.z, q0.w,
            q0.x, q0.y, q0.z, q0.w,
            qOpen.x, qOpen.y, qOpen.z, qOpen.w,
            qOpen.x, qOpen.y, qOpen.z, qOpen.w,
            q0.x, q0.y, q0.z, q0.w,
            q0.x, q0.y, q0.z, q0.w,
          ];

          tracks.push(
            new THREE.QuaternionKeyframeTrack(`${obj.uuid}.quaternion`, rotTimes, rotValues)
          );
        }
      });
    }
  }

  // =========================================================================
  // 2. PASOS DE ENSAMBLE (P01+): PIEZA MASTER, HERRAJES Y POP-IN 200%
  // =========================================================================
  if (paso.tipo === "ensamble") {
    // Si hay una Pieza Master, siempre permanece en reposo en el banco
    paso.secuencia.forEach((elem: ElementoSecuenciaCinematica) => {
      const targetObj = sceneObjects.get(elem.nombreNodo) || sceneObjects.get(normalizarNombreNodo(elem.nombreNodo));
      if (!targetObj) return;

      const pRest = getSafeRestPosition(targetObj);
      const qRest = getSafeRestQuaternion(targetObj);
      const sRest = new THREE.Vector3(1, 1, 1);

      const tStart = Math.max(0, elem.tiempoInicio);
      const tDur = Math.max(0.5, elem.duracionMovimiento);
      const tEndAction = tStart + tDur;

      // Dirección colineal de aproximación:
      // Si es herraje, aproximarse a lo largo de su orientación o en +Y / +Z
      const offsetDist = elem.distanciaAproximacion || 0.15;
      const vOffset = new THREE.Vector3(0, offsetDist, 0);
      if (elem.tipo === "herraje") {
        vOffset.set(0, offsetDist, 0.05);
      }
      const pPop = pRest.clone().add(vOffset);

      // ── PISTA DE ESCALA (Pop-In 200% -> 100%) ──────────────────────────────
      if (elem.popIn) {
        const scaleTimes = [0, Math.max(0, tStart - 0.05), tStart, tStart + 0.35, tEndAction, duracionPaso];
        const scaleValues = [
          0, 0, 0,                        // Oculto antes de entrar
          0, 0, 0,                        // Oculto hasta instante exacto
          2.0, 2.0, 2.0,                  // Pop-In 200% de alto impacto
          sRest.x, sRest.y, sRest.z,      // Escala 100% normal
          sRest.x, sRest.y, sRest.z,      // Permanece a 100%
          sRest.x, sRest.y, sRest.z,      // Permanece a 100%
        ];
        tracks.push(new THREE.VectorKeyframeTrack(`${targetObj.uuid}.scale`, scaleTimes, scaleValues));
      }

      // ── PISTA DE POSICIÓN (Aproximación colineal suave) ─────────────────────
      const posTimes = [0, tStart, tStart + 0.35, tEndAction, duracionPaso];
      const posValues = [
        pPop.x, pPop.y, pPop.z,
        pPop.x, pPop.y, pPop.z,
        pPop.x, pPop.y, pPop.z,
        pRest.x, pRest.y, pRest.z,
        pRest.x, pRest.y, pRest.z,
      ];
      tracks.push(new THREE.VectorKeyframeTrack(`${targetObj.uuid}.position`, posTimes, posValues));

      // ── PISTA DE ROTACIÓN (Atornillado 720° / Minifix 180°) ──────────────────
      if (elem.rotacionGrados && elem.rotacionGrados > 0) {
        const totalAngleRad = THREE.MathUtils.degToRad(elem.rotacionGrados);
        const rotAxis = new THREE.Vector3(0, 1, 0); // Eje axial del tornillo
        
        // 4 sub-pasos de rotación continua
        const tRotStart = tStart + 0.35;
        const tRotMid1 = tRotStart + (tEndAction - tRotStart) * 0.33;
        const tRotMid2 = tRotStart + (tEndAction - tRotStart) * 0.66;
        const tRotEnd = tEndAction;

        const qStart = qRest.clone();
        const qMid1 = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngleRad * 0.33));
        const qMid2 = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngleRad * 0.66));
        const qFinal = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(rotAxis, totalAngleRad));

        const rotTimes = [0, tRotStart, tRotMid1, tRotMid2, tRotEnd, duracionPaso];
        const rotValues = [
          qStart.x, qStart.y, qStart.z, qStart.w,
          qStart.x, qStart.y, qStart.z, qStart.w,
          qMid1.x, qMid1.y, qMid1.z, qMid1.w,
          qMid2.x, qMid2.y, qMid2.z, qMid2.w,
          qFinal.x, qFinal.y, qFinal.z, qFinal.w,
          qFinal.x, qFinal.y, qFinal.z, qFinal.w,
        ];
        tracks.push(new THREE.QuaternionKeyframeTrack(`${targetObj.uuid}.quaternion`, rotTimes, rotValues));
      }

      // ── HERRAMIENTAS ACOPLADAS AL ELEMENTO ─────────────────────────────────
      if (elem.herramienta === "martillo" && toolMeshes?.martillo) {
        const hammer = toolMeshes.martillo;
        const hContact = pRest.clone().add(new THREE.Vector3(0, 0.05, 0)); // Contacto tangencial exacto 0mm
        const hReady = hContact.clone().add(new THREE.Vector3(0, 0.06, 0));
        const hRetract = hContact.clone().add(new THREE.Vector3(0, 0.25, 0));

        // 3 impactos rítmicos de martillado
        const tHStart = tStart + 0.35;
        const dt = (tEndAction - tHStart) / 6;

        const hTimes = [
          0, tStart, tHStart,
          tHStart + dt, tHStart + dt * 2,
          tHStart + dt * 3, tHStart + dt * 4,
          tHStart + dt * 5, tEndAction,
          tEndAction + 0.4, duracionPaso,
        ];
        const hPosValues = [
          hRetract.x, hRetract.y, hRetract.z,
          hRetract.x, hRetract.y, hRetract.z,
          hReady.x, hReady.y, hReady.z,
          hContact.x, hContact.y, hContact.z, // Golpe 1
          hReady.x, hReady.y, hReady.z,
          hContact.x, hContact.y, hContact.z, // Golpe 2
          hReady.x, hReady.y, hReady.z,
          hContact.x, hContact.y, hContact.z, // Golpe 3
          hContact.x, hContact.y, hContact.z,
          hRetract.x, hRetract.y, hRetract.z,
          hRetract.x, hRetract.y, hRetract.z,
        ];

        tracks.push(new THREE.VectorKeyframeTrack(`${hammer.uuid}.position`, hTimes, hPosValues));
        // Escala del martillo: visible solo durante su acción
        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${hammer.uuid}.scale`,
            [0, tStart, tStart + 0.1, tEndAction + 0.4, duracionPaso],
            [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0]
          )
        );
      }

      if (elem.herramienta === "llave_allen" && toolMeshes?.llaveAllen) {
        const allen = toolMeshes.llaveAllen;
        const aSocket = pRest.clone(); // Concéntrico en el socket
        const aRetract = aSocket.clone().add(new THREE.Vector3(0, 0.18, 0));

        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${allen.uuid}.position`,
            [0, tStart + 0.35, tEndAction, tEndAction + 0.5, duracionPaso],
            [
              aRetract.x, aRetract.y, aRetract.z,
              aSocket.x, aSocket.y, aSocket.z,
              aSocket.x, aSocket.y, aSocket.z,
              aRetract.x, aRetract.y, aRetract.z,
              aRetract.x, aRetract.y, aRetract.z,
            ]
          )
        );
        // Rota solidariamente con el tornillo
        if (elem.rotacionGrados) {
          const totalAngleRad = THREE.MathUtils.degToRad(elem.rotacionGrados);
          const qFinalAllen = qRest.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), totalAngleRad));
          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${allen.uuid}.quaternion`,
              [0, tStart + 0.35, tEndAction, duracionPaso],
              [
                qRest.x, qRest.y, qRest.z, qRest.w,
                qRest.x, qRest.y, qRest.z, qRest.w,
                qFinalAllen.x, qFinalAllen.y, qFinalAllen.z, qFinalAllen.w,
                qFinalAllen.x, qFinalAllen.y, qFinalAllen.z, qFinalAllen.w,
              ]
            )
          );
        }
        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${allen.uuid}.scale`,
            [0, tStart + 0.2, tStart + 0.35, tEndAction + 0.5, duracionPaso],
            [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0]
          )
        );
      }
    });
  }

  const clip = new THREE.AnimationClip("default", duracionPaso, tracks);
  const mixer = new THREE.AnimationMixer(rootScene);
  const action = mixer.clipAction(clip);
  action.loop = THREE.LoopOnce;
  action.clampWhenFinished = true;
  action.play();

  return {
    clip,
    mixer,
    actualizarTiempo: (segundos: number) => {
      const tClamped = Math.max(0, Math.min(segundos, duracionPaso));
      if (!action.isRunning() || tClamped <= 0.05) {
        action.reset();
        action.play();
      }
      mixer.setTime(tClamped);
    },
    detener: () => {
      mixer.stopAllAction();
      sceneMeshes.forEach((mesh) => {
        if (mesh.userData.__baseRestPosition) {
          mesh.position.copy(mesh.userData.__baseRestPosition);
        }
        if (mesh.userData.__baseRestQuaternion) {
          mesh.quaternion.copy(mesh.userData.__baseRestQuaternion);
        }
        if (mesh.userData.__baseRestScale) {
          mesh.scale.copy(mesh.userData.__baseRestScale);
        }
      });
    },
  };
}

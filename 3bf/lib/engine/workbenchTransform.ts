import * as THREE from "three";
import { SubBloqueArmado } from "../store";
import { extraerPiezaMadre } from "../piezaMadreUtils";
import {
  asegurarCadOriginal,
  restaurarACadOriginal,
  obtenerMallasDeSubbloque,
} from "./cadStateUtils";

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
      const pTargetPM = extraerPiezaMadre(pTarget).toLowerCase().trim();
      masterMesh = mallas.find((m) => {
        const u = m.userData || {};
        const cn = ((u.cleanName || m.name || "") as string).toLowerCase().trim();
        const pm = ((u.piezaMadre || extraerPiezaMadre(cn)) as string).toLowerCase().trim();
        const ik = ((u.instanciaKey || "") as string).toLowerCase().trim();
        return cn === pTarget || pm === pTarget || ik === pTarget || (pTargetPM && (pm === pTargetPM || cn === pTargetPM));
      }) || null;
    }
    if (!masterMesh) {
      // Fallback a la primera pieza de madera del subbloque
      if (sub.piezas && sub.piezas.length > 0) {
        const pTarget = sub.piezas[0].toLowerCase().trim();
        const pTargetPM = extraerPiezaMadre(pTarget).toLowerCase().trim();
        masterMesh = mallas.find((m) => {
          const u = m.userData || {};
          const cn = ((u.cleanName || m.name || "") as string).toLowerCase().trim();
          const pm = ((u.piezaMadre || extraerPiezaMadre(cn)) as string).toLowerCase().trim();
          return cn === pTarget || pm === pTarget || (pTargetPM && (pm === pTargetPM || cn === pTargetPM));
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
    // FASE 1: ACOSTAR Y NIVELAR EN EL SUELO (Y = 0) A TODAS LAS MALLAS DEL SUBBLOQUE
    // =========================================================================
    masterMesh.updateMatrixWorld(true);
    const origBox = new THREE.Box3().setFromObject(masterMesh);
    const pivotOrig = new THREE.Vector3();
    origBox.getCenter(pivotOrig);

    const mRotAcostar = new THREE.Matrix4();
    if (acostado) {
      const direccion = tb?.direccionAcostar || "izquierda";
      const signo = direccion === "derecha" ? -1 : 1;
      const sz = new THREE.Vector3();
      origBox.getSize(sz);
      const minDim = Math.min(sz.x, sz.y, sz.z);
      if (minDim === sz.z) {
        mRotAcostar.makeRotationX(signo * Math.PI / 2);
      } else if (minDim === sz.x) {
        mRotAcostar.makeRotationZ(signo * Math.PI / 2);
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

    // Aplicar Fase 1 a todas las mallas del subbloque para llegar a Posición 0 acostada
    mallas.forEach((m) => {
      asegurarCadOriginal(m);
      const cadWorld = new THREE.Matrix4().compose(
        m.userData.__cadOrigPosition,
        m.userData.__cadOrigQuaternion,
        m.userData.__cadOrigScale || new THREE.Vector3(1, 1, 1)
      );
      const worldAcostado = mFase1.clone().multiply(cadWorld);
      worldAcostado.decompose(m.position, m.quaternion, m.scale);
      m.updateMatrix();
      m.updateMatrixWorld(true);
    });

    // =========================================================================
    // FASE 2: EMPARENTAMIENTO BLENDER DESDE POSICIÓN 0 (ACOSTADA)
    // =========================================================================
    masterMesh.updateMatrixWorld(true);
    const W0_master = masterMesh.matrixWorld.clone();
    const W0_master_inv = W0_master.clone().invert();

    const matricesRelativas = new Map<THREE.Mesh, THREE.Matrix4>();
    mallas.forEach((m) => {
      if (m !== masterMesh) {
        m.updateMatrixWorld(true);
        const W0_hijo = m.matrixWorld.clone();
        const T_rel = W0_master_inv.clone().multiply(W0_hijo);
        matricesRelativas.set(m, T_rel);
      }
    });

    // Si hay rotación en el plano horizontal (±90°, 180°) o desplazamiento joystick 2D
    if (rotPlano !== 0 || offsetX !== 0 || offsetZ !== 0) {
      const boxPiso = new THREE.Box3().setFromObject(masterMesh);
      const centroPiso = new THREE.Vector3();
      boxPiso.getCenter(centroPiso);

      const mToCentro = new THREE.Matrix4().makeTranslation(-centroPiso.x, -centroPiso.y, -centroPiso.z);
      const mRotPiso = new THREE.Matrix4();
      if (rotPlano !== 0) {
        mRotPiso.makeRotationY(THREE.MathUtils.degToRad(rotPlano));
      }
      const mFromCentro = new THREE.Matrix4().makeTranslation(centroPiso.x + offsetX, centroPiso.y, centroPiso.z + offsetZ);
      const mGiro = new THREE.Matrix4().multiply(mFromCentro).multiply(mRotPiso).multiply(mToCentro);

      // 1. Transformar Pieza Máster
      const W1_master = mGiro.clone().multiply(W0_master);
      W1_master.decompose(masterMesh.position, masterMesh.quaternion, masterMesh.scale);
      masterMesh.updateMatrix();
      masterMesh.updateMatrixWorld(true);

      // 2. Transformar solidariamente cada corredera / herraje: W1_hijo = W1_master * T_rel
      mallas.forEach((m) => {
        if (m !== masterMesh) {
          const T_rel = matricesRelativas.get(m);
          if (T_rel) {
            const W1_hijo = W1_master.clone().multiply(T_rel);
            W1_hijo.decompose(m.position, m.quaternion, m.scale);
            m.updateMatrix();
            m.updateMatrixWorld(true);
          }
        }
      });
    }

    // 🛡️ CORRECCIÓN MATEMÁTICA DEFINITIVA DE PISO (Y = 0.0000):
    // Garantiza que la superficie inferior de la Pieza Máster (su cara con cota Y más baja)
    // quede EXACTAMENTE en el plano del piso Y = 0.0000 (sin valores negativos),
    // elevando o descendiendo solidariamente a todo el conjunto (máster, correderas y herrajes).
    if (apoyoEnPiso && masterMesh) {
      masterMesh.updateMatrixWorld(true);
      const boxReal = new THREE.Box3().setFromObject(masterMesh);
      const deltaYReal = -boxReal.min.y;
      if (Math.abs(deltaYReal) > 0.0001) {
        mallas.forEach((m) => {
          m.position.y += deltaYReal;
          m.updateMatrix();
          m.updateMatrixWorld(true);
        });
      }
    }

    // Persistir estado de banco final en todas las mallas del subbloque
    mallas.forEach((m) => {
      m.userData.__baseRestPosition = m.position.clone();
      m.userData.__baseRestQuaternion = m.quaternion.clone();
      m.userData.__bancoPosition = m.position.clone();
      m.userData.__bancoQuaternion = m.quaternion.clone();
    });
  });
}

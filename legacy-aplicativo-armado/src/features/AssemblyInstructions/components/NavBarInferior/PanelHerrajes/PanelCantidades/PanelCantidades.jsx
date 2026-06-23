import useEnviroment from "../../../../hooks/useEnviroment";
import { useEffect, useState } from "react";
import "./PanelCantidades.css";
import * as THREE from "three";
import { getAssetPath, resolveAlias } from "../../../../../../lib/assets.js";

export default function PanelCantidades({ id, data }) {
  const pasoInicial = useEnviroment((state) => state.pasoInicial);
  const PanelCantidadesState = useEnviroment((state) => state.PanelCantidades);
  const idioma = useEnviroment((state) => state.idioma);

  const texts = {
    es: {
      title: "Cantidades Totales de Herrajes",
    },
    en: {
      title: "Total Hardware Quantities",
    }
  };
  const t = idioma === "en" ? texts.en : texts.es;

  const [cantidades, setCantidades] = useState([]);

  // Resuelve la imagen del herraje a través del proxy de Vite.
  const getHerrajeImageUrl = (keyName) => {
    if (data?.isDynamicCMS && Array.isArray(data?.fotosHerrajesList)) {
      const keyLower = keyName.toLowerCase();
      const matchedFile = data.fotosHerrajesList.find(file => {
        const cleanFile = file.startsWith('_shared:') ? file.replace('_shared:', '') : file;
        const baseName = cleanFile.substring(0, cleanFile.lastIndexOf('.')) || cleanFile;
        return baseName.toLowerCase() === keyLower;
      });

      if (matchedFile) {
        if (matchedFile.startsWith('_shared:')) {
          const realName = matchedFile.replace('_shared:', '');
          return getAssetPath(`/assets/herrajes_compartidos/${realName}`);
        }
        return getAssetPath(`/${id}/herrajes/${matchedFile}`);
      }
    }
    return null;
  };

  // Replica exacta de la función del modal para limpiar nombres de mallas 3D.
  // Garantiza que el nombre mostrado sea IDÉNTICO al del despiece en la plataforma.
  const limpiarNombreMalla = (rawName) => {
    if (!rawName) return "";
    
    // 1. Obtener la primera sección (antes de cualquier "-") y limpiar
    let name = rawName.split("-")[0].trim();
    name = name.split(".")[0];
    
    // 2. Regla inteligente del guion bajo
    const parts2 = name.split("_");
    const resultParts = [];
    let codeCount = 0;
    
    for (let i = 0; i < parts2.length; i++) {
      const part = parts2[i];
      const isPureText = !/\d/.test(part);
      
      if (isPureText) {
        resultParts.push(part);
      } else {
        if (codeCount === 0) {
          if (/^\d+$/.test(part)) {
            const num = parseInt(part, 10);
            const isInstance = num < 100 || (part.length === 4 && part.substring(1, 3) === "00");
            if (isInstance) {
              continue;
            }
          }
          resultParts.push(part);
          codeCount++;
        } else {
          break;
        }
      }
    }
    name = resultParts.join("_");

    // 3. Limpieza de sufijos comunes de materiales (ej. Cubierta_balance -> Cubierta)
    // Se ejecuta ANTES que la curación de Blender para que no tape los dígitos finales
    const sufijosMat = ["_BALANCE", "_TAPA", "_CANTO", "_LAMINADO", " BALANCE", " TAPA", " CANTO", " LAMINADO"];
    let upperName = name.toUpperCase();
    for (const suf of sufijosMat) {
      if (upperName.endsWith(suf)) {
        name = name.substring(0, name.length - suf.length);
        upperName = name.toUpperCase();
      }
    }

    // 4. Curación definitiva de sufijos de Blender (ej. "Bisagra_20040001" → "Bisagra_20040")
    name = name.replace(/[._]?0\d\d$/i, "");
    name = name.replace(/_$/, "");
    
    // Regla de blindaje adicional contra códigos de inventario concatenados con números de copia
    // Caso 1: Código de 5 dígitos de herraje (ej. 20020) + 3 dígitos de copia (ej. 006) = 8 dígitos (ej. 20020006)
    name = name.replace(/_(200\d{2})\d{3}$/i, "_$1");
    // Caso 2: Código de 7 dígitos (ej. 0002715) + 3 dígitos de copia (ej. 003) = 10 dígitos (ej. 0002715003)
    name = name.replace(/_(000\d{4})\d{3}$/i, "_$1");
    
    // 5. Regla específica para PERNO_ con espacio
    if (name.toUpperCase().startsWith("PERNO_") && name.includes(" ")) {
      name = name.split(" ")[0];
    }
    
    return resolveAlias(name);
  };

  // Detecta si un nombre limpio corresponde a un herraje usando palabras clave
  const esHerrajeConocido = (nombreLimpio) => {
    if (!nombreLimpio) return false;
    const lower = nombreLimpio.toLowerCase();
    if (lower.startsWith("tapaluz") || lower.includes("fondo") || lower.includes("posterior")) return false;
    if (lower.startsWith("caja") || lower.startsWith("puntilla")) return true;
    if (/^\d+$/.test(nombreLimpio)) return true;
    return /tornillo|perno|tarugo|bisagra|deslizador|corredera|soporte|clavo|tapa|minifix|cama|perfil|regula|patin|pivote|tuerca|arandela|jaladera|tirador|pija|angulo|union|mensula|mariposa/i.test(nombreLimpio);
  };

  // Recolectar la información del panel de cantidades del glb P00 o directamente del despiece del modal
  useEffect(() => {
    try {
      // Fuente primaria: Despiece configurado en el modal (nombres EXACTOS del modal)
      if (data?.despiece && Array.isArray(data.despiece) && data.despiece.some(d => d.esHerraje)) {
        const tempCantidades = [];
        const nombresVistos = new Set();
        
        data.despiece
          .filter(d => d.esHerraje && d.nombre)
          .forEach(d => {
            const cleanName = d.nombre.split("-")[0].trim();
            if (!nombresVistos.has(cleanName)) {
              nombresVistos.add(cleanName);
              tempCantidades.push({
                displayName: cleanName,
                value: cleanName,
                cantidad: String(d.cantidad || 0),
                imageUrl: getHerrajeImageUrl(cleanName)
              });
            }
          });
          
        setCantidades(tempCantidades);
        return;
      }

      // Fallback: Recorrido del GLB inicial (P00.glb) con limpiarNombreMalla
      if (!pasoInicial || Object.keys(pasoInicial).length === 0 || !pasoInicial.traverse) {
        setCantidades([]);
        return;
      }

      // Detectar escala global del modelo (metros vs milímetros)
      const sceneBBox = new THREE.Box3().setFromObject(pasoInicial);
      const sceneSize = new THREE.Vector3();
      sceneBBox.getSize(sceneSize);
      const maxSceneDim = Math.max(sceneSize.x, sceneSize.y, sceneSize.z);
      const mult = maxSceneDim > 0 && maxSceneDim < 20 ? 1000 : 1;

      const counts = {};
      const nombresUnicos = new Set();
      const tempCantidades = [];
      const herrajesFisicosRegistrados = [];

      pasoInicial.traverse((child) => {
        try {
          if (child.type !== 'Mesh' && !child.isMesh) return;
          const rawName = child.name || "";

          if (
            rawName.includes("Scene") ||
            rawName.includes("Capa") ||
            rawName.includes("Camera") ||
            rawName.includes("Texto") ||
            rawName.includes("Pieza") ||
            rawName.includes("Collection") ||
            rawName.includes("Plane") ||
            rawName.includes("Text")
          ) {
            return;
          }

          // Resolvamos el nombre del herraje priorizando el parent y geometry, igual que en el modal
          let parentName = "";
          if (child.parent && child.parent.type !== 'Scene' && child.parent.name) {
            parentName = child.parent.name;
          }

          let nameToClean = rawName;
          if (parentName && !parentName.toUpperCase().startsWith("PIEZA") && parentName.toLowerCase() !== "scene") {
            nameToClean = parentName;
          } else if (child.geometry && child.geometry.name) {
            nameToClean = child.geometry.name;
          } else if (rawName.includes("_")) {
            const parts = rawName.split("_");
            if (parts[0].toLowerCase().startsWith("pieza")) {
              nameToClean = parts.slice(1).join("_");
            }
          }

          // Aplicar la misma limpieza que el modal
          let cleanName = limpiarNombreMalla(nameToClean);
          if (!cleanName || !esHerrajeConocido(cleanName)) return;

          // BLINDAJE DINÁMICO CONTRA DUPLICADOS USANDO EL DESPIECE OFICIAL (data.despiece)
          if (cleanName && data?.despiece) {
            const herrajesOficiales = data.despiece
              .filter(item => item.esHerraje)
              .map(item => item.nombre);
            
            if (herrajesOficiales.length > 0 && !herrajesOficiales.includes(cleanName)) {
              const coincidencia = herrajesOficiales.find(oficial => {
                if (cleanName.startsWith(oficial)) {
                  const resto = cleanName.substring(oficial.length);
                  return /^[._]?\d+$/.test(resto);
                }
                return false;
              });
              if (coincidencia) {
                cleanName = coincidencia;
              }
            }
          }

          // Unificación espacial y de superposición idéntica a la plataforma
          let registrarInstancia = true;
          const lowerLimpio = cleanName.toLowerCase();
          const esHerrajeComplejo = /bisagra|corredera/i.test(lowerLimpio);

          const box = new THREE.Box3().setFromObject(child);
          const center = new THREE.Vector3();
          box.getCenter(center);

          if (esHerrajeComplejo) {
            const herrajeCercano = herrajesFisicosRegistrados.find(h => {
              if (h.nombreLimpio !== cleanName) return false;
              const dist = center.distanceTo(h.center) * mult;
              return dist < 100; // 100 mm
            });
            if (herrajeCercano) {
              registrarInstancia = false;
            } else {
              herrajesFisicosRegistrados.push({ nombreLimpio: cleanName, center, uuid: child.uuid });
            }
          } else {
            const herrajeDuplicado = herrajesFisicosRegistrados.find(h => {
              if (h.nombreLimpio !== cleanName) return false;
              const dist = center.distanceTo(h.center) * mult;
              return dist < 2; // 2 mm
            });
            if (herrajeDuplicado) {
              registrarInstancia = false;
            } else {
              herrajesFisicosRegistrados.push({ nombreLimpio: cleanName, center, uuid: child.uuid });
            }
          }

          if (!registrarInstancia) return;

          counts[cleanName] = (counts[cleanName] || 0) + 1;
          nombresUnicos.add(cleanName);
        } catch (childErr) {
          console.error("Error procesando nodo de herraje:", childErr);
        }
      });

      nombresUnicos.forEach((cleanName) => {
        let cantidadFinalNum = counts[cleanName] || 0;
        
        // Aplicar división por 2 para Bisagras y Correderas (instrucción del usuario)
        const lowerLimpio = cleanName.toLowerCase();
        if (lowerLimpio.startsWith("bisagra") || lowerLimpio.startsWith("corredera")) {
          cantidadFinalNum = Math.round(cantidadFinalNum / 2);
        }

        tempCantidades.push({
          displayName: cleanName,
          value: cleanName,
          cantidad: String(cantidadFinalNum),
          imageUrl: getHerrajeImageUrl(cleanName)
        });
      });

      setCantidades(tempCantidades);
    } catch (err) {
      console.error("Error crítico recopilando cantidades:", err);
    }
  }, [pasoInicial, data, id]);

  return (
    <>
      <aside className={`panel3 ${PanelCantidadesState ? "is-active" : ""}`}>
        <nav className="menu3">
          <h2 className="menu-title">{t.title}</h2>
          {cantidades.map((item) => (
            <div key={item.value} className="option3">
              <div>
                <p className="cantidad">{item.displayName}</p>
                <div
                  className="imagen"
                  style={{
                    backgroundImage: `url(${item.imageUrl})`
                  }}
                ></div>
              </div>
              <p className="cantidad">{item.cantidad ? item.cantidad.replace(/Cantidad\((\d+)\)/i, "$1").replace(/[()]/g, "").trim() : ""}</p>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

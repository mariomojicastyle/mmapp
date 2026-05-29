import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AssemblyViewer from '../features/AssemblyInstructions/AssemblyViewer';
import { supabase } from '../lib/supabase';

const AssemblyPage = () => {
  const { id } = useParams();
  const [productData, setProductData] = useState(null);
  const [productId, setProductId] = useState(id);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        // 1. Intentar cargar desde la base de datos de Supabase primero
        const { data: configData, error: configError } = await supabase
          .from("configuraciones_manual")
          .select("*, proyectos!inner(nombre, codigo_manual, progreso, estado)")
          .eq("proyectos.codigo_manual", id)
          .maybeSingle();

        if (configError) throw configError;

        if (configData) {
          console.log("Cargando manual dinámico desde Supabase:", configData);
          
          // Construir las URLs públicas para los insumos en el Storage
          const getStorageUrl = (path) => {
            if (!path) return "";
            if (path.startsWith("http")) return path;
            const projectUrl = import.meta.env.VITE_SUPABASE_URL;
            // Asegurar que el path incluya el id del manual como prefijo de subcarpeta
            const fullPath = path.startsWith(id + "/") ? path : `${id}/${path}`;
            return `${projectUrl}/storage/v1/object/public/insumos_manuales/${fullPath}`;
          };

          const steps = (configData.glb_pasos || []).map(g => g.step);
          if (steps.length === 0) steps.push("00");

          // Inyectar colores de identidad gráfica en las variables CSS
          const primario = configData.color_primario || "#0D9488";
          const secundario = configData.color_secundario || "#111827";
          const colorTextoBtn = configData.color_texto_botones || "#ffffff";
          const opacidad = configData.opacidad_manual !== undefined && configData.opacidad_manual !== null ? configData.opacidad_manual : 100;

          document.documentElement.style.setProperty('--primary', primario);
          document.documentElement.style.setProperty('--secondary', secundario);
          document.documentElement.style.setProperty('--btn-text-color', colorTextoBtn);

          if (opacidad < 100) {
            // Aplicar opacidad dinámica usando color-mix
            document.documentElement.style.setProperty('--surface', `color-mix(in srgb, ${primario} ${opacidad}%, transparent)`);
            document.documentElement.style.setProperty('--surface-opaque', `color-mix(in srgb, ${secundario} ${opacidad}%, transparent)`);
            document.documentElement.style.setProperty('--surface-container', `color-mix(in srgb, ${primario} ${opacidad}%, transparent)`);
            
            // El estado activo/hover será ligeramente más opaco para dar retroalimentación visual (ej: +15%)
            const opacidadActiva = Math.min(100, opacidad + 15);
            document.documentElement.style.setProperty('--surface-active', `color-mix(in srgb, ${primario} ${opacidadActiva}%, transparent)`);
            
            // Clase de indicador para otros componentes de CSS
            document.documentElement.classList.add('glass-mode');
          } else {
            // Sólido tradicional
            document.documentElement.style.setProperty('--surface', primario);
            document.documentElement.style.setProperty('--surface-opaque', primario);
            document.documentElement.style.setProperty('--surface-container', primario);
            document.documentElement.style.setProperty('--surface-active', `color-mix(in srgb, ${primario} 90%, black)`);
            
            document.documentElement.classList.remove('glass-mode');
          }

          // Cargar e Inyectar fuentes y tamaños dinámicos
          const fTitle = configData.font_title || "Inter";
          const fTitleSize = configData.font_title_size || "1.5rem";
          const fTitleColor = configData.font_title_color || "#FFFFFF";
          const fBody = configData.font_body || "Inter";
          const fBodySize = configData.font_body_size || "0.9rem";
          const fBodyColor = configData.font_body_color || "#BEC8CE";

          // Cargar Google Font dinámicamente si no es la por defecto
          const loadGoogleFont = (fontName) => {
            if (!fontName || fontName === "Inter") return;
            const linkId = `gfont-${fontName.toLowerCase()}`;
            if (!document.getElementById(linkId)) {
              const link = document.createElement('link');
              link.id = linkId;
              link.rel = 'stylesheet';
              link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700;800&display=swap`;
              document.head.appendChild(link);
            }
          };

          loadGoogleFont(fTitle);
          loadGoogleFont(fBody);

          document.documentElement.style.setProperty('--font-title', `'${fTitle}', sans-serif`);
          document.documentElement.style.setProperty('--font-title-size', fTitleSize);
          document.documentElement.style.setProperty('--font-title-color', fTitleColor);
          
          document.documentElement.style.setProperty('--font-sans', `'${fBody}', sans-serif`);
          document.documentElement.style.setProperty('--font-body-size', fBodySize);
          document.documentElement.style.setProperty('--font-body-color', fBodyColor);

          const dynamicProductData = {
            url: `/${id}`,
            name: configData.proyectos?.nombre || `Manual ${id}`,
            pasos: steps,
            isDynamicCMS: true,
            colorPrimario: primario,
            colorSecundario: secundario,
            logo: configData.logo_url ? `url('${getStorageUrl(configData.logo_url)}')` : "url('/assets/Logo_mm.svg')",
            favicon: configData.favicon_url ? getStorageUrl(configData.favicon_url) : "/favicon.png",
            
            // Insumos del CMS para resolución dinámica
            imagenHerramientas: configData.imagen_herramientas,
            garantiaDoc: configData.garantia_texto,
            ensamblesList: configData.imagenes_ensambles || [],
            fotosHerrajesList: configData.fotos_herrajes || [],

            // Texturas PBR del Escenario y Piso
            pbrFloorDiff: configData.pbr_floor_diff ? getStorageUrl(configData.pbr_floor_diff) : "",
            pbrFloorNormal: configData.pbr_floor_normal ? getStorageUrl(configData.pbr_floor_normal) : "",
            pbrFloorRoughness: configData.pbr_floor_roughness ? getStorageUrl(configData.pbr_floor_roughness) : "",
            pbrFloorHeight: configData.pbr_floor_height ? getStorageUrl(configData.pbr_floor_height) : "",
            pbrWallDiff: configData.pbr_wall_diff ? getStorageUrl(configData.pbr_wall_diff) : "",
            pbrWallNormal: configData.pbr_wall_normal ? getStorageUrl(configData.pbr_wall_normal) : "",
            pbrWallRoughness: configData.pbr_wall_roughness ? getStorageUrl(configData.pbr_wall_roughness) : "",
            pbrWallHeight: configData.pbr_wall_height ? getStorageUrl(configData.pbr_wall_height) : "",

            // Alturas y posiciones dinámicas (leídas desde el JSON del CMS en Supabase) o por defecto
            alturas: (configData.glb_pasos || []).map(g => ({
              paso: g.step,
              skyBox: g.skyBox !== undefined ? g.skyBox : 0.894,
              plane: g.plane !== undefined ? g.plane : -0.606,
              target: g.cameraTarget ? [g.cameraTarget[0], g.cameraTarget[1], g.cameraTarget[2]] : [0.12, -0.219, 0.085]
            })),
            cameraPositions: (configData.glb_pasos || []).map(g => {
              let pos = { x: -3.177, y: 2, z: 5 };
              if (g.cameraPosition) {
                if (Array.isArray(g.cameraPosition)) {
                  pos = { x: g.cameraPosition[0], y: g.cameraPosition[1], z: g.cameraPosition[2] };
                } else if (typeof g.cameraPosition === 'object') {
                  pos = { 
                    x: g.cameraPosition.x !== undefined ? g.cameraPosition.x : -3.177, 
                    y: g.cameraPosition.y !== undefined ? g.cameraPosition.y : 2, 
                    z: g.cameraPosition.z !== undefined ? g.cameraPosition.z : 5 
                  };
                }
              }
              return {
                pasos: g.step,
                override: true,
                position: pos
              };
            }),
            
            // Configuración de los tips interactivos
            tips: {
              "Logo": !!configData.logo_url,
              "2 Herramientas Necesarias": !!configData.imagen_herramientas,
              "3 Herramientas Necesarias": false,
              "Sistema de Anclaje": (configData.imagenes_ensambles || []).some(e => e.toLowerCase().includes("anclaje")),
              "Pulsador para Abrir": (configData.imagenes_ensambles || []).some(e => e.toLowerCase().includes("pulsador")),
              "Ensamble Minifix": (configData.imagenes_ensambles || []).some(e => e.toLowerCase().includes("minifix")),
              "Ensamble Tuerca Plástica": (configData.imagenes_ensambles || []).some(e => e.toLowerCase().includes("tuerca")),
              "Ajuste de Bisagras": (configData.imagenes_ensambles || []).some(e => e.toLowerCase().includes("bisagra")),
              "Oculta Tornillos": (configData.imagenes_ensambles || []).some(e => e.toLowerCase().includes("oculta")),
              "Garantia del Producto": !!configData.garantia_texto
            }
          };

          // Actualizar dinámicamente el favicon de la pestaña si se subió uno personalizado
          if (configData.favicon_url) {
            const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = getStorageUrl(configData.favicon_url);
            document.getElementsByTagName('head')[0].appendChild(link);
          }

          setProductData(dynamicProductData);
          setProductId(id); // Para que los recursos se carguen usando el proxy dinámico
          setLoading(false);
          return;
        }

        // 2. Si no está en Supabase, intentar cargar archivo local public/[id]/data.json (Retrocompatibilidad)
        const response = await fetch(`/${id}/data.json`);
        if (!response.ok) throw new Error(`No se encontró data.json para ${id}`);
        const data = await response.json();
        setProductData(data);
        setProductId(id);
      } catch (error) {
        console.warn(`Código ${id} no encontrado en base de datos ni localmente. Cargando plantilla de Manual Vacío...`, error);
        
        try {
          // Fallback a manual-vacio
          const fallbackResponse = await fetch(`/manual-vacio/data.json`);
          if (!fallbackResponse.ok) throw new Error("No se pudo cargar la plantilla de Manual Vacío");
          const fallbackData = await fallbackResponse.json();
          fallbackData.name = `Manual Vacío - ${id}`;
          setProductData(fallbackData);
          setProductId("manual-vacio");
        } catch (fbError) {
          console.error("Error crítico cargando plantilla fallback:", fbError);
        }
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  if (loading) return <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white font-semibold">Cargando manual dinámico...</div>;
  
  if (!productData) return <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">Manual no encontrado</div>;

  return (
    <div className="w-screen h-screen bg-gray-900 overflow-hidden relative">
      <AssemblyViewer 
        productData={productData}
        steps={productData.pasos} 
        id={productId}
      />
    </div>
  );
};

export default AssemblyPage;
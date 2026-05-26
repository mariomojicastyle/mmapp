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
            return `${projectUrl}/storage/v1/object/public/insumos_manuales/${path}`;
          };

          const steps = (configData.glb_pasos || []).map(g => g.step);
          if (steps.length === 0) steps.push("00");

          // Inyectar colores de identidad gráfica en las variables CSS
          const primario = configData.color_primario || "#0D9488";
          const secundario = configData.color_secundario || "#111827";
          const colorTextoBtn = configData.color_texto_botones || "#ffffff";
          document.documentElement.style.setProperty('--primary', primario);
          document.documentElement.style.setProperty('--secondary', secundario);
          document.documentElement.style.setProperty('--surface', primario);
          document.documentElement.style.setProperty('--surface-opaque', primario);
          document.documentElement.style.setProperty('--surface-container', primario);
          document.documentElement.style.setProperty('--btn-text-color', colorTextoBtn);

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

            // Alturas y posiciones por defecto
            alturas: (configData.glb_pasos || []).map(g => ({
              paso: g.step,
              skyBox: 0.894,
              plane: -0.606,
              target: [0.12, -0.219, 0.085]
            })),
            cameraPositions: (configData.glb_pasos || []).map(g => ({
              pasos: g.step,
              override: true,
              position: { x: -3.177, y: 2, z: 5 }
            })),
            
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
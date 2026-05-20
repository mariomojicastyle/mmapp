import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AssemblyViewer from '../features/AssemblyInstructions/AssemblyViewer';

const AssemblyPage = () => {
  const { id } = useParams();
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        // Carga local: data.json desde la carpeta del producto en /public
        const response = await fetch(`/${id}/data.json`);
        if (!response.ok) throw new Error(`No se encontró data.json para ${id}`);
        const data = await response.json();
        setProductData(data);
      } catch (error) {
        console.error("Error cargando producto:", error);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  if (loading) return <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">Cargando...</div>;
  
  if (!productData) return <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">Producto no encontrado</div>;

  return (
    <div className="w-screen h-screen bg-gray-900 overflow-hidden relative">
      <AssemblyViewer 
        productData={productData}
        steps={productData.pasos} 
        id={id}
      />
    </div>
  );
};

export default AssemblyPage;
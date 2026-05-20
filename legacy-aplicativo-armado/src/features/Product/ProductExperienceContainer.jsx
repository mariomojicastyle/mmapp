import React, { useState } from 'react';
import AssemblyViewer from '../AssemblyInstructions/AssemblyViewer';
import { Box, FileText, Info } from 'lucide-react';

export default function ProductExperienceContainer({ product }) {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'details'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Info className="w-4 h-4" />
          Detalles del Producto
        </button>
        <button
          onClick={() => setActiveTab('assembly')}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'assembly'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Box className="w-4 h-4" />
          Instructivo de Armado 3D
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'details' && (
          <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
            <p className="text-sm text-gray-500 font-mono mb-6">SKU: {product.sku}</p>
            
            <div className="prose prose-blue max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Descripción</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description || 'Sin descripción disponible.'}
              </p>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Especificaciones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm text-gray-500">Precio</span>
                  <span className="block text-lg font-medium text-gray-900">${product.price}</span>
                </div>
                {/* Add more specs here if available in the future */}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assembly' && (
          <div className="w-full h-full bg-gray-100">
             {/* Pass the dynamic data to the AssemblyViewer */}
            <AssemblyViewer 
              modelUrl={product.assembly_file_url} 
              steps={product.assembly_steps} 
              id={product.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}

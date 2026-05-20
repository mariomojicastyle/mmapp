import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { Upload, X, FileText, Box, Save } from 'lucide-react';

export default function ProductForm({ product = null, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: product || {
      title: '',
      sku: '',
      price: '',
      description: '',
      assembly_steps: JSON.stringify([], null, 2),
    }
  });

  const [files, setFiles] = useState({
    glb_file: null,
    assembly_file: null,
  });

  const onSubmit = async (data) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      let glb_file_url = product?.glb_file_url;
      let assembly_file_url = product?.assembly_file_url;

      // Helper to upload file
      const uploadFile = async (file, folder) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-assets')
          .getPublicUrl(filePath);

        return publicUrl;
      };

      if (files.glb_file) {
        glb_file_url = await uploadFile(files.glb_file, 'models');
      }

      if (files.assembly_file) {
        assembly_file_url = await uploadFile(files.assembly_file, 'assembly');
      }

      const productData = {
        user_id: user.id,
        title: data.title,
        sku: data.sku,
        price: parseFloat(data.price),
        description: data.description,
        assembly_steps: JSON.parse(data.assembly_steps || '[]'),
        glb_file_url,
        assembly_file_url,
      };

      let error;
      if (product?.id) {
        // Update
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        error = updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);
        error = insertError;
      }

      if (error) throw error;

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e, type) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [type]: e.target.files[0] }));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl bg-white p-8 rounded-xl shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g. Modern Chair"
            />
            {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                {...register('sku', { required: 'SKU is required' })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="PROD-001"
              />
              {errors.sku && <span className="text-red-500 text-xs">{errors.sku.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                {...register('price', { required: 'Price is required' })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Product description..."
            />
          </div>
        </div>

        {/* Assets */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Assets & Configuration</h3>

          <div className="p-4 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Box className="w-4 h-4" />
              3D Model (GLB) - View Only
            </label>
            <input
              type="file"
              accept=".glb"
              onChange={(e) => handleFileChange(e, 'glb_file')}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {product?.glb_file_url && !files.glb_file && (
              <p className="mt-1 text-xs text-green-600 truncate">Current: {product.glb_file_url.split('/').pop()}</p>
            )}
          </div>

          <div className="p-4 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Box className="w-4 h-4" />
              Assembly Model (Parts GLB)
            </label>
            <input
              type="file"
              accept=".glb"
              onChange={(e) => handleFileChange(e, 'assembly_file')}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
             {product?.assembly_file_url && !files.assembly_file && (
              <p className="mt-1 text-xs text-green-600 truncate">Current: {product.assembly_file_url.split('/').pop()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Assembly Steps (JSON)
            </label>
            <textarea
              {...register('assembly_steps')}
              rows={8}
              className="w-full px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              placeholder="[\n  {\n    'step': 1,\n    'instruction': 'Assemble base'\n  }\n]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button
          type="submit"
          disabled={uploading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          {uploading ? (
            <>
              <Upload className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Product
            </>
          )}
        </button>
      </div>
    </form>
  );
}

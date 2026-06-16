"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw, Box, Zap, Maximize2, X, ArrowLeftRight } from "lucide-react";

const PRODUCT_360_URL = "https://ikdorsjntqnnxrpgvwrl.supabase.co/storage/v1/object/public/public-assets/kiosco-360/";
const PRODUCT_3B_URL = "https://ikdorsjntqnnxrpgvwrl.supabase.co/storage/v1/object/public/public-assets/kiosco-3d/P00.glb";

export default function GondolaViewer() {
  const [mode, setMode] = useState<"360" | "3d">("360");
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const dragStartX = useRef(0);
  const totalFrames = 36; // Estimated frames for 360

  // 360 Rotation Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== "360") return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    setShowHint(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || mode !== "360") return;
    const deltaX = e.clientX - dragStartX.current;
    if (Math.abs(deltaX) > 10) {
      const direction = deltaX > 0 ? -1 : 1;
      setCurrentFrame((prev) => {
        let next = prev + direction;
        if (next > totalFrames) next = 1;
        if (next < 1) next = totalFrames;
        return next;
      });
      dragStartX.current = e.clientX;
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="relative w-full h-full bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden group">
      
      {/* 360 Image Sequence */}
      <AnimatePresence mode="wait">
        {mode === "360" ? (
          <motion.div 
            key="360"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img 
              src={`${PRODUCT_360_URL}${currentFrame.toString().padStart(2, "0")}.webp`}
              alt="Producto 360"
              className="max-w-[80%] max-h-[80%] object-contain pointer-events-none"
            />
            
            {showHint && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-3 rounded-2xl">
                  <ArrowLeftRight className="w-5 h-5 text-white animate-bounce" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">Arrastra para girar</span>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="3d"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            {/* @ts-ignore */}
            <model-viewer
              src={PRODUCT_3B_URL}
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              auto-rotate
              shadow-intensity="1"
              style={{ width: "100%", height: "100%" }}
            >
              {/* @ts-ignore */}
            </model-viewer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-xl p-1.5 rounded-full border border-zinc-700">
        <button 
          onClick={() => setMode("360")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${mode === "360" ? "bg-white text-black" : "text-white hover:bg-zinc-800"}`}
        >
          <RotateCw className="w-4 h-4" />
          360º
        </button>
        <button 
          onClick={() => setMode("3d")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${mode === "3d" ? "bg-white text-black" : "text-white hover:bg-zinc-800"}`}
        >
          <Box className="w-4 h-4" />
          MODO 3D
        </button>
      </div>

      {/* AR Button */}
      <div className="absolute top-6 right-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-xs font-bold shadow-2xl hover:bg-zinc-200 transition-colors">
          <Zap className="w-4 h-4 text-black fill-yellow-400" />
          VER EN AR
        </button>
      </div>

    </div>
  );
}

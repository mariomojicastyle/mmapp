"use client";

import React, { useRef, useState, useEffect } from "react";

export default function DemoClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      const iframe = containerRef.current?.querySelector("iframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "FULLSCREEN_CHANGE", isFullscreen: isFull }, "*");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === "MM_MANUAL_INICIAR") {
          if (containerRef.current && !document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch((err) => {
              console.error("Error attempting to enable fullscreen:", err);
            });
          }
        } else if (event.data.type === "MM_MANUAL_MINIMIZAR") {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch((err) => {
              console.error("Error exiting fullscreen:", err);
            });
          }
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <main
      ref={containerRef}
      className="w-full h-[100dvh] m-0 p-0 overflow-hidden bg-black flex flex-col relative"
    >
      <iframe
        src="/embed/armado/M00001?cameraOverlay=off&lightingEditor=off"
        className="w-full h-full flex-1 border-none"
        allow="xr-spatial-tracking; fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Demo Interactiva"
      />
    </main>
  );
}

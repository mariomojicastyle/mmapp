import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo Interactiva | Mario Mojica",
  description: "Explora la demo de nuestro manual de armado 3D interactivo para fabricantes de muebles RTA.",
};

export default function DemoPage() {
  return (
    <main className="w-full h-screen m-0 p-0 overflow-hidden bg-black flex flex-col">
      {/* 
        This iframe loads the 3D viewer directly from the /embed/ path without exposing 
        all the query parameters to the user's address bar. 
      */}
      <iframe
        src="/embed/armado/M00001?cameraOverlay=off&lightingEditor=off"
        className="w-full flex-1 border-none"
        allow="fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Demo Interactiva"
      />
    </main>
  );
}

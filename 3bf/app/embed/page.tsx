"use client";

import React, { useEffect } from "react";
import Viewer3D from "@/components/viewer/Viewer3D";
import { use3BFStore } from "@/lib/store";

export default function Embed3BF() {
  const { setParametro } = use3BFStore();

  useEffect(() => {
    // Listener de mensajes postMessage desde la plataforma receptora
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "3BF_SET_PARAM") {
        const { key, value } = event.data;
        if (key && value !== undefined) {
          setParametro(key, value);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-transparent">
      <Viewer3D />
    </main>
  );
}

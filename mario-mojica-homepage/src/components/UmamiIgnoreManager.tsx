"use client";

import { useEffect, useState } from "react";

export default function UmamiIgnoreManager() {
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const ignore = urlParams.get("ignore_me") || urlParams.get("no_track");
    const track = urlParams.get("track_me");

    if (ignore === "true" || ignore === "1") {
      localStorage.setItem("umami.disabled", "1");
      setNotification("🚫 Rastreo de Umami DESACTIVADO en este dispositivo.");
    } else if (track === "true" || track === "1") {
      localStorage.removeItem("umami.disabled");
      setNotification("✅ Rastreo de Umami ACTIVADO en este dispositivo.");
    }

    if (ignore || track) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!notification) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] bg-neutral-900 text-white border border-primary/50 shadow-2xl px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-3">
      <span>{notification}</span>
      <button
        onClick={() => setNotification(null)}
        className="ml-2 text-xs text-neutral-400 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}

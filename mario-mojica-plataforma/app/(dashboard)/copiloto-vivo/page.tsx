"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CopilotoDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/traductor-vivo/henn?rol=mario&lang=es");
  }, [router]);

  return (
    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
      Cargando Copiloto Bilingüe en Vivo...
    </div>
  );
}

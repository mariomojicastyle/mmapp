import { NextResponse } from "next/server";

export async function GET(req: Request) {
  let workerOk = false;
  let rhinoOk = false;
  let rhinoChildren = 0;
  let workerDetails: any = null;

  const host = req.headers.get("host") || "";
  const isLocalOrEngine = host.includes("engine.mariomojica.com") || host.includes("localhost") || host.includes("127.0.0.1");

  // Si estamos en Netlify (3bf.mariomojica.com), consultar primero el túnel de alta velocidad
  const workerUrls = isLocalOrEngine
    ? [
        process.env.NEXT_PUBLIC_3BF_WORKER_URL,
        "http://127.0.0.1:8005",
        "http://localhost:8005",
      ].filter(Boolean) as string[]
    : [
        "https://engine.mariomojica.com/api",
        "https://engine.mariomojica.com",
        process.env.NEXT_PUBLIC_3BF_WORKER_URL,
      ].filter(Boolean) as string[];

  // 1. Probar 3BF Python Worker o API Remota del Túnel
  for (const url of workerUrls) {
    try {
      const endpoint = url.endsWith("/health") ? url : `${url}/health`;
      const resWorker = await fetch(endpoint, {
        method: "GET",
        signal: AbortSignal.timeout(3500),
      });
      if (resWorker.ok) {
        workerDetails = await resWorker.json();
        workerOk = workerDetails?.status === "online" || workerDetails?.status === "ok" || workerDetails?.status === "degraded" || Boolean(workerDetails?.worker);
        if (workerDetails?.rhino_compute !== undefined) {
          rhinoOk = Boolean(workerDetails.rhino_compute);
          rhinoChildren = workerDetails.rhino_active_children || 0;
        } else if (workerDetails?.rhino_ok !== undefined) {
          rhinoOk = Boolean(workerDetails.rhino_ok);
          rhinoChildren = workerDetails.rhino_active_children || 0;
        }
        break;
      }
    } catch {
      workerOk = false;
    }
  }

  // 2. Probar RhinoCompute directo si el worker no lo reportó
  if (!rhinoOk) {
    try {
      const resRhino = await fetch("http://127.0.0.1:5000/activechildren", {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      if (resRhino.ok) {
        const text = await resRhino.text();
        rhinoChildren = parseInt(text.trim(), 10) || 0;
        rhinoOk = resRhino.status === 200;
      }
    } catch {
      rhinoOk = false;
    }
  }

  let status: "online" | "degraded" | "offline" = "offline";
  if (workerOk && rhinoOk) {
    status = "online";
  } else if (workerOk || rhinoOk) {
    status = "degraded";
  }

  return NextResponse.json({
    status,
    worker: workerOk,
    rhino_compute: rhinoOk,
    rhino_active_children: rhinoChildren,
    timestamp: Date.now(),
  }, {
    status: status === "offline" ? 503 : 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    }
  });
}

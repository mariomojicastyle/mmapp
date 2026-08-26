import { NextResponse } from "next/server";

export async function GET() {
  let workerOk = false;
  let rhinoOk = false;
  let rhinoChildren = 0;
  let workerDetails: any = null;

  const workerUrls = [
    process.env.NEXT_PUBLIC_3BF_WORKER_URL,
    "http://localhost:8005",
    "http://127.0.0.1:8005"
  ].filter(Boolean) as string[];

  // 1. Probar 3BF Python Worker
  for (const url of workerUrls) {
    try {
      const resWorker = await fetch(`${url}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(3500),
      });
      if (resWorker.ok) {
        workerDetails = await resWorker.json();
        workerOk = workerDetails?.status === "ok" || workerDetails?.status === "degraded";
        if (workerDetails?.rhino_ok !== undefined) {
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

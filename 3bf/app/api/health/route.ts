import { NextResponse } from "next/server";

export async function GET() {
  let workerOk = false;
  let rhinoOk = false;
  let rhinoChildren = 0;
  let workerDetails: any = null;

  // 1. Probar 3BF Python Worker (Puerto 8005)
  try {
    const resWorker = await fetch("http://127.0.0.1:8005/health", {
      method: "GET",
      signal: AbortSignal.timeout(2500),
    });
    if (resWorker.ok) {
      workerDetails = await resWorker.json();
      workerOk = workerDetails?.status === "ok" || workerDetails?.status === "degraded";
    }
  } catch {
    workerOk = false;
  }

  // 2. Probar RhinoCompute 8 (Puerto 5000)
  try {
    const resRhino = await fetch("http://127.0.0.1:5000/activechildren", {
      method: "GET",
      signal: AbortSignal.timeout(2500),
    });
    if (resRhino.ok) {
      const text = await resRhino.text();
      rhinoChildren = parseInt(text.trim(), 10) || 0;
      rhinoOk = resRhino.status === 200;
    }
  } catch {
    rhinoOk = false;
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

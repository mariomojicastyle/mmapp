import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const host = req.headers.get("host") || "";
    const isLocalOrEngine = host.includes("engine.mariomojica.com") || host.includes("localhost") || host.includes("127.0.0.1");

    const workerUrls = isLocalOrEngine
      ? [
          "http://127.0.0.1:8005",
          "http://localhost:8005",
          process.env.NEXT_PUBLIC_3BF_WORKER_URL,
        ].filter(Boolean) as string[]
      : [
          "https://engine.mariomojica.com/api/metadata",
          process.env.NEXT_PUBLIC_3BF_WORKER_URL,
          "http://127.0.0.1:8005",
        ].filter(Boolean) as string[];

    for (const url of workerUrls) {
      try {
        const endpoint = url.includes("/api/metadata") ? url : `${url}/metadata`;
        const workerRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        });

        if (workerRes.ok) {
          const data = await workerRes.json();
          return NextResponse.json(data, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
          });
        }
      } catch (err: any) {
        console.warn(`⚠️ Error conectando con 3BF Worker Metadata en ${url}:`, err?.message || err);
      }
    }

    return NextResponse.json({ status: "error", message: "No se pudo conectar con el worker" }, { status: 502 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

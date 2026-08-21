import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workerUrls = [
      process.env.NEXT_PUBLIC_3BF_WORKER_URL,
      "http://localhost:8005",
      "http://127.0.0.1:8005"
    ].filter(Boolean) as string[];

    for (const url of workerUrls) {
      try {
        const workerRes = await fetch(`${url}/mecanizar-intercomponentes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (workerRes.ok) {
          const data = await workerRes.json();
          return NextResponse.json(data);
        }
      } catch (err: any) {
        console.warn(`⚠️ Error conectando con 3BF Worker en ${url}/mecanizar-intercomponentes:`, err?.message || err);
      }
    }

    return NextResponse.json({
      status: "warning",
      total_perforaciones: 0,
      mecanizados_cruzados: {},
      resumen: ["Worker Python no disponible para el cálculo espacial."]
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
  }
}

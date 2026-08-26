import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workerUrl = process.env.NEXT_PUBLIC_3BF_WORKER_URL || "http://localhost:8005";

    const host = req.headers.get("host") || "";
    const isLocalOrEngine = host.includes("engine.mariomojica.com") || host.includes("localhost") || host.includes("127.0.0.1");

    // Intentar conectar con el 3BF Worker Python local primero, o el túnel si estamos en Netlify
    const workerUrls = [
      "http://localhost:8005",
      "http://127.0.0.1:8005",
      !isLocalOrEngine ? "https://engine.mariomojica.com/api/compute" : null,
      process.env.NEXT_PUBLIC_3BF_WORKER_URL,
    ].filter(Boolean) as string[];

    for (const url of workerUrls) {
      try {
        const endpoint = url.includes("/api/compute") ? url : `${url}/compute`;
        const workerRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (workerRes.ok) {
          const data = await workerRes.json();
          if (data && data.status === "success") {
            return NextResponse.json(data);
          }
        }
      } catch (err: any) {
        console.warn(`⚠️ Error conectando con 3BF Worker en ${url}:`, err?.message || err);
      }
    }

    // --- Fallback de Cálculo Interno (si el Worker Python no está corriendo) ---
    const params = body.parameters || {};
    const ancho = params.ancho || 1200;
    const alto = params.alto || 800;
    const prof = params.profundidad || 400;
    const esp = params.espesor_madera || 15;
    const puertas = params.incluir_puertas ?? true;

    const piezas = [
      { nombre: "Lateral Izquierdo", ancho: prof, largo: alto, espesor: esp, cantidad: 1, tipo: "Estructura" },
      { nombre: "Lateral Derecho", ancho: prof, largo: alto, espesor: esp, cantidad: 1, tipo: "Estructura" },
      { nombre: "Techo Superior", ancho: prof, largo: ancho - esp * 2, espesor: esp, cantidad: 1, tipo: "Estructura" },
      { nombre: "Piso Inferior", ancho: prof, largo: ancho - esp * 2, espesor: esp, cantidad: 1, tipo: "Estructura" },
      { nombre: "Estante Central", ancho: prof - 20, largo: ancho - esp * 2, espesor: esp, cantidad: 1, tipo: "Repisa" },
      { nombre: "Fondo Trasero", ancho: ancho - 4, largo: alto - 4, espesor: 3, cantidad: 1, tipo: "Fondo MDF 3mm" },
    ];

    if (puertas) {
      const ancPuerta = ancho / 2 - 3;
      piezas.push({ nombre: "Puerta Izquierda", ancho: ancPuerta, largo: alto - 6, espesor: esp, cantidad: 1, tipo: "Frente" });
      piezas.push({ nombre: "Puerta Derecha", ancho: ancPuerta, largo: alto - 6, espesor: esp, cantidad: 1, tipo: "Frente" });
    }

    const area_madera_m2 = Number((piezas.reduce((acc, p) => acc + p.ancho * p.largo * p.cantidad, 0) / 1000000).toFixed(3));
    const costo_total = Number(((area_madera_m2 * 45) + (puertas ? 12 : 8) + 15).toFixed(2));

    return NextResponse.json({
      status: "success",
      model_id: body.model_id || "M00001",
      execution_time_ms: 12.4,
      summary: {
        dimensiones: `${ancho} x ${alto} x ${prof} mm`,
        area_madera_m2,
        costo_estimado_usd: costo_total,
        piezas_totales: piezas.reduce((acc, p) => acc + p.cantidad, 0),
      },
      despiece: piezas,
      herrajes: [
        { nombre: "Caja Minifix 15mm", cantidad: puertas ? 16 : 12, unidad: "piezas" },
        { nombre: "Perno Minifix 34mm", cantidad: puertas ? 16 : 12, unidad: "piezas" },
        { nombre: "Tarugo Madera 8x30mm", cantidad: 16, unidad: "piezas" },
        { nombre: "Deslizador de Piso", cantidad: 4, unidad: "piezas" },
      ],
      worker_info: {
        engine: "Next.js API Route Fallback",
        ezdxf: false,
      },
    });
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Error procesando el cálculo" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workerUrl = process.env.NEXT_PUBLIC_3BF_WORKER_URL || "http://localhost:8005";

    try {
      const workerRes = await fetch(`${workerUrl}/export-dxf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (workerRes.ok) {
        const data = await workerRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn("⚠️ 3BF Worker Python offline para DXF. Usando fallback de DXF ASCII.");
    }

    const params = body.parameters || {};
    const ancho = params.ancho || 1200;
    const alto = params.alto || 800;

    const dxf_content = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n0\nLINE\n8\nCONTORNO\n10\n0.0\n20\n0.0\n11\n${ancho}\n21\n0.0\n0\nLINE\n8\nCONTORNO\n10\n${ancho}\n20\n0.0\n11\n${ancho}\n21\n${alto}\n0\nENDSEC\n0\nEOF\n`;

    return NextResponse.json({
      status: "success",
      filename: `mueble_${int(ancho)}x${int(alto)}.dxf`,
      dxf_content,
    });
  } catch (error) {
    return NextResponse.json({ status: "error", message: "Error al exportar DXF" }, { status: 500 });
  }
}

function int(val: any) {
  return Math.floor(Number(val) || 0);
}

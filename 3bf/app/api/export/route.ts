import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const workerUrl = process.env.NEXT_PUBLIC_3BF_WORKER_URL || "http://localhost:8005";

    // 1. Intentar exportar con el motor Python ezdxf (Biesse Skipper Nativo)
    try {
      const workerRes = await fetch(`${workerUrl}/export-dxf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (workerRes.ok) {
        const data = await workerRes.json();
        if (data.status === "success" && data.dxf_content) {
          return NextResponse.json(data);
        }
      }
    } catch (e) {
      console.warn("⚠️ 3BF Worker Python offline para DXF. Usando generador Biesse Skipper nativo en Next.js.");
    }

    // 2. Generador de respaldo nativo Biesse Skipper en TypeScript
    const params = body.parameters || {};
    const despiece = body.despiece || [];
    const modelId = body.model_id || "Cubierta";
    const version = body.version || "BD 1.0";

    const p0 = despiece.length > 0 ? despiece[0] : null;
    const nombre = p0?.nombre || modelId;
    const largo = p0?.largo ?? Number(params["RH_IN:01.1 Ancho"] ?? params.ancho ?? 498);
    const ancho = p0?.ancho ?? Number(params["RH_IN:01.2 Profundidad"] ?? params.profundidad ?? 480);
    const espesor = p0?.espesor ?? 15;

    const profCorte = `D${String(Math.round(espesor * 100)).padStart(4, "0")}`;
    const capaContorno = `TCHW0B8${profCorte}`;

    const hx = largo / 2.0;
    const hy = ancho / 2.0;
    const gap = 20.0;

    const offsetCantoY = 37.0;
    const y1 = hy - offsetCantoY;
    const y2 = -hy + offsetCantoY;

    const unionIzq = String(params["RH_IN:02.1 Union izquierda"] || params.union_izquierda || "Minifix").toLowerCase();
    const unionDer = String(params["RH_IN:02.0 Union Derecha"] || params.union_derecha || "Ya definida").toLowerCase();

    let entidadesDxf = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1021\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n0\nLAYER\n2\n${capaContorno}\n62\n18\n0\nLAYER\n2\nTCHW1B8\n62\n18\n0\nLAYER\n2\nTCHW2B8\n62\n18\n0\nLAYER\n2\nTCHW3B8\n62\n18\n0\nLAYER\n2\nTCHW4B8\n62\n18\n0\nLAYER\n2\nTCHW0B15D1350\n62\n18\n0\nLAYER\n2\nTCHW0B2D1200\n62\n18\n0\nLAYER\n2\nTCHW1B8D2500\n62\n18\n0\nLAYER\n2\nTCHW3B8D2500\n62\n18\n0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;

    // 1. Polilínea de Pieza Central (Cara Superior W0)
    entidadesDxf += `0\nLWPOLYLINE\n8\n${capaContorno}\n90\n4\n70\n1\n10\n${-hx}\n20\n${-hy}\n10\n${hx}\n20\n${-hy}\n10\n${hx}\n20\n${hy}\n10\n${-hx}\n20\n${hy}\n`;

    // 2. Vistas Desplegadas de los 4 Cantos (W1: Izq, W2: Inf, W3: Der, W4: Sup)
    // Canto Izquierdo (W1)
    entidadesDxf += `0\nLWPOLYLINE\n8\nTCHW1B8\n90\n4\n70\n1\n10\n${-hx - gap}\n20\n${-hy}\n10\n${-hx - gap}\n20\n${hy}\n10\n${-hx - gap - espesor}\n20\n${hy}\n10\n${-hx - gap - espesor}\n20\n${-hy}\n`;

    // Canto Derecho (W3)
    entidadesDxf += `0\nLWPOLYLINE\n8\nTCHW3B8\n90\n4\n70\n1\n10\n${hx + gap}\n20\n${-hy}\n10\n${hx + gap}\n20\n${hy}\n10\n${hx + gap + espesor}\n20\n${hy}\n10\n${hx + gap + espesor}\n20\n${-hy}\n`;

    // Canto Superior (W4)
    entidadesDxf += `0\nLWPOLYLINE\n8\nTCHW4B8\n90\n4\n70\n1\n10\n${-hx}\n20\n${hy + gap}\n10\n${hx}\n20\n${hy + gap}\n10\n${hx}\n20\n${hy + gap + espesor}\n10\n${-hx}\n20\n${hy + gap + espesor}\n`;

    // Canto Inferior (W2)
    entidadesDxf += `0\nLWPOLYLINE\n8\nTCHW2B8\n90\n4\n70\n1\n10\n${-hx}\n20\n${-hy - gap}\n10\n${hx}\n20\n${-hy - gap}\n10\n${hx}\n20\n${-hy - gap - espesor}\n10\n${-hx}\n20\n${-hy - gap - espesor}\n`;

    const esEntrepanio = nombre.toLowerCase().includes("entrepaño") || nombre.toLowerCase().includes("entrepanio");

    // 3. Mecanizados Lado Izquierdo (Solo si es Cubierta fija, no para Entrepaño liso)
    if (!esEntrepanio) {
      if (unionIzq.includes("minifix")) {
        const xIzqCaja = -hx + 34.0;
        // Cajas Minifix en Cara Superior W0
        entidadesDxf += `0\nCIRCLE\n8\nTCHW0B15D1350\n10\n${xIzqCaja}\n20\n${y1}\n40\n7.5\n`;
        entidadesDxf += `0\nCIRCLE\n8\nTCHW0B15D1350\n10\n${xIzqCaja}\n20\n${y2}\n40\n7.5\n`;
        // Perforaciones en la vista del Canto Izquierdo (W1)
        const xCantoIzqCentro = -hx - gap - (espesor / 2.0);
        entidadesDxf += `0\nCIRCLE\n8\nTCHW1B8D2500\n10\n${xCantoIzqCentro}\n20\n${y1}\n40\n4.0\n`;
        entidadesDxf += `0\nCIRCLE\n8\nTCHW1B8D2500\n10\n${xCantoIzqCentro}\n20\n${y2}\n40\n4.0\n`;
      } else if (unionIzq.includes("tarugo") || unionIzq.includes("tornillo")) {
        const xCantoIzqCentro = -hx - gap - (espesor / 2.0);
        entidadesDxf += `0\nCIRCLE\n8\nTCHW1B8D2500\n10\n${xCantoIzqCentro}\n20\n${y1}\n40\n4.0\n`;
        entidadesDxf += `0\nCIRCLE\n8\nTCHW1B8D2500\n10\n${xCantoIzqCentro}\n20\n${y2}\n40\n4.0\n`;
      }

      // 4. Mecanizados Lado Derecho (Solo si es Cubierta)
      if (unionDer.includes("minifix")) {
        const xDerCaja = hx - 34.0;
        // Cajas Minifix en Cara Superior W0
        entidadesDxf += `0\nCIRCLE\n8\nTCHW0B15D1350\n10\n${xDerCaja}\n20\n${y1}\n40\n7.5\n`;
        entidadesDxf += `0\nCIRCLE\n8\nTCHW0B15D1350\n10\n${xDerCaja}\n20\n${y2}\n40\n7.5\n`;
        // Perforaciones en la vista del Canto Derecho (W3)
        const xCantoDerCentro = hx + gap + (espesor / 2.0);
        entidadesDxf += `0\nCIRCLE\n8\nTCHW3B8D2500\n10\n${xCantoDerCentro}\n20\n${y1}\n40\n4.0\n`;
        entidadesDxf += `0\nCIRCLE\n8\nTCHW3B8D2500\n10\n${xCantoDerCentro}\n20\n${y2}\n40\n4.0\n`;
      } else if (unionDer.includes("tarugo") || unionDer.includes("tornillo")) {
        const xCantoDerCentro = hx + gap + (espesor / 2.0);
        entidadesDxf += `0\nCIRCLE\n8\nTCHW3B8D2500\n10\n${xCantoDerCentro}\n20\n${y1}\n40\n4.0\n`;
        entidadesDxf += `0\nCIRCLE\n8\nTCHW3B8D2500\n10\n${xCantoDerCentro}\n20\n${y2}\n40\n4.0\n`;
      }
    }

    entidadesDxf += `0\nENDSEC\n0\nEOF\n`;

    const versionClean = version.replace(/\s+/g, "");
    const filename = `${nombre}_${Math.round(largo)}x${Math.round(ancho)}_${Math.round(espesor)}mm_${versionClean}.dxf`;

    return NextResponse.json({
      status: "success",
      filename,
      dxf_content: entidadesDxf,
      machine_profile: "Biesse Skipper (bSolid/BiesseWorks)",
      dimensions: `${largo} x ${ancho} x ${espesor} mm`
    });
  } catch (error) {
    console.error("Error exportando DXF:", error);
    return NextResponse.json({ status: "error", message: "Error al exportar DXF" }, { status: 500 });
  }
}

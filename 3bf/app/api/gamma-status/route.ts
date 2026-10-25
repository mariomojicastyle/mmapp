import { NextResponse } from "next/server";

// Memoria volátil del servidor para sincronización en tiempo real (<5ms)
let estadoGamma: {
  activo: boolean;
  mensaje: string;
  pasoId?: string;
  capaId?: string;
  payload?: any;
  timestamp: number;
} = {
  activo: false,
  mensaje: "",
  pasoId: "",
  capaId: "",
  payload: null,
  timestamp: Date.now(),
};

export async function GET() {
  return NextResponse.json(estadoGamma, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    estadoGamma = {
      activo: Boolean(body.activo),
      mensaje: body.mensaje || (body.activo ? "Gamma está operando la cinemática en vivo..." : "Cinemática lista"),
      pasoId: body.pasoId || estadoGamma.pasoId || "",
      capaId: body.capaId || estadoGamma.capaId || "",
      payload: body.payload !== undefined ? body.payload : (body.activo ? estadoGamma.payload : null),
      timestamp: Date.now(),
    };
    return NextResponse.json({ success: true, estado: estadoGamma });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

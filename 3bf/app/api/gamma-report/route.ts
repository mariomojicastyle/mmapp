import { NextResponse } from "next/server";

let reporteHerrajes: any = null;

export async function GET() {
  return NextResponse.json({ reporte: reporteHerrajes });
}

export async function POST(req: Request) {
  try {
    reporteHerrajes = await req.json();
    return NextResponse.json({ success: true, reporte: reporteHerrajes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

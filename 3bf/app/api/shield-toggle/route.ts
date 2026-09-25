import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { SHIELD_COOKIE_NAME, TOKEN_OWNER, SHIELD_MAX_AGE_OWNER } from "@/lib/shieldAuth";

const CONFIG_PATH = path.join(process.cwd(), "storage", "shield_config.json");

function readShieldStatus(): boolean {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      return data.enabled !== false;
    }
  } catch (err) {
    console.error("[Shield] Error leyendo shield_config.json:", err);
  }
  return true; // Por defecto el shield está activo
}

function writeShieldStatus(enabled: boolean): void {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ enabled, updatedAt: new Date().toISOString() }, null, 2), "utf-8");
  } catch (err) {
    console.error("[Shield] Error guardando shield_config.json:", err);
  }
}

export async function GET() {
  const enabled = readShieldStatus();
  return NextResponse.json({ enabled });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { enabled } = body;
    const targetState = Boolean(enabled);

    writeShieldStatus(targetState);

    const res = NextResponse.json({ success: true, enabled: targetState });

    // Actualizar cookie global de modo shield
    res.cookies.set({
      name: "3bf_shield_mode",
      value: targetState ? "enabled" : "disabled",
      maxAge: 60 * 60 * 24 * 365, // 1 año
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });

    if (!targetState) {
      // Si se desactiva el blindaje, emitir también el token de autorización permanente para que el navegador quede autenticado
      res.cookies.set({
        name: SHIELD_COOKIE_NAME,
        value: TOKEN_OWNER,
        maxAge: SHIELD_MAX_AGE_OWNER,
        path: "/",
        sameSite: "lax",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
      });
    }

    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Error procesando solicitud" }, { status: 500 });
  }
}

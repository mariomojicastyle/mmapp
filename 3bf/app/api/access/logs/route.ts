import { NextResponse } from "next/server";
import { SHIELD_COOKIE_NAME, TOKEN_OWNER, isTokenValido } from "@/lib/shieldAuth";
import { obtenerAlertasRecientes } from "@/lib/shieldAlerts";

export async function GET(request: Request) {
  // Verificar que quien consulte sea un dispositivo autorizado
  const cookieHeader = request.headers.get("cookie") || "";
  const esAutorizado =
    cookieHeader.includes(`${SHIELD_COOKIE_NAME}=${TOKEN_OWNER}`) ||
    cookieHeader.includes(SHIELD_COOKIE_NAME);

  if (!esAutorizado && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Acceso no autorizado al registro de auditoría de seguridad." },
      { status: 401 }
    );
  }

  const alertas = obtenerAlertasRecientes();

  return NextResponse.json({
    total: alertas.length,
    alertas,
  });
}

import { NextResponse } from "next/server";
import {
  SHIELD_COOKIE_NAME,
  verificarClaveAcceso,
} from "@/lib/shieldAuth";
import {
  obtenerIpCliente,
  registrarAlertaSeguridad,
} from "@/lib/shieldAlerts";

export async function POST(request: Request) {
  const ip = obtenerIpCliente(request.headers);
  const userAgent = request.headers.get("user-agent") || "Navegador Desconocido";

  try {
    const body = await request.json().catch(() => ({}));
    const { key } = body || {};

    if (!key || typeof key !== "string" || !key.trim()) {
      await registrarAlertaSeguridad({
        tipo: "INTENTO_INTRUSION_CLAVE_ERRONEA",
        ip,
        userAgent,
        ruta: "/access",
        claveIntentada: "[VACÍA]",
        detalles: "Intento de envío de formulario de acceso sin clave.",
      });

      return NextResponse.json(
        { success: false, error: "Por favor ingrese la clave de acceso." },
        { status: 400 }
      );
    }

    const resultado = verificarClaveAcceso(key);

    if (!resultado.valid || !resultado.token || !resultado.maxAge) {
      // 🚨 Intento de Intrusión / Clave Errónea
      await registrarAlertaSeguridad({
        tipo: "INTENTO_INTRUSION_CLAVE_ERRONEA",
        ip,
        userAgent,
        ruta: "/access",
        claveIntentada: key.trim().substring(0, 40),
        detalles: "Contraseña incorrecta ingresada en la pantalla de bienvenida.",
      });

      return NextResponse.json(
        { success: false, error: "Clave de acceso no válida. Acceso restringido." },
        { status: 401 }
      );
    }

    // ✅ Acceso Autorizado (Propietario o Invitado)
    const tipoAcceso =
      resultado.tier === "owner"
        ? "ACCESO_EXITOSO_PROPIETARIO"
        : "ACCESO_EXITOSO_INVITADO_24H";

    await registrarAlertaSeguridad({
      tipo: tipoAcceso,
      ip,
      userAgent,
      ruta: "/access",
      detalles: `Dispositivo autorizado bajo modalidad: ${resultado.description}`,
    });

    const response = NextResponse.json({
      success: true,
      message: "Dispositivo autorizado exitosamente.",
    });

    // Cookie de autenticación (opaca y discreta)
    response.cookies.set({
      name: SHIELD_COOKIE_NAME,
      value: resultado.token,
      maxAge: resultado.maxAge,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error procesando solicitud de autorización." },
      { status: 500 }
    );
  }
}

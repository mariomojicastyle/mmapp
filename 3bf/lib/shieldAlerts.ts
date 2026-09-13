/**
 * 🚨 3dBimFab Shield - Sistema de Detección de Intrusiones y Alertas en Tiempo Real
 * 
 * Registra y notifica:
 * - Intentos de intrusión con clave incorrecta.
 * - Intentos de forzado de URLs o APIs protegidas.
 * - Desbloqueos exitosos (Propietario vs Invitado 24h) con IP y dispositivo.
 * 
 * Canales de notificación:
 * 1. Webhook a n8n (https://n8n.mariomojica.com/webhook/3bf-security-alert)
 * 2. Telegram Bot directo (si TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID están configurados)
 * 3. Log persistente local en data/shield_alerts.json (cuando corre en runtime Node)
 * 4. Consola de seguridad del servidor con marcadores emoji
 */

export interface ShieldAlertEvent {
  id: string;
  tipo:
    | "INTENTO_INTRUSION_CLAVE_ERRONEA"
    | "INTENTO_ACCESO_NO_AUTORIZADO"
    | "ACCESO_EXITOSO_PROPIETARIO"
    | "ACCESO_EXITOSO_INVITADO_24H";
  ip: string;
  userAgent: string;
  fechaIso: string;
  fechaColombia: string;
  ruta: string;
  claveIntentada?: string;
  detalles?: string;
}

// Memoria en caliente para los últimos 50 eventos (disponible mientras el servidor esté activo)
const MEMORIA_ALERTAS: ShieldAlertEvent[] = [];

/**
 * Extrae la IP pública real del cliente desde cabeceras Cloudflare / Proxy / Edge.
 */
export function obtenerIpCliente(headers: Headers): string {
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const primerIp = forwarded.split(",")[0]?.trim();
    if (primerIp) return primerIp;
  }

  return "Desconocida (Local)";
}

/**
 * Registra y despacha una alerta de seguridad inmediatamente.
 */
export async function registrarAlertaSeguridad(evento: Omit<ShieldAlertEvent, "id" | "fechaIso" | "fechaColombia">): Promise<ShieldAlertEvent> {
  const ahora = new Date();
  const fechaColombia = ahora.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    hour12: true,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const alertaCompleta: ShieldAlertEvent = {
    id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fechaIso: ahora.toISOString(),
    fechaColombia,
    ...evento,
  };

  // 1. Guardar en memoria activa en caliente (máximo 100)
  MEMORIA_ALERTAS.unshift(alertaCompleta);
  if (MEMORIA_ALERTAS.length > 100) {
    MEMORIA_ALERTAS.pop();
  }

  // 2. Imprimir en consola de seguridad
  const esIntrusion = alertaCompleta.tipo.includes("INTRUSION") || alertaCompleta.tipo.includes("NO_AUTORIZADO");
  const icono = esIntrusion ? "🚨 [INTRUSIÓN]" : "✅ [ACCESO VÁLIDO]";
  console.warn(
    `${icono} 3dBimFab Shield - ${alertaCompleta.tipo} | IP: ${alertaCompleta.ip} | Hora CO: ${alertaCompleta.fechaColombia} | Ruta: ${alertaCompleta.ruta}${
      alertaCompleta.claveIntentada ? ` | Clave probada: "${alertaCompleta.claveIntentada}"` : ""
    }`
  );

  // 3. Persistir en disco si estamos en entorno Node.js
  try {
    if (typeof window === "undefined") {
      const fs = await import("fs");
      const path = await import("path");
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, "shield_alerts.json");
      let historico: ShieldAlertEvent[] = [];
      if (fs.existsSync(filePath)) {
        try {
          const raw = fs.readFileSync(filePath, "utf-8");
          historico = JSON.parse(raw);
        } catch (_) {
          historico = [];
        }
      }
      historico.unshift(alertaCompleta);
      if (historico.length > 500) historico = historico.slice(0, 500);
      fs.writeFileSync(filePath, JSON.stringify(historico, null, 2), "utf-8");
    }
  } catch (err) {
    // Si corre en Edge runtime o entorno serverless sin acceso a disco, continúa silenciosamente
  }

  // 4. Despacho a Webhook n8n (asíncrono sin bloquear la respuesta al usuario)
  const webhookUrl = process.env.SHIELD_ALERT_WEBHOOK_URL || "https://n8n.mariomojica.com/webhook/3bf-security-alert";
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "3dBimFab Shield",
        environment: process.env.NODE_ENV || "development",
        domain: "3bf.mariomojica.com",
        alerta: alertaCompleta,
      }),
      signal: AbortSignal.timeout(3500),
    }).catch(() => {
      // Falla silenciosa si n8n no está accesible en ese instante
    });
  }

  // 5. Despacho directo a Telegram Bot si está configurado
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    const textoMensaje = esIntrusion
      ? `🚨 *ALERTA DE SEGURIDAD 3dBimFab*\n\n` +
        `⚠️ *Intento de Intrusión Detectado*\n` +
        `• *Tipo:* ${alertaCompleta.tipo}\n` +
        `• *IP:* \`${alertaCompleta.ip}\`\n` +
        `• *Hora (CO):* ${alertaCompleta.fechaColombia}\n` +
        `• *Ruta:* \`${alertaCompleta.ruta}\`\n` +
        (alertaCompleta.claveIntentada ? `• *Clave intentada:* \`${alertaCompleta.claveIntentada}\`\n` : "") +
        `• *Dispositivo:* ${alertaCompleta.userAgent.substring(0, 80)}`
      : `🛡️ *ACCESO AUTORIZADO 3dBimFab*\n\n` +
        `• *Nivel:* ${alertaCompleta.tipo}\n` +
        `• *IP:* \`${alertaCompleta.ip}\`\n` +
        `• *Hora (CO):* ${alertaCompleta.fechaColombia}\n` +
        `• *Ruta:* \`${alertaCompleta.ruta}\``;

    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: tgChat,
        text: textoMensaje,
        parse_mode: "Markdown",
      }),
      signal: AbortSignal.timeout(3500),
    }).catch(() => {});
  }

  return alertaCompleta;
}

/**
 * Obtiene el historial de alertas recientes registradas (memoria o disco).
 */
export function obtenerAlertasRecientes(): ShieldAlertEvent[] {
  if (typeof window === "undefined") {
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "data", "shield_alerts.json");
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
  }
  return [...MEMORIA_ALERTAS];
}

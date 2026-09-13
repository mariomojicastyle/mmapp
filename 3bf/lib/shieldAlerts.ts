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

  // 5. Despacho directo por Email (vía Resend API o Webhook Email)
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailDestino = process.env.SHIELD_ALERT_EMAIL || "mariomojica.style@gmail.com";
  if (resendApiKey) {
    const asunto = esIntrusion
      ? `🚨 ALERTA DE SEGURIDAD 3dBimFab: Intento de Intrusión (IP ${alertaCompleta.ip})`
      : `🛡️ Acceso Autorizado 3dBimFab (${alertaCompleta.tipo})`;

    const cuerpoHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: ${esIntrusion ? '#e11d48' : '#0284c7'}; padding: 20px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 700;">${esIntrusion ? '🚨 Intento de Intrusión Detectado' : '🛡️ Acceso Autorizado a 3dBimFab'}</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">3dBimFab Shield - Sistema de Detección en Tiempo Real</p>
        </div>
        <div style="padding: 24px; color: #334155; font-size: 14px; line-height: 1.6;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 140px;">Evento:</td><td style="padding: 8px 0; font-weight: 700; color: ${esIntrusion ? '#e11d48' : '#059669'};">${alertaCompleta.tipo}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Dirección IP:</td><td style="padding: 8px 0; font-family: monospace; font-size: 14px;"><strong>${alertaCompleta.ip}</strong></td></tr>
            <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Hora (Colombia):</td><td style="padding: 8px 0;">${alertaCompleta.fechaColombia}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Ruta solicitada:</td><td style="padding: 8px 0; font-family: monospace;">${alertaCompleta.ruta}</td></tr>
            ${alertaCompleta.claveIntentada ? `<tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Clave probada:</td><td style="padding: 8px 0; font-family: monospace; color: #e11d48;"><strong>${alertaCompleta.claveIntentada}</strong></td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Dispositivo:</td><td style="padding: 8px 0; font-size: 12px; color: #475569;">${alertaCompleta.userAgent}</td></tr>
          </table>
          <div style="margin-top: 24px; text-align: center;">
            <a href="https://3bf.mariomojica.com/api/access/logs" style="display: inline-block; padding: 10px 24px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 13px;">Auditar Logs en Vivo</a>
          </div>
        </div>
      </div>
    `;

    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "3dBimFab Shield <onboarding@resend.dev>",
        to: [emailDestino],
        subject: asunto,
        html: cuerpoHtml,
      }),
      signal: AbortSignal.timeout(4000),
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

// Generación de tokens HMAC-SHA256 para peticiones AR al Edge Function decrypt-glb
// El token firma (manualId:step:timestamp) y tiene TTL de 30 minutos.

const AR_HMAC_SECRET = import.meta.env.VITE_AR_HMAC_SECRET || "";

/**
 * Genera un token HMAC-SHA256 firmado para autorizar peticiones AR al Edge Function.
 * @param {string} manualId - ID del manual (ej: "M00001")
 * @param {string} step - Paso del modelo (ej: "P00", "P05")
 * @returns {Promise<{token: string, ts: string}>}
 */
export async function generateARToken(manualId, step) {
  const ts = Date.now().toString();
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(AR_HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(`${manualId}:${step}:${ts}`)
  );

  const token = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { token, ts };
}

/**
 * Construye la URL completa del Edge Function decrypt-glb con token HMAC.
 * @param {string} manualId - ID del manual
 * @param {string} step - Paso del modelo (ej: "P00")
 * @returns {Promise<string>} URL firmada del Edge Function
 */
export async function getDecryptGlbUrl(manualId, step) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const { token, ts } = await generateARToken(manualId, step);
  return `${supabaseUrl}/functions/v1/decrypt-glb?id=${manualId}&step=${step}&token=${token}&ts=${ts}`;
}

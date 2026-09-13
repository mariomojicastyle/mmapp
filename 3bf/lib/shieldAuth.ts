/**
 * 🛡️ 3dBimFab Shield - Control de Acceso Dual y Blindaje de Dispositivos Autorizados
 * 
 * Soporta dos niveles de autorización:
 * 1. PROPIETARIO (Mario Mojica): Acceso permanente (365 días renovable)
 * 2. INVITADO / DEMO (Fabricantes RTA): Acceso temporal por 24 horas (86,400s)
 */

export const SHIELD_COOKIE_NAME = "3bf_shield_auth";

// Tiempos de expiración (en segundos)
export const SHIELD_MAX_AGE_OWNER = 60 * 60 * 24 * 365; // 365 días (Permanente)
export const SHIELD_MAX_AGE_GUEST = 60 * 60 * 24;       // 24 horas

// Claves de Propietario (Permanente)
export const DEFAULT_OWNER_PASSKEYS = ["mario3bf2026", "MM3BF7646907"];

// Claves de Invitado / Temporal (24 Horas)
export const DEFAULT_GUEST_PASSKEYS = ["invitado3bf24h", "demo24h_3bf", "3bf24h"];

// Tokens criptográficos emitidos (opacos para no filtrar pistas a inspección)
export const TOKEN_OWNER = "3bf_sec_tok_8f92a1c0d4e7b512";
export const TOKEN_GUEST = "3bf_sec_tok_2b71e8f9a3c40156";
export const TOKEN_LEGACY_OWNER = "3bf_token_owner_permanent";
export const TOKEN_LEGACY_GUEST = "3bf_token_guest_24h";
export const TOKEN_LEGACY = "3bf_authorized_device_token_v1_secure_mm";

export type ShieldTier = "owner" | "guest";

export interface ShieldAuthResult {
  valid: boolean;
  tier?: ShieldTier;
  maxAge?: number;
  token?: string;
  description?: string;
  error?: string;
}

export function getOwnerPasskeys(): string[] {
  const envKey = process.env.SHIELD_OWNER_KEY || process.env.SHIELD_PASSKEY || process.env.NEXT_PUBLIC_SHIELD_PASSKEY;
  const keys = [...DEFAULT_OWNER_PASSKEYS];
  if (envKey && !keys.includes(envKey.trim())) {
    keys.push(envKey.trim());
  }
  return keys;
}

export function getGuestPasskeys(): string[] {
  const envKey = process.env.SHIELD_GUEST_KEY || process.env.NEXT_PUBLIC_SHIELD_GUEST_KEY;
  const keys = [...DEFAULT_GUEST_PASSKEYS];
  if (envKey && !keys.includes(envKey.trim())) {
    keys.push(envKey.trim());
  }
  return keys;
}

/**
 * Valida la clave ingresada y determina si corresponde al Propietario o a un Invitado 24h.
 */
export function verificarClaveAcceso(claveIngresada: string): ShieldAuthResult {
  if (!claveIngresada) {
    return { valid: false, error: "Por favor ingrese la clave de acceso." };
  }

  const clean = claveIngresada.trim();

  // 1. Comprobación de Propietario (Permanente 365 días)
  const ownerKeys = getOwnerPasskeys();
  if (ownerKeys.some((k) => k.toLowerCase() === clean.toLowerCase())) {
    return {
      valid: true,
      tier: "owner",
      maxAge: SHIELD_MAX_AGE_OWNER,
      token: TOKEN_OWNER,
      description: "Acceso Propietario (Permanente)",
    };
  }

  // 2. Comprobación de Invitado (24 horas)
  const guestKeys = getGuestPasskeys();
  if (guestKeys.some((k) => k.toLowerCase() === clean.toLowerCase())) {
    return {
      valid: true,
      tier: "guest",
      maxAge: SHIELD_MAX_AGE_GUEST,
      token: TOKEN_GUEST,
      description: "Acceso Invitado (24 Horas)",
    };
  }

  return {
    valid: false,
    error: "Clave no válida. Acceso restringido a 3dBimFab.",
  };
}

/**
 * Función compatible con versiones previas.
 */
export function validarClaveAcceso(claveIngresada: string): boolean {
  return verificarClaveAcceso(claveIngresada).valid;
}

/**
 * Verifica si el valor de la cookie corresponde a un token legítimo.
 */
export function isTokenValido(token: string | undefined | null): boolean {
  if (!token) return false;
  return (
    token === TOKEN_OWNER ||
    token === TOKEN_GUEST ||
    token === TOKEN_LEGACY_OWNER ||
    token === TOKEN_LEGACY_GUEST ||
    token === TOKEN_LEGACY
  );
}

import { useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/* ─────────────────────────────────────────────
   Constantes
   ───────────────────────────────────────────── */
const SESSION_KEY = 'mm_telemetry_sid';
const TABLE = 'telemetria_manuales';

/* ─────────────────────────────────────────────
   Helpers puros (fuera del hook)
   ───────────────────────────────────────────── */

/** Devuelve o crea un session_id único por pestaña */
function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

/** Detecta si el usuario está en móvil o desktop */
function detectDeviceType() {
  const ua = navigator.userAgent || '';
  const isMobile =
    /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  return isMobile ? 'mobile' : 'desktop';
}

/**
 * Clasifica el tipo de referrer:
 *  - qr      → parámetro ?utm_source=qr o ?ref=qr
 *  - embed   → la URL contiene /embed/
 *  - direct  → sin referrer (acceso directo)
 *  - external → cualquier otro referrer
 */
function detectReferrerType() {
  const params = new URLSearchParams(window.location.search);
  const utmSource = (params.get('utm_source') || '').toLowerCase();
  const ref = (params.get('ref') || '').toLowerCase();

  if (utmSource === 'qr' || ref === 'qr') return 'qr';
  if (window.location.pathname.includes('/embed/')) return 'embed';
  if (!document.referrer) return 'direct';
  return 'external';
}

/* ─────────────────────────────────────────────
   Hook principal
   ───────────────────────────────────────────── */

/**
 * useTelemetry()
 *
 * Proporciona funciones fire-and-forget para enviar eventos de telemetría
 * a la tabla `telemetria_manuales` en Supabase.
 *
 * @returns {{ trackStepReached, trackHelpClick, trackSessionComplete, trackFeedback }}
 */
export function useTelemetry() {
  const { id: codigoManual } = useParams();

  // Refs que se resuelven una sola vez por ciclo de vida del hook
  const sessionId = useRef(getSessionId());
  const deviceType = useRef(detectDeviceType());
  const referrerType = useRef(detectReferrerType());
  const proyectoIdRef = useRef(null);
  const resolvedRef = useRef(false);

  /* ── Envío genérico (fire-and-forget) ── */
  const sendEvent = useCallback(
    (eventType, payload = {}) => {
      // Mapear para cumplir con el CHECK constraint de la base de datos
      const tipoEventoDb = eventType === 'feedback' ? 'feedback_submitted' : eventType;

      const row = {
        session_id: sessionId.current,
        proyecto_id: proyectoIdRef.current,
        tipo_evento: tipoEventoDb,
        metadata: {
          device_type: deviceType.current,
          referrer_type: referrerType.current,
          codigo_manual: codigoManual || null,
          ...payload
        },
        created_at: new Date().toISOString(),
      };

      // Fire-and-forget: no usamos await
      supabase
        .from(TABLE)
        .insert(row)
        .then(({ error }) => {
          if (error) console.warn(`[Telemetry] Error inserting "${tipoEventoDb}":`, error.message);
        });
    },
    [codigoManual],
  );

  /* ── Resolver proyecto_id a partir de codigo_manual ── */
  useEffect(() => {
    if (!codigoManual || resolvedRef.current) return;

    supabase
      .from('proyectos')
      .select('id')
      .eq('codigo_manual', codigoManual)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) {
          proyectoIdRef.current = data.id;
          // Disparar evento de inicio de sesión
          sendEvent('session_start');
        }
        resolvedRef.current = true;
      })
      .catch(() => {
        resolvedRef.current = true;
      });
  }, [codigoManual, sendEvent]);

  /* ── API pública ── */

  /** Registra que el usuario alcanzó un paso determinado */
  const trackStepReached = useCallback(
    (stepNumber) => {
      sendEvent('step_reached', { step: stepNumber });
    },
    [sendEvent],
  );

  /** Registra un clic en algún tipo de ayuda */
  const trackHelpClick = useCallback(
    (helpType) => {
      sendEvent('help_click', { help_type: helpType });
    },
    [sendEvent],
  );

  /** Registra que el usuario completó todos los pasos */
  const trackSessionComplete = useCallback(
    (totalSteps) => {
      sendEvent('session_complete', { total_steps: totalSteps });
    },
    [sendEvent],
  );

  /** Registra el feedback del usuario (rating + tags + comment) */
  const trackFeedback = useCallback(
    (rating, tags = [], comment = '') => {
      sendEvent('feedback', { rating, tags, comment });
    },
    [sendEvent],
  );

  return {
    trackStepReached,
    trackHelpClick,
    trackSessionComplete,
    trackFeedback,
  };
}

export default useTelemetry;

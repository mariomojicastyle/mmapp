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
  const eventQueue = useRef([]);

  /* ── Cargar script de Umami dinámicamente ── */
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.umami) {
      const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID || '61ad7bc7-dc54-4916-a586-4c9d94be795a';
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      script.src = 'https://analytics.mariomojica.com/script.js';
      script.setAttribute('data-website-id', websiteId);
      script.setAttribute('data-domains', 'mariomojica.com');
      document.head.appendChild(script);
    }
  }, []);

  /* ── Envío genérico (fire-and-forget) ── */
  const sendEvent = useCallback(
    (eventType, payload = {}) => {
      // Enviar evento en paralelo a Umami si está disponible
      if (typeof window !== 'undefined' && window.umami) {
        let umamiEventName = eventType;
        if (eventType === 'session_start') umamiEventName = 'Session Start';
        else if (eventType === 'step_reached') umamiEventName = 'Step Reached';
        else if (eventType === 'help_click') umamiEventName = 'Help Clicked';
        else if (eventType === 'session_complete') umamiEventName = 'Session Complete';
        else if (eventType === 'feedback') umamiEventName = 'Feedback Submitted';

        window.umami.track(umamiEventName, {
          manual: codigoManual || 'unknown',
          device: deviceType.current,
          referrer: referrerType.current,
          ...payload
        });
      }

      // Si aún no se ha resuelto el proyecto_id, encolamos el evento
      if (!resolvedRef.current) {
        eventQueue.current.push({ eventType, payload });
        return;
      }

      // Si se resolvió pero no hay proyecto_id (ej. código manual inválido), no enviamos nada
      if (!proyectoIdRef.current) return;

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

      const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3003'
        : 'https://mariomojica.com';

      fetch(`${baseUrl}/api/metrics/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(row)
      })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.warn(`[Telemetry] Error: ${res.status} - ${text}`);
        }
      })
      .catch(err => console.warn('[Telemetry] Connection fail:', err.message));
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
        // Procesar cola
        if (eventQueue.current.length > 0) {
          eventQueue.current.forEach(evt => sendEvent(evt.eventType, evt.payload));
          eventQueue.current = [];
        }
      })
      .catch(() => {
        resolvedRef.current = true;
        eventQueue.current = []; // Descartar si hay error
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

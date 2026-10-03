/**
 * =========================================================================================
 * ✂️ 3dBimFab Opti_Nesting — Generador de Fichas Técnicas de Corte en PDF (Fase 3)
 * Exportación para Taller con diagramas vectoriales SVG página por página,
 * membrete oficial 3dBimFab, tablas de despiece y código QR de producción.
 * =========================================================================================
 */

import type { ResultadoOptimizacionGlobal, ConfiguracionLaminas } from "./tiposOptimizador";
import QRCode from "qrcode";

interface DatosReporte {
  nombreProyecto: string;
  resultado: ResultadoOptimizacionGlobal;
  config: ConfiguracionLaminas;
}

export async function generarFichaTecnicaTallerPdf({
  nombreProyecto,
  resultado,
  config,
}: DatosReporte): Promise<void> {
  // 1. Generar código QR en Base64 con metadatos de producción
  const qrDataText = JSON.stringify({
    app: "3dBimFab",
    proyecto: nombreProyecto,
    modo: resultado.modo,
    laminas: resultado.totalLaminas,
    aprovechamiento: `${resultado.aprovechamientoPromedio}%`,
    fecha: new Date().toISOString().split("T")[0],
  });

  let qrBase64 = "";
  try {
    qrBase64 = await QRCode.toDataURL(qrDataText, { width: 120, margin: 1 });
  } catch (err) {
    console.warn("No se pudo generar el código QR:", err);
  }

  // 2. Construir SVG de cada lámina a escala
  const paginasLaminasHtml = resultado.laminas.map((lamina) => {
    const scale = 500 / Math.max(lamina.largoTotal, lamina.anchoTotal);
    const svgW = lamina.largoTotal * scale;
    const svgH = lamina.anchoTotal * scale;

    const piezasSvg = lamina.piezas.map((p) => {
      const px = p.x * scale;
      const py = p.y * scale;
      const pw = p.largo * scale;
      const ph = p.ancho * scale;

      const fontSize = Math.max(8, Math.min(11, ph / 3.5));
      const mostrarTexto = pw > 25 && ph > 15;

      return `
        <g>
          <rect x="${px}" y="${py}" width="${pw}" height="${ph}" 
                fill="${p.colorHex}" stroke="#334155" stroke-width="1" />
          ${mostrarTexto ? `
            <text x="${px + pw / 2}" y="${py + ph / 2 - 3}" 
                  font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="#0F172A" text-anchor="middle" dominant-baseline="middle">
              ${p.nombre}
            </text>
            <text x="${px + pw / 2}" y="${py + ph / 2 + 8}" 
                  font-family="sans-serif" font-size="${Math.max(7, fontSize - 2)}" fill="#334155" text-anchor="middle" dominant-baseline="middle">
              ${Math.round(p.largo)}×${Math.round(p.ancho)}
            </text>
          ` : ""}
        </g>
      `;
    }).join("");

    // Líneas de corte guillotina si existen
    const cortesSvg = (lamina.lineasCorte || []).map((c) => `
      <line x1="${c.x1 * scale}" y1="${c.y1 * scale}" x2="${c.x2 * scale}" y2="${c.y2 * scale}" 
            stroke="#EF4444" stroke-width="1.2" stroke-dasharray="3,3" />
    `).join("");

    const tablaFilas = lamina.piezas.map((p, idx) => `
      <tr style="border-bottom: 1px solid #E2E8F0; font-size: 11px;">
        <td style="padding: 4px 8px; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 4px 8px;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${p.colorHex}; margin-right: 6px; vertical-align: middle;"></span>
          <strong>${p.nombre}</strong>
          ${p.descripcion && p.descripcion !== p.nombre ? `<br><small style="color: #64748B;">${p.descripcion}</small>` : ""}
        </td>
        <td style="padding: 4px 8px; font-family: monospace;">${Math.round(p.largo)} × ${Math.round(p.ancho)} mm</td>
        <td style="padding: 4px 8px; text-align: center;">${p.rotada ? "Girada 90°" : "Veta Original"}</td>
        <td style="padding: 4px 8px; text-align: center;">${p.requiereOnionSkin ? '<span style="color: #E11D48; font-weight: bold;">Sí (Tabs)</span>' : "No"}</td>
      </tr>
    `).join("");

    return `
      <div class="hoja-lamina" style="page-break-after: always; padding: 24px; max-width: 900px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Cabecera de Hoja -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0088AA; padding-bottom: 10px; margin-bottom: 16px;">
          <div>
            <h2 style="margin: 0; font-size: 18px; color: #0F172A;">
              LÁMINA ${lamina.indice} DE ${resultado.totalLaminas} — ${lamina.material} (${lamina.espesor} mm)
            </h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B;">
              Proyecto: <strong>${nombreProyecto}</strong> | Formato Tablero: <strong>${lamina.largoTotal} × ${lamina.anchoTotal} mm</strong>
            </p>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background-color: #ECFDF5; border: 1px solid #10B981; color: #047857; font-weight: bold; font-size: 13px; padding: 3px 10px; border-radius: 9999px;">
              ${lamina.porcentajeAprovechamiento}% Útil
            </span>
            <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">Merma: ${lamina.porcentajeDesperdicio}% | Corte: ${lamina.metrosLinealesCorte} m</div>
          </div>
        </div>

        <!-- Diagrama Vectorial de Corte a Escala -->
        <div style="text-align: center; margin-bottom: 18px; padding: 12px; background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px;">
          <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="display: inline-block; background: #FFFFFF; border: 1px solid #94A3B8; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            ${piezasSvg}
            ${cortesSvg}
          </svg>
          <div style="font-size: 10px; color: #64748B; margin-top: 6px;">
            Dimensiones de tablero: ${lamina.largoTotal} mm (ancho en gráfico) × ${lamina.anchoTotal} mm (alto en gráfico)
          </div>
        </div>

        <!-- Tabla de Despiece de la Lámina -->
        <h3 style="font-size: 13px; margin: 0 0 8px 0; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
          Piezas contenidas en este tablero (${lamina.piezas.length} unidades):
        </h3>
        <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 12px;">
          <thead>
            <tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1; font-size: 11px; color: #475569;">
              <th style="padding: 6px 8px;">#</th>
              <th style="padding: 6px 8px;">Identificación</th>
              <th style="padding: 6px 8px;">Medidas (L×A)</th>
              <th style="padding: 6px 8px; text-align: center;">Orientación</th>
              <th style="padding: 6px 8px; text-align: center;">Onion Skin</th>
            </tr>
          </thead>
          <tbody>
            ${tablaFilas}
          </tbody>
        </table>
      </div>
    `;
  }).join("");

  // 3. Documento HTML final imprimible
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Ficha de Corte Industrial - ${nombreProyecto} - 3dBimFab</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; background: #FFFFFF; }
          .no-print { display: none !important; }
          .hoja-lamina { page-break-after: always; padding: 10mm !important; }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #F8FAFC;
          color: #0F172A;
          margin: 0;
          padding: 20px;
        }
      </style>
    </head>
    <body>
      <!-- Barra de Acción para Imprimir -->
      <div class="no-print" style="max-width: 900px; margin: 0 auto 20px auto; padding: 12px 18px; background: #FFFFFF; border-radius: 9999px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); display: flex; justify-content: space-between; align-items: center; border: 1px solid #E2E8F0;">
        <div style="font-size: 13px; font-weight: bold; color: #0088AA;">
          ✂️ 3dBimFab — Vista Previa de Ficha de Corte Industrial
        </div>
        <button onclick="window.print()" style="background-color: #0088AA; color: #FFFFFF; border: none; padding: 8px 20px; border-radius: 9999px; font-weight: bold; font-size: 13px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          🖨️ Imprimir / Guardar como PDF
        </button>
      </div>

      <!-- PORTADA Y RESUMEN GENERAL -->
      <div class="hoja-lamina" style="max-width: 900px; margin: 0 auto; background: #FFFFFF; padding: 32px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0088AA; padding-bottom: 16px; margin-bottom: 24px;">
          <div>
            <!-- Logotipo Canónico 3dBimFab de /publicidad/Logo_3BF.svg -->
            <svg width="180" height="74" viewBox="0 0 220 90" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(0.547,0.5)">
                <g transform="translate(0.645)">
                  <rect style="fill:#bb0f0f;stroke:none;" width="59.45" height="59.45" x="5.54" y="14.78" />
                  <text style="font-family:Prompt, -apple-system, sans-serif;font-size:29.98px;fill:#ffffff;" x="8.36" y="54.98">3BF</text>
                  <text style="font-family:Prompt, -apple-system, sans-serif;font-size:29.98px;font-weight:bold;fill:#0F172A;" x="73.09" y="54.98">3dBimFab</text>
                  <text style="font-family:Prompt, -apple-system, sans-serif;font-size:10.4px;font-weight:600;fill:#64748B;" x="73.5" y="67.13">POWERED BY MARIO MOJICA</text>
                </g>
              </g>
            </svg>
          </div>
          ${qrBase64 ? `<img src="${qrBase64}" width="80" height="80" alt="QR Producción" style="border: 1px solid #E2E8F0; padding: 2px; border-radius: 6px;" />` : ""}
        </div>

        <h1 style="font-size: 22px; margin: 0 0 8px 0; color: #0F172A;">FICHA TÉCNICA DE OPTIMIZACIÓN Y CORTE</h1>
        <p style="font-size: 13px; color: #475569; margin: 0 0 20px 0;">
          Proyecto: <strong>${nombreProyecto}</strong> | Lote: <strong>${config.tamanoLote || 1} ${Number(config.tamanoLote) > 1 ? "muebles" : "mueble"}</strong> | Fecha: <strong>${new Date().toLocaleDateString("es-ES")}</strong> | Modo: <strong>${resultado.modo.toUpperCase()}</strong>
        </p>

        <!-- Métricas Clave en Cajas -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 800; color: #15803D;">${resultado.aprovechamientoPromedio}%</div>
            <div style="font-size: 10px; font-weight: bold; color: #166534; text-transform: uppercase;">Aprovechamiento</div>
          </div>
          <div style="background: #FFF1F2; border: 1px solid #FECDD3; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 800; color: #BE123C;">${(100 - resultado.aprovechamientoPromedio).toFixed(1)}%</div>
            <div style="font-size: 10px; font-weight: bold; color: #9F1239; text-transform: uppercase;">Merma / Desperdicio</div>
          </div>
          <div style="background: #F0F9FF; border: 1px solid #BAE6FD; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 800; color: #0369A1;">${resultado.totalLaminas}</div>
            <div style="font-size: 10px; font-weight: bold; color: #075985; text-transform: uppercase;">Láminas Totales</div>
          </div>
          <div style="background: #FEF3C7; border: 1px solid #FDE68A; padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 800; color: #B45309;">${resultado.totalPiezasUbicadas}</div>
            <div style="font-size: 10px; font-weight: bold; color: #92400E; text-transform: uppercase;">Piezas a Cortar</div>
          </div>
        </div>

        <!-- Parámetros de Taller -->
        <h3 style="font-size: 12px; color: #475569; text-transform: uppercase; margin: 0 0 8px 0; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">
          Configuración de Máquina y Material
        </h3>
        <table style="width: 100%; font-size: 12px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 4px 0; color: #64748B;">Formato de Lámina Estándar:</td>
            <td style="padding: 4px 0; font-weight: bold;">${config.largoBruto} × ${config.anchoBruto} mm</td>
            <td style="padding: 4px 0; color: #64748B;">Espesor de Sierra (Kerf):</td>
            <td style="padding: 4px 0; font-weight: bold;">${config.kerfSierra} mm</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748B;">Refilado Perimetral:</td>
            <td style="padding: 4px 0; font-weight: bold;">${config.refiladoMargen} mm</td>
            <td style="padding: 4px 0; color: #64748B;">Diámetro Fresa CNC:</td>
            <td style="padding: 4px 0; font-weight: bold;">${config.diametroFresa} mm</td>
          </tr>
        </table>
      </div>

      <!-- PÁGINAS DE CADA LÁMINA -->
      ${paginasLaminasHtml}
    </body>
    </html>
  `;

  // 4. Abrir en una nueva ventana para imprimir directamente con fallback a descarga HTML
  try {
    const ventanaImpresion = window.open("", "_blank");
    if (ventanaImpresion) {
      ventanaImpresion.document.open();
      ventanaImpresion.document.write(htmlContent);
      ventanaImpresion.document.close();
      return;
    }
  } catch (e) {
    console.warn("Ventana emergente bloqueada, ejecutando descarga directa...", e);
  }

  // Fallback si la ventana emergente fue bloqueada por el navegador
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const nombreLimpio = nombreProyecto.replace(/[^a-zA-Z0-9_-]/g, "_");
  link.setAttribute("href", url);
  link.setAttribute("download", `Ficha_Corte_${nombreLimpio}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

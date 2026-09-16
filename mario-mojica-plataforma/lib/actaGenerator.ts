export interface DialogoTurno {
  hablante: string;
  rol?: string;
  originalText: string;
  translatedText?: string;
  timestamp?: string;
}

export interface AcuerdoItem {
  tarea: string;
  responsable?: string;
  plazo?: string;
}

export interface ActaData {
  cliente: string;
  asunto: string;
  fecha: string;
  hora: string;
  duracion: string;
  participantes: string[];
  resumenPuntos: string[];
  acuerdos: AcuerdoItem[];
  dialogos: DialogoTurno[];
}

export function generarHtmlActa(
  data: ActaData,
  logos: { mmSvg: string; bfSvg: string }
): string {
  const {
    cliente,
    asunto,
    fecha,
    hora,
    duracion,
    participantes,
    resumenPuntos,
    acuerdos,
    dialogos,
  } = data;

  const participantesBadges = participantes
    .map(
      (p) =>
        `<span style="display:inline-block; padding:4px 12px; background:#f1f5f9; color:#0f172a; border-radius:9999px; font-size:12px; font-weight:600; margin-right:6px; margin-bottom:6px; border:1px solid #e2e8f0;">👤 ${p}</span>`
    )
    .join("");

  const resumenHtml = resumenPuntos
    .map(
      (punto) =>
        `<li style="margin-bottom:8px; line-height:1.6; color:#334155;">${punto}</li>`
    )
    .join("");

  const acuerdosHtml =
    acuerdos.length > 0
      ? acuerdos
          .map(
            (ac) => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:10px 14px; font-size:13px; color:#1e293b;">
            <label style="display:flex; align-items:flex-start; gap:8px; cursor:pointer;">
              <input type="checkbox" style="margin-top:3px; accent-color:#1368AA;" />
              <span>${ac.tarea}</span>
            </label>
          </td>
          <td style="padding:10px 14px; font-size:12px; font-weight:600; color:#1368AA; white-space:nowrap;">
            ${ac.responsable || "Por definir"}
          </td>
          <td style="padding:10px 14px; font-size:12px; color:#64748b; white-space:nowrap;">
            ${ac.plazo || "Inmediato"}
          </td>
        </tr>
      `
          )
          .join("")
      : `<tr><td colspan="3" style="padding:14px; text-align:center; color:#94a3b8; font-size:13px;">No se registraron compromisos formales adicionales.</td></tr>`;

  const dialogosHtml = dialogos
    .map((d, index) => {
      const isMario = d.hablante.toLowerCase().includes("mario");
      const badgeBg = isMario ? "#1368AA" : "#059669";
      const cardBorder = isMario ? "#e0f2fe" : "#ecfdf5";
      const cardBg = isMario ? "#f8fafc" : "#f0fdf4";

      return `
      <div style="margin-bottom:16px; page-break-inside:avoid; border:1px solid ${cardBorder}; background:${cardBg}; border-radius:14px; padding:14px 18px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; padding:3px 10px; background:${badgeBg}; color:#ffffff; border-radius:9999px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
              ${d.hablante}
            </span>
            ${d.rol ? `<span style="font-size:11px; color:#64748b;">• ${d.rol}</span>` : ""}
          </div>
          ${d.timestamp ? `<span style="font-size:11px; color:#94a3b8; font-family:monospace;">${d.timestamp}</span>` : ""}
        </div>

        <div style="font-size:14px; color:#1e293b; line-height:1.6; margin-bottom:${d.translatedText ? "8px" : "0"};">
          ${d.originalText}
        </div>

        ${
          d.translatedText
            ? `
          <div style="padding-top:8px; border-top:1px dashed #cbd5e1; font-size:13px; color:#475569; font-style:italic; line-height:1.5;">
            <span style="font-size:11px; font-weight:600; text-transform:uppercase; color:#0284c7; font-style:normal; margin-right:4px;">[Traducción Español]:</span>
            ${d.translatedText}
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acta de Reunión - ${cliente} (${fecha})</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
      padding-bottom: 60px;
    }

    /* BARRA SUPERIOR FIJA DE ACCIONES */
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .action-bar .brand-text {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-bar .btn-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn {
      padding: 7px 18px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 9999px;
      border: 1px solid transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .btn-pdf {
      background: #1368AA;
      color: #ffffff;
    }
    .btn-pdf:hover { background: #0f568d; }
    .btn-copy {
      background: #0f172a;
      color: #ffffff;
    }
    .btn-copy:hover { background: #334155; }

    /* CONTENEDOR PRINCIPAL TIPO HOJA EJECUTIVA */
    .document-page {
      max-width: 920px;
      margin: 30px auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06);
      padding: 48px 56px;
    }

    /* CABECERA CON LOGOS OFICIALES */
    .doc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 24px;
      margin-bottom: 28px;
      gap: 20px;
    }
    .logo-container {
      max-width: 190px;
      max-height: 48px;
      display: flex;
      align-items: center;
    }
    .logo-container svg {
      width: 100%;
      height: auto;
      max-height: 46px;
    }

    /* SECCIONES EDITORIALES */
    .section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #1368AA;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* FICHA TÉCNICA */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 22px;
      margin-bottom: 28px;
    }
    .meta-item .meta-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 2px;
    }
    .meta-item .meta-value {
      font-size: 13.5px;
      font-weight: 600;
      color: #0f172a;
    }

    /* CAJA DE RESUMEN EJECUTIVO */
    .summary-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 28px;
    }
    .summary-card ul {
      padding-left: 20px;
    }

    /* TABLA DE ACUERDOS */
    .table-container {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 32px;
    }
    .acuerdos-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .acuerdos-table th {
      background: #f8fafc;
      padding: 10px 14px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }

    /* ESTILOS DE IMPRESIÓN (PDF PERFECTO A4) */
    @media print {
      body { background: #ffffff; padding: 0; color: #000000; }
      .action-bar { display: none !important; }
      .document-page {
        border: none;
        box-shadow: none;
        margin: 0;
        padding: 0;
        max-width: 100%;
      }
      .summary-card, .meta-grid, .table-container {
        break-inside: avoid;
      }
      @page {
        size: A4;
        margin: 15mm 15mm 15mm 15mm;
      }
    }
  </style>
</head>
<body>

  <!-- BARRA DE ACCIÓN SUPERIOR (SOLO PANTALLA) -->
  <div class="action-bar">
    <div class="brand-text">
      <span style="display:inline-block; width:8px; height:8px; background:#10b981; border-radius:9999px;"></span>
      Acta Oficial B2B • ${cliente}
    </div>
    <div class="btn-group">
      <button onclick="window.print()" class="btn btn-pdf" title="Guardar como PDF o Imprimir en A4">
        🖨️ Guardar en PDF / Imprimir
      </button>
      <button id="btnCopiarResumen" onclick="copiarResumenGoogleDocs()" class="btn btn-copy" title="Copiar resumen y acuerdos en texto limpio para pegar en Google Docs o email">
        📋 Copiar para Google Docs
      </button>
    </div>
  </div>

  <!-- DOCUMENTO EJECUTIVO -->
  <div class="document-page" id="printable-content">

    <!-- CABECERA CON LOGOS OFICIALES -->
    <header class="doc-header">
      <div class="logo-container" title="Mario Mojica - FORM & FUTURE">
        ${logos.mmSvg}
      </div>
      <div style="text-align:right;">
        <h1 style="font-size:20px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:-0.5px;">Acta de Reunión B2B</h1>
        <p style="font-size:12px; font-weight:600; color:#64748b;">Minuta Ejecutiva & Registro Estratégico</p>
      </div>
      <div class="logo-container" style="justify-content:flex-end;" title="3dBimFab">
        ${logos.bfSvg}
      </div>
    </header>

    <!-- FICHA TÉCNICA DE LA SESIÓN -->
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Empresa / Interlocutor</div>
        <div class="meta-value">${cliente}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Asunto / Foco</div>
        <div class="meta-value">${asunto}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Fecha y Hora</div>
        <div class="meta-value">${fecha} • ${hora}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Duración Total</div>
        <div class="meta-value">${duracion}</div>
      </div>
      <div class="meta-item" style="grid-column: 1 / -1;">
        <div class="meta-label">Participantes Registrados</div>
        <div style="margin-top:6px;">${participantesBadges}</div>
      </div>
    </div>

    <!-- 1. RESUMEN EJECUTIVO -->
    <section style="margin-bottom:28px;">
      <h2 class="section-title">📌 1. Resumen Ejecutivo de la Sesión</h2>
      <div class="summary-card">
        <ul>${resumenHtml}</ul>
      </div>
    </section>

    <!-- 2. ACUERDOS Y PRÓXIMOS PASOS (TO-DO) -->
    <section style="margin-bottom:32px;">
      <h2 class="section-title">✅ 2. Acuerdos Pactados & Próximos Pasos (To-Do)</h2>
      <div class="table-container">
        <table class="acuerdos-table">
          <thead>
            <tr>
              <th>Compromiso / Tarea</th>
              <th style="width:180px;">Responsable</th>
              <th style="width:140px;">Plazo</th>
            </tr>
          </thead>
          <tbody>
            ${acuerdosHtml}
          </tbody>
        </table>
      </div>
    </section>

    <!-- 3. TRANSCRIPCIÓN BILINGÜE Y DIÁLOGO POR TURNOS -->
    <section>
      <h2 class="section-title">💬 3. Transcripción Bilingüe & Registro de Turnos</h2>
      <p style="font-size:12px; color:#64748b; margin-bottom:14px;">
        Registro cronológico de intervenciones con transcripción de voz y traducción simultánea al español.
      </p>
      <div>
        ${dialogosHtml}
      </div>
    </section>

    <!-- PIE DE PÁGINA FORMAL -->
    <footer style="margin-top:40px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#94a3b8;">
      <div>Acta generada automáticamente por <strong>Mario Mojica B2B Platform</strong></div>
      <div>Confidencial • Uso Interno y Comercial</div>
    </footer>

  </div>

  <!-- SCRIPT CLIENTE PARA COPIAR RESUMEN A GOOGLE DOCS O NOTAS -->
  <script>
    function copiarResumenGoogleDocs() {
      const resumenItems = Array.from(document.querySelectorAll('.summary-card ul li'))
        .map(li => "• " + li.innerText.trim())
        .join("\\n");

      const acuerdoRows = Array.from(document.querySelectorAll('.acuerdos-table tbody tr'))
        .map(tr => {
          const cols = tr.querySelectorAll('td');
          if (cols.length >= 3) {
            return "- " + cols[0].innerText.trim() + " (Responsable: " + cols[1].innerText.trim() + ", Plazo: " + cols[2].innerText.trim() + ")";
          }
          return "";
        })
        .filter(Boolean)
        .join("\\n");

      const texto = "ACTA DE REUNIÓN B2B - ${cliente}\\n" +
        "Fecha: ${fecha} | Asunto: ${asunto}\\n\\n" +
        "PUNTOS CLAVE TRATADOS:\\n" + resumenItems + "\\n\\n" +
        "ACUERDOS Y COMPROMISOS:\\n" + acuerdoRows;

      navigator.clipboard.writeText(texto).then(() => {
        const btn = document.getElementById("btnCopiarResumen");
        if (btn) {
          const original = btn.innerText;
          btn.innerText = "✅ ¡Copiado al Portapapeles!";
          setTimeout(() => { btn.innerText = original; }, 2500);
        }
      });
    }
  </script>
</body>
</html>`;
}

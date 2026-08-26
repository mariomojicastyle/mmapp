import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const { lang = "es", cliente = "Móveis Henn", summaryData, messages = [] } = await request.json();
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const isPt = lang === "pt";

    const html = `<!DOCTYPE html>
<html lang="${isPt ? 'pt-BR' : 'es'}">
<head>
  <meta charset="UTF-8">
  <title>${isPt ? 'Notas da Reunião' : 'Notas de la Reunión'} - ${cliente}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.45;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #0891B2;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-badge {
      background: #0891B2;
      color: #FFFFFF;
      font-weight: 900;
      font-size: 15px;
      padding: 8px 12px;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }
    .brand-text-title {
      font-size: 16px;
      font-weight: 900;
      color: #0F172A;
      margin: 0;
      letter-spacing: -0.2px;
    }
    .brand-text-sub {
      font-size: 10px;
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-type-badge {
      text-align: right;
    }
    .doc-title {
      font-size: 13px;
      font-weight: 800;
      color: #0891B2;
      margin: 0;
    }
    .doc-date {
      font-size: 10px;
      color: #64748B;
      margin-top: 2px;
    }
    .meta-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 10px;
    }
    .kpi-card.highlight {
      background: #ECFEFF;
      border-color: #A5F3FC;
    }
    .kpi-card.success {
      background: #ECFDF5;
      border-color: #A7F3D0;
    }
    .kpi-title { font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase; }
    .kpi-value { font-size: 17px; font-weight: 900; color: #0F172A; margin: 4px 0 2px; }
    .kpi-sub { font-size: 9.5px; color: #64748B; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 10px;
    }
    th {
      background: #F1F5F9;
      color: #0F172A;
      font-weight: 700;
      padding: 7px 8px;
      border: 1px solid #E2E8F0;
      text-align: left;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #E2E8F0;
      color: #334155;
    }
    .total-row {
      background: #F8FAFC;
      font-weight: 800;
      color: #0F172A;
    }
    .transcript-box {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px;
      background: #FAFAFA;
      margin-top: 14px;
    }
    .transcript-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 8px;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 4px;
    }
    .msg-item {
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #E2E8F0;
    }
    .msg-speaker { font-weight: bold; font-size: 10px; color: #0891B2; }
    .msg-text { font-size: 10.5px; color: #1E293B; margin-top: 2px; }
    .footer {
      margin-top: 20px;
      border-top: 1px solid #E2E8F0;
      padding-top: 8px;
      font-size: 9px;
      color: #94A3B8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-container">
      <div class="logo-badge">MM</div>
      <div>
        <div class="brand-text-title">MARIO MOJICA</div>
        <div class="brand-text-sub">Plataforma de Engenharia B2B & 3dBimFab</div>
      </div>
    </div>
    <div class="doc-type-badge">
      <div class="doc-title">${isPt ? 'Notas da Reunião Técnica' : 'Notas de la Reunión Técnica'}</div>
      <div class="doc-date">${dateStr} (${timeStr}) | ${cliente}</div>
    </div>
  </div>

  <div class="meta-box">
    <div><strong>${isPt ? 'Cliente:' : 'Cliente:'}</strong> ${cliente}</div>
    <div><strong>${isPt ? 'Participantes:' : 'Participantes:'}</strong> Marcos Unnass (P&D) & Mario Mojica (CEO)</div>
    <div><strong>${isPt ? 'Acordo Comercial:' : 'Acuerdo Comercial:'}</strong> 30% ${isPt ? 'Economia Garantida' : 'Ahorro Garantizado'}</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">${isPt ? 'Custo Atual Operação Henn' : 'Costo Actual Operación Henn'}</div>
      <div class="kpi-value">R$ ${Number(summaryData?.costoHennMes * 12 || 156000).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</div>
      <div class="kpi-sub">R$ ${Number(summaryData?.costoEstandarManualHenn || 780).toFixed(2)} ${isPt ? '/ manual padrão' : '/ manual estándar'}</div>
    </div>

    <div class="kpi-card highlight">
      <div class="kpi-title">${isPt ? 'Proposta Mario Mojica (-30%)' : 'Propuesta Mario Mojica (-30%)'}</div>
      <div class="kpi-value" style="color: #0891B2;">R$ ${Number(summaryData?.propuestaMarioMes * 12 || 109200).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</div>
      <div class="kpi-sub">R$ ${Number(summaryData?.costoEstandarManualMario || 546).toFixed(2)} ${isPt ? '/ manual com 3dBimFab' : '/ manual con 3dBimFab'}</div>
    </div>

    <div class="kpi-card success">
      <div class="kpi-title" style="color: #059669;">${isPt ? 'Economia Líquida Anual' : 'Ahorro Neto Anual'}</div>
      <div class="kpi-value" style="color: #059669;">+R$ ${Number(summaryData?.ahorroAnual || 46800).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</div>
      <div class="kpi-sub">${isPt ? 'Garantia direta para a diretoria' : 'Garantía directa para junta directiva'}</div>
    </div>
  </div>

  <h3 style="font-size: 11px; font-weight: 800; margin: 0 0 6px 0;">${isPt ? 'Matriz de Custos e Estrutura Operacional' : 'Matriz de Costos y Estructura Operacional'}</h3>
  <table>
    <thead>
      <tr>
        <th>${isPt ? 'Variável / Componente' : 'Variable / Componente'}</th>
        <th>${isPt ? 'Descrição' : 'Descripción'}</th>
        <th style="text-align: center;">${isPt ? 'Quantidade' : 'Cantidad'}</th>
        <th style="text-align: right;">${isPt ? 'Custo Unitário (R$)' : 'Costo Unitario (R$)'}</th>
        <th style="text-align: right;">${isPt ? 'Total Anual (R$)' : 'Total Anual (R$)'}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${isPt ? 'Mão de Obra P&D' : 'Mano de Obra P&D'}</strong></td>
        <td>${isPt ? 'Designers Técnicos CLT + Encargos' : 'Diseñadores Técnicos CLT + Cargas'}</td>
        <td style="text-align: center;">${summaryData?.items?.[0]?.cantidad || 2} ${isPt ? 'pessoas' : 'personas'}</td>
        <td style="text-align: right;">R$ ${Number(summaryData?.items?.[0]?.costoUnitario || 6000).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right; font-weight: bold;">R$ ${(Number(summaryData?.items?.[0]?.cantidad || 2) * Number(summaryData?.items?.[0]?.costoUnitario || 6000) * 12).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td><strong>${isPt ? 'Licenças de Software' : 'Licencias de Software'}</strong></td>
        <td>SketchUp Studio/Pro + Adobe Creative Cloud</td>
        <td style="text-align: center;">2 ${isPt ? 'estações' : 'estaciones'}</td>
        <td style="text-align: right;">R$ 6.000,00 /ano</td>
        <td style="text-align: right; font-weight: bold;">R$ 12.000,00</td>
      </tr>
      <tr>
        <td><strong>${isPt ? 'Volume de Manuais' : 'Volumen de Manuales'}</strong></td>
        <td>${isPt ? 'Lançamentos anuais de produtos' : 'Lanzamientos anuales de productos'}</td>
        <td style="text-align: center;">${summaryData?.items?.[1]?.cantidad || 200} ${isPt ? 'manuais/ano' : 'manuales/año'}</td>
        <td style="text-align: right;">${isPt ? 'Custo Padrão Médio:' : 'Costo Estándar Promedio:'}</td>
        <td style="text-align: right; font-weight: bold; color: #0891B2;">R$ ${Number(summaryData?.costoEstandarManualHenn || 780).toFixed(2)} ${isPt ? '/unid' : '/unid'}</td>
      </tr>
      <tr class="total-row">
        <td colspan="4" style="text-align: right;">${isPt ? 'TOTAL OPERAÇÃO ANUAL HENN:' : 'TOTAL OPERACIÓN ANUAL HENN:'}</td>
        <td style="text-align: right; color: #0F172A; font-size: 11px;">R$ ${Number(summaryData?.costoHennMes * 12 || 156000).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="total-row" style="background: #ECFEFF; color: #0891B2;">
        <td colspan="4" style="text-align: right;">${isPt ? 'PROPOSTA MARIO MOJICA (-30% ECONOMIA):' : 'PROPUESTA MARIO MOJICA (-30% AHORRO):'}</td>
        <td style="text-align: right; font-size: 11px;">R$ ${Number(summaryData?.propuestaMarioMes * 12 || 109200).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <div class="transcript-box">
    <div class="transcript-title">${isPt ? 'Registro da Conversa e Acordos da Sessão' : 'Registro de la Conversación y Acuerdos de la Sesión'}</div>
    ${messages.length > 0 ? messages.map((m: any) => `
      <div class="msg-item">
        <div class="msg-speaker">${m.speaker === 'mario' ? 'Mario Mojica:' : 'Marcos Unnass (Henn):'} <span style="font-size: 9px; color: #94A3B8; font-weight: normal;">[${new Date(m.timestamp).toLocaleTimeString()}]</span></div>
        <div class="msg-text">${isPt ? (m.fromLang === 'pt' ? m.originalText : m.translatedText) : (m.fromLang === 'es' ? m.originalText : m.translatedText)}</div>
      </div>
    `).join('') : `<div style="color: #64748B; font-style: italic;">${isPt ? 'Sessão focada na validação da tabela de custos.' : 'Sesión enfocada en la validación de la tabla de costos.'}</div>`}
  </div>

  <div class="footer">
    <div><strong>Mario Mojica</strong> | mariomojica.com | 3dBimFab Engine</div>
    <div>${isPt ? 'Documento Confidencial B2B' : 'Documento Confidencial B2B'} | ${dateStr}</div>
  </div>
</body>
</html>`;

    const tmpHtml = path.resolve('c:/Desarrollo/mmapp/temporal/notas_reunion_temp.html');
    const tmpPdf = path.resolve('c:/Desarrollo/mmapp/temporal/notas_reunion_temp.pdf');
    fs.writeFileSync(tmpHtml, html, 'utf8');

    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${tmpPdf}" --no-pdf-header-footer "${tmpHtml}"`;
    execSync(cmd, { stdio: 'pipe' });

    const pdfBuffer = fs.readFileSync(tmpPdf);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Notas_Reunion_${cliente.replace(/\s+/g, '_')}_${lang.toUpperCase()}_${dateStr}.pdf"`
      }
    });

  } catch (err: any) {
    console.error("Error generando PDF:", err);
    return NextResponse.json({ error: err.message || "Error al generar PDF" }, { status: 500 });
  }
}

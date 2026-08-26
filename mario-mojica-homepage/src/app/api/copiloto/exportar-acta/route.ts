import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { lang = "es", cliente = "Móveis Henn", summaryData, messages = [] } = await request.json();
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString();

    let content = "";

    if (lang === "pt") {
      // Acta en Portugués
      content = `# 📋 Ata Proativa de Reunião: Calibração de Custos e Alinhamento Técnico

> **Empresa:** ${cliente} (Mondaí, SC - Brasil)  
> **Participantes:** Marcos Unnass (Coordenador P&D), Mario Mojica (Engenharia de Software)  
> **Data e Hora:** ${dateStr} às ${timeStr}  
> **Garantia Comercial:** 30% de Economia Direta em P&D para a Diretoria  

---

## 📊 Matriz de Calibração de Custos P&D (Validada em Reunião)

| Item / Categoria | Descrição | Quantidade | Custo Unitário (R$) | Subtotal Mensal (R$) |
| :--- | :--- | :---: | ---: | ---: |
${(summaryData?.items || []).map((it: any) => `| ${it.categoria || 'Geral'} | ${it.descripcion || ''} | ${Number(it.cantidad || 0)} ${it.unidad || ''} | R$ ${Number(it.costoUnitario || 0).toFixed(2)} | R$ ${(Number(it.cantidad || 0) * Number(it.costoUnitario || 0)).toFixed(2)} |`).join("\n")}

### 💰 Resumo Financeiro Consolidado:
* **Custo Atual Interno da Henn:** R$ ${Number(summaryData?.costoHennMes || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / mês (R$ ${(Number(summaryData?.costoHennMes || 0) * 12).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / ano)
* **Proposta Mario Mojica (-30% Economia):** R$ ${Number(summaryData?.propuestaMarioMes || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / mês
* **Economia Líquida Anual Garantida para a Henn:** **+R$ ${Number(summaryData?.ahorroAnual || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / ano**

---

## 📝 Transcrição e Subtítulos da Sessão

${messages.length > 0 ? messages.map((m: any) => `* **[${new Date(m.timestamp).toLocaleTimeString()}] ${m.speaker === 'mario' ? 'Mario Mojica (ES)' : 'Móveis Henn (PT)'}:**\n  * *PT:* "${m.fromLang === 'pt' ? m.originalText : m.translatedText}"\n  * *ES:* "${m.fromLang === 'es' ? m.originalText : m.translatedText}"`).join("\n\n") : "*Sessão de trabalho focada na calibração da matriz de custos.*"}

---
*Gerado automaticamente pela Plataforma Mario Mojica & 3dBimFab.*
`;
    } else {
      // Acta en Español
      content = `# 📋 Acta Proactiva de Reunión: Calibración de Costos y Alineación Técnica

> **Empresa:** ${cliente} (Mondaí, SC - Brasil)  
> **Participantes:** Marcos Unnass (Coordinador P&D), Mario Mojica (Ingeniería y Desarrollo)  
> **Fecha y Hora:** ${dateStr} a las ${timeStr}  
> **Garantía Comercial:** 30% de Ahorro Directo en P&D para la Junta Directiva  

---

## 📊 Matriz de Calibración de Costos P&D (Validada en Sesión)

| Ítem / Categoría | Descripción | Cantidad | Costo Unitario (R$) | Subtotal Mensal (R$) |
| :--- | :--- | :---: | ---: | ---: |
${(summaryData?.items || []).map((it: any) => `| ${it.categoria || 'General'} | ${it.descripcion || ''} | ${Number(it.cantidad || 0)} ${it.unidad || ''} | R$ ${Number(it.costoUnitario || 0).toFixed(2)} | R$ ${(Number(it.cantidad || 0) * Number(it.costoUnitario || 0)).toFixed(2)} |`).join("\n")}

### 💰 Resumen Financiero Consolidado:
* **Costo Actual Interno Henn:** R$ ${Number(summaryData?.costoHennMes || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / mes (R$ ${(Number(summaryData?.costoHennMes || 0) * 12).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / año)
* **Propuesta Mario Mojica (-30% Ahorro):** R$ ${Number(summaryData?.propuestaMarioMes || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / mes
* **Ahorro Neto Anual Garantizado para Henn:** **+R$ ${Number(summaryData?.ahorroAnual || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / año**

---

## 📝 Transcripción y Subtítulos de la Sesión

${messages.length > 0 ? messages.map((m: any) => `* **[${new Date(m.timestamp).toLocaleTimeString()}] ${m.speaker === 'mario' ? 'Mario Mojica (ES)' : 'Móveis Henn (PT)'}:**\n  * *ES:* "${m.fromLang === 'es' ? m.originalText : m.translatedText}"\n  * *PT:* "${m.fromLang === 'pt' ? m.originalText : m.translatedText}"`).join("\n\n") : "*Sesión de trabajo enfocada en la calibración de la matriz de costos.*"}

---
*Generado automáticamente por la Plataforma Mario Mojica & 3dBimFab.*
`;
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="Ata_Reunion_${cliente.replace(/\s+/g, '_')}_${lang.toUpperCase()}_${dateStr}.md"`
      }
    });
  } catch (e: any) {
    console.error("Error exportando acta:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Error exportando acta" }, { status: 500 });
  }
}

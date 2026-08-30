import os
import subprocess
import shutil

html_pt = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ata de Reunião Técnica & Levantamento de Custos - Móveis Henn</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 10px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #0891B2;
      padding-bottom: 10px;
      margin-bottom: 10px;
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
      padding: 6px 11px;
      border-radius: 7px;
      letter-spacing: 0.5px;
    }
    .brand-text-title {
      font-size: 15px;
      font-weight: 900;
      color: #0F172A;
      margin: 0;
      letter-spacing: -0.2px;
    }
    .brand-text-sub {
      font-size: 9px;
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-type-badge {
      text-align: right;
    }
    .doc-title {
      font-size: 12px;
      font-weight: 800;
      color: #0891B2;
      margin: 0;
    }
    .doc-date {
      font-size: 9px;
      color: #64748B;
      margin-top: 2px;
    }
    .meta-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 7px 12px;
      margin-bottom: 10px;
      display: grid;
      grid-template-columns: 1.2fr 1.8fr 1fr;
      font-size: 9.5px;
      gap: 8px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .kpi-card {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 7px 10px;
    }
    .kpi-card.highlight {
      background: #ECFEFF;
      border-color: #A5F3FC;
    }
    .kpi-card.success {
      background: #ECFDF5;
      border-color: #A7F3D0;
    }
    .kpi-title { font-size: 8.5px; font-weight: bold; color: #64748B; text-transform: uppercase; }
    .kpi-value { font-size: 15px; font-weight: 900; color: #0F172A; margin: 2px 0 1px; }
    .kpi-sub { font-size: 8.5px; color: #64748B; }
    
    h3 {
      font-size: 10.5px;
      font-weight: 800;
      color: #0F172A;
      margin: 8px 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border-left: 3px solid #0891B2;
      padding-left: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 9px;
    }
    th {
      background: #F1F5F9;
      color: #0F172A;
      font-weight: 700;
      padding: 4px 6px;
      border: 1px solid #E2E8F0;
      text-align: left;
    }
    td {
      padding: 3.5px 6px;
      border: 1px solid #E2E8F0;
      color: #334155;
    }
    .total-row {
      background: #F8FAFC;
      font-weight: 800;
      color: #0F172A;
    }
    .box-container {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 7px 10px;
      margin-bottom: 8px;
    }
    .box-title {
      font-weight: 800;
      color: #0891B2;
      font-size: 9.5px;
      margin-bottom: 3px;
    }
    .box-text {
      font-size: 9px;
      color: #334155;
      margin: 0 0 3px 0;
    }
    ul {
      margin: 2px 0 4px 14px;
      padding: 0;
    }
    li {
      margin-bottom: 2px;
      font-size: 9px;
      color: #334155;
    }
    .footer {
      margin-top: 8px;
      border-top: 1px solid #E2E8F0;
      padding-top: 5px;
      font-size: 8px;
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
      <div class="doc-title">Ata de Reunião & Proposta Técnica</div>
      <div class="doc-date">28 de Agosto de 2026 | Móveis Henn (Mondaí, SC)</div>
    </div>
  </div>

  <div class="meta-box">
    <div><strong>Cliente:</strong> Móveis Henn (P&D / Engenharia)</div>
    <div><strong>Participantes:</strong> Marcos Unnass (P&D) & Mario Mojica (CEO)</div>
    <div><strong>Objetivo:</strong> Validação de Custos & Piloto 3D</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Custo Atual Operação Henn</div>
      <div class="kpi-value">R$ 154.090,91</div>
      <div class="kpi-sub">Média: R$ 1.926,14 / manual (80 manuais/ano)</div>
    </div>

    <div class="kpi-card highlight">
      <div class="kpi-title">Proposta Mario Mojica (-30%)</div>
      <div class="kpi-value" style="color: #0891B2;">R$ 107.863,64</div>
      <div class="kpi-sub">R$ 1.348,30 / manual 3D interativo + QR</div>
    </div>

    <div class="kpi-card success">
      <div class="kpi-title" style="color: #059669;">Economia Líquida Anual</div>
      <div class="kpi-value" style="color: #059669;">+R$ 46.227,27</div>
      <div class="kpi-sub">Economia de +R$ 577,84 por cada produto</div>
    </div>
  </div>

  <h3>1. Matriz de Custos Auditada de P&D (Base 80 Manuais/Ano)</h3>
  <table>
    <thead>
      <tr>
        <th>Item / Recurso</th>
        <th>Detalhamento da Operação Henn</th>
        <th style="text-align: center;">Qtd</th>
        <th style="text-align: right;">Custo Unitário (R$)</th>
        <th style="text-align: right;">Total Anual (R$)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Equipe de P&D</strong></td>
        <td>Projetistas Técnicos CLT + Encargos Sociais</td>
        <td style="text-align: center;">2 pessoas</td>
        <td style="text-align: right;">R$ 6.000,00 /mês</td>
        <td style="text-align: right; font-weight: bold;">R$ 144.000,00</td>
      </tr>
      <tr>
        <td><strong>Software 3D</strong></td>
        <td>Licenças Anuais SketchUp Pro / Studio</td>
        <td style="text-align: center;">2 licenças</td>
        <td style="text-align: right;">R$ 1.200,00 /ano</td>
        <td style="text-align: right;">R$ 2.400,00</td>
      </tr>
      <tr>
        <td><strong>Software 2D</strong></td>
        <td>Licenças Anuais Adobe CC / InDesign</td>
        <td style="text-align: center;">2 licenças</td>
        <td style="text-align: right;">R$ 1.800,00 /ano</td>
        <td style="text-align: right;">R$ 3.600,00</td>
      </tr>
      <tr>
        <td><strong>Suporte & SAC</strong></td>
        <td>Correções técnicas e retrabalho de montagem</td>
        <td style="text-align: center;">10 h/mês</td>
        <td style="text-align: right;">R$ 34,09 /hora</td>
        <td style="text-align: right;">R$ 4.090,91</td>
      </tr>
      <tr class="total-row">
        <td colspan="4" style="text-align: right;">TOTAL CUSTO ANUAL ATUAL DA HENN:</td>
        <td style="text-align: right; font-size: 10px;">R$ 154.090,91</td>
      </tr>
      <tr class="total-row" style="background: #ECFEFF; color: #0891B2;">
        <td colspan="4" style="text-align: right;">PROPOSTA MARIO MOJICA (-30% ECONOMIA GARANTIDA):</td>
        <td style="text-align: right; font-size: 10px;">R$ 107.863,64</td>
      </tr>
    </tbody>
  </table>

  <h3>2. Tabela Ponderada por Complexidade de Produto</h3>
  <table>
    <thead>
      <tr>
        <th>Faixa de Peças / Categoria</th>
        <th style="text-align: center;">Fator</th>
        <th style="text-align: right;">Custo Henn Atual</th>
        <th style="text-align: right;">Proposta Mario (-30%)</th>
        <th style="text-align: right;">Economia Henn</th>
        <th>Exemplos no Catálogo Henn</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Pequeno:</strong> Até 10 peças (~1 dia)</td>
        <td style="text-align: center;">0.65x</td>
        <td style="text-align: right;">R$ 1.251,99</td>
        <td style="text-align: right; font-weight: bold; color: #0891B2;">R$ 876,39</td>
        <td style="text-align: right; color: #059669;">+R$ 375,60</td>
        <td>Criado-mudo, nichos, painéis simples</td>
      </tr>
      <tr style="background: #F0FDFA;">
        <td><strong>Médio:</strong> 11 a 24 peças (~1.5 dias / Média Henn)</td>
        <td style="text-align: center;">1.00x</td>
        <td style="text-align: right;">R$ 1.926,14</td>
        <td style="text-align: right; font-weight: bold; color: #0891B2;">R$ 1.348,30</td>
        <td style="text-align: right; color: #059669;">+R$ 577,84</td>
        <td><strong>Cômoda Ravena</strong>, racks, buffets</td>
      </tr>
      <tr>
        <td><strong>Grande:</strong> 25 a 40 peças (~2 dias)</td>
        <td style="text-align: center;">1.35x</td>
        <td style="text-align: right;">R$ 2.600,28</td>
        <td style="text-align: right; font-weight: bold; color: #0891B2;">R$ 1.820,20</td>
        <td style="text-align: right; color: #059669;">+R$ 780,09</td>
        <td>Roupeiro 6 portas, cozinhas moduladas</td>
      </tr>
    </tbody>
  </table>

  <h3>3. Diagnóstico Técnico: Gargalo Promob ➔ SketchUp e Solução 3dBimFab</h3>
  <div class="box-container">
    <div class="box-title">🚨 O Gargalo Atual Identificado:</div>
    <div class="box-text">
      O Promob torna-se excessivamente lento quando são inseridas ferragens menores (cantoneiras, pregos de fundo, parafusos secundários). Por essa razão, a engenharia da Henn omite até 15% das ferragens no Promob e finaliza no SketchUp e InDesign, gerando contagem manual humana e risco de divergência na lista de materiais (BOM).
    </div>
    <div class="box-title" style="margin-top: 5px;">💡 A Solução Paramétrica com 3dBimFab & Análise Estrutural (Mario Mojica):</div>
    <div class="box-text">
      Mario Mojica esclareceu que produtos com mais de 40 peças (ex: ripados e molduras) possuem peças idênticas de montagem simples, as quais o <strong>3dBimFab</strong> gerencia por <em>instâncias paramétricas</em> sem inflacionar o custo. O motor conta 10.000 peças em microssegundos sem sobrecarregar o 3D Web, garantindo um <strong>Gêmeo Digital 100% exato</strong>, sem contagem manual e com posse perpétua dos arquivos para a Móveis Henn.
    </div>
  </div>

  <h3>4. Próximos Passos & Cronograma Oficial</h3>
  <ul>
    <li><strong>Envio de Arquivos Cômoda Ravena:</strong> Marcos enviará os arquivos DWG, SketchUp (com explosões) e InDesign para modelagem 3D.</li>
    <li><strong>Alinhamento com Marketing:</strong> Marcos conversará com a equipe de Marketing (responsável pelos vídeos de montagem no showroom) para integrar os manuais 3D à estratégia visual junto à diretoria (Rudgeri Henkel).</li>
    <li><strong>Férias de Marcos:</strong> 03 a 11 de Setembro de 2026.</li>
    <li><strong>Desenvolvimento do Piloto:</strong> Mario Mojica configurará o modelo 3dBimFab e o Manual 3D Interativo com assistência por voz.</li>
    <li><strong>Apresentação em Tempo Real (Pós 15 de Setembro):</strong> Reunião ao vivo com Marcos Unnass, Jonas Borck e um especialista da <strong>área de Sistemas/TI da Henn</strong> para validação técnica e início do <strong>Piloto de 3 meses</strong>.</li>
  </ul>

  <div class="footer">
    <div><strong>Mario Mojica</strong> | mariomojica.com | 3dBimFab Engine</div>
    <div>Documento Técnico Confidencial B2B | Móveis Henn | 28/08/2026</div>
  </div>
</body>
</html>"""

html_es = html_pt.replace('lang="pt-BR"', 'lang="es"') \
    .replace('Ata de Reunião Técnica & Levantamento de Custos - Móveis Henn', 'Acta de Reunión Técnica & Levantamiento de Costos - Móveis Henn') \
    .replace('Plataforma de Engenharia B2B', 'Plataforma de Ingeniería B2B') \
    .replace('Ata de Reunião & Proposta Técnica', 'Acta de Reunión & Propuesta Técnica') \
    .replace('Validação de Custos & Piloto 3D', 'Validación de Costos & Piloto 3D') \
    .replace('Custo Atual Operação Henn', 'Costo Actual Operación Henn') \
    .replace('Proposta Mario Mojica (-30%)', 'Propuesta Mario Mojica (-30%)') \
    .replace('Economia Líquida Anual', 'Ahorro Neto Anual') \
    .replace('Economia de +R$ 577,84 por cada produto', 'Ahorro de +R$ 577,84 por cada producto') \
    .replace('1. Matriz de Custos Auditada de P&D (Base 80 Manuais/Ano)', '1. Matriz de Costos Auditada de P&D (Base 80 Manuales/Año)') \
    .replace('Item / Recurso', 'Ítem / Recurso') \
    .replace('Detalhamento da Operação Henn', 'Detalle de la Operación Henn') \
    .replace('Qtd', 'Cant') \
    .replace('Custo Unitário (R$)', 'Costo Unitario (R$)') \
    .replace('Equipe de P&D', 'Equipo de P&D') \
    .replace('Projetistas Técnicos CLT + Encargos Sociais', 'Proyectistas Técnicos CLT + Cargas Sociales') \
    .replace('2 pessoas', '2 personas') \
    .replace('Software 3D', 'Software 3D') \
    .replace('Licenças Anuais SketchUp Pro / Studio', 'Licencias Anuales SketchUp Pro / Studio') \
    .replace('2 licenças', '2 licencias') \
    .replace('Software 2D', 'Software 2D') \
    .replace('Licenças Anuais Adobe CC / InDesign', 'Licencias Anuales Adobe CC / InDesign') \
    .replace('Suporte & SAC', 'Soporte & SAC') \
    .replace('Correções técnicas e retrabalho de montagem', 'Correcciones técnicas y retrabajo de ensamble') \
    .replace('TOTAL CUSTO ANUAL ATUAL DA HENN:', 'TOTAL COSTO ANUAL ACTUAL DE HENN:') \
    .replace('PROPOSTA MARIO MOJICA (-30% ECONOMIA GARANTIDA):', 'PROPUESTA MARIO MOJICA (-30% AHORRO GARANTIZADO):') \
    .replace('2. Tabela Ponderada por Complexidade de Produto', '2. Tabla Ponderada por Complejidad de Producto') \
    .replace('Faixa de Peças / Categoria', 'Rango de Piezas / Categoría') \
    .replace('Fator', 'Factor') \
    .replace('Custo Henn Atual', 'Costo Henn Actual') \
    .replace('Proposta Mario (-30%)', 'Propuesta Mario (-30%)') \
    .replace('Economia Henn', 'Ahorro Henn') \
    .replace('Exemplos no Catálogo Henn', 'Ejemplos en Catálogo Henn') \
    .replace('Pequeno:', 'Pequeño:') \
    .replace('Até 10 peças', 'Hasta 10 piezas') \
    .replace('Criado-mudo, nichos, painéis simples', 'Mesas de noche, nichos, paneles simples') \
    .replace('Médio:', 'Mediano:') \
    .replace('11 a 24 peças (~1.5 dias / Média Henn)', '11 a 24 piezas (~1.5 días / Promedio Henn)') \
    .replace('Cômoda Ravena', 'Cómoda Ravena') \
    .replace('Roupeiro 6 portas, cozinhas moduladas', 'Ropero 6 puertas, cocinas moduladas') \
    .replace('3. Diagnóstico Técnico: Gargalo Promob ➔ SketchUp e Solução 3dBimFab', '3. Diagnóstico Técnico: Cuello de Botella Promob ➔ SketchUp y Solución 3dBimFab') \
    .replace('🚨 O Gargalo Atual Identificado:', '🚨 El Cuello de Botella Actual Identificado:') \
    .replace('O Promob torna-se excessivamente lento quando são inseridas ferragens menores (cantoneiras, pregos de fundo, parafusos secundários). Por essa razão, a engenharia da Henn omite até 15% das ferragens no Promob e finaliza no SketchUp e InDesign, gerando contagem manual humana e risco de divergência na lista de materiais (BOM).', 'Promob se vuelve excesivamente lento cuando se insertan herrajes menores (cantoneras, puntillas de espaldar, tornillos secundarios). Por esta razón, la ingeniería de Henn omite hasta un 15% de los herrajes en Promob y finaliza en SketchUp e InDesign, generando conteo manual humano y riesgo de discrepancias en la lista de materiales (BOM).') \
    .replace('💡 A Solução Paramétrica com 3dBimFab:', '💡 La Solución Paramétrica con 3dBimFab:') \
    .replace('O <strong>3dBimFab</strong> trabalha com <em>instâncias geométricas leves e algoritmos paramétricos</em> (ex: cálculo matemático de cantoneiras e pregos a cada 10 cm). Conta 10.000 peças em microssegundos sem sobrecarregar o modelo 3D, garantindo um <strong>Gêmeo Digital 100% exato</strong>, sem contagem manual e com propriedade total perpétua dos arquivos para a Móveis Henn.', '<strong>3dBimFab</strong> trabaja con <em>instancias geométricas ligeras y algoritmos paramétricos</em> (ej: cálculo matemático de cantoneras y puntillas cada 10 cm). Cuenta 10.000 piezas en microsegundos sin sobrecargar el modelo 3D, garantizando un <strong>Gemelo Digital 100% exacto</strong>, sin conteo manual y con propiedad total perpetua de los archivos para Móveis Henn.') \
    .replace('4. Próximos Passos & Cronograma Oficial', '4. Próximos Pasos & Cronograma Oficial') \
    .replace('Envio de Arquivos Cômoda Ravena:', 'Envío de Archivos Cómoda Ravena:') \
    .replace('Marcos enviará os arquivos DWG, SketchUp (com explosões) e InDesign para modelagem 3D.', 'Marcos enviará los archivos DWG, SketchUp (con explosiones) e InDesign para modelado 3D.') \
    .replace('Férias de Marcos:', 'Vacaciones de Marcos:') \
    .replace('Desenvolvimento do Piloto:', 'Desarrollo del Piloto:') \
    .replace('Mario Mojica configurará o modelo 3dBimFab e o Manual 3D Interativo com assistência por voz.', 'Mario Mojica configurará el modelo 3dBimFab y el Manual 3D Interactivo con asistencia por voz.') \
    .replace('Apresentação em Tempo Real (Pós 15 de Setembro):', 'Presentación en Tiempo Real (Post 15 de Septiembre):') \
    .replace('Reunião ao vivo com Marcos Unnass, Jonas Borck e a equipe de TI/Sistemas da Henn para validação prática e início do <strong>Piloto de 3 meses</strong>.', 'Reunión en vivo con Marcos Unnass, Jonas Borck y el equipo de TI/Sistemas de Henn para validación práctica e inicio del <strong>Piloto de 3 meses</strong>.') \
    .replace('Documento Técnico Confidencial B2B', 'Documento Técnico Confidencial B2B')

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

# Escribir HTMLs temporales
tmp_html_pt = r'c:\Desarrollo\mmapp\temporal\Ata_Reuniao_Henn_Custos_PT.html'
tmp_html_es = r'c:\Desarrollo\mmapp\temporal\Ata_Reuniao_Henn_Custos_ES.html'

with open(tmp_html_pt, 'w', encoding='utf-8') as f:
    f.write(html_pt)
with open(tmp_html_es, 'w', encoding='utf-8') as f:
    f.write(html_es)

pdf_pt_dest1 = r'c:\Desarrollo\mmapp\Clientes\Henn\reuniones\Ata_Reuniao_Henn_Custos_2026-08-28_PT.pdf'
pdf_es_dest1 = r'c:\Desarrollo\mmapp\Clientes\Henn\reuniones\Ata_Reuniao_Henn_Custos_2026-08-28_ES.pdf'

pdf_pt_dest2 = r'c:\Desarrollo\mmapp\Clientes\Henn\Ata_Reuniao_Henn_Custos_2026-08-28_PT.pdf'
pdf_es_dest2 = r'c:\Desarrollo\mmapp\Clientes\Henn\Ata_Reuniao_Henn_Custos_2026-08-28_ES.pdf'

cmd_pt = f'"{edge_path}" --headless --disable-gpu --print-to-pdf="{pdf_pt_dest1}" --no-pdf-header-footer "{tmp_html_pt}"'
cmd_es = f'"{edge_path}" --headless --disable-gpu --print-to-pdf="{pdf_es_dest1}" --no-pdf-header-footer "{tmp_html_es}"'

subprocess.run(cmd_pt, shell=True, check=True)
subprocess.run(cmd_es, shell=True, check=True)

# Copiar a raiz de Clientes/Henn/
shutil.copy2(pdf_pt_dest1, pdf_pt_dest2)
shutil.copy2(pdf_es_dest1, pdf_es_dest2)

print('Generated and saved all PDF files successfully!')

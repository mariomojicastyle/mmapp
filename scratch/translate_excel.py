import openpyxl

def translate_excel():
    file_path = r"C:\Desarrollo\mmapp\temporal\Calculadora_Costos_Henn.xlsx"
    wb = openpyxl.load_workbook(file_path)
    ws = wb.active

    # Diccionario de traducción por coordenadas de celda
    translations = {
        # Fila 1
        "A1": "CALCULADORA DE CUSTOS - MANUAL DE MONTAGEM E ECONOMIA DE 30% - HENN",
        # Fila 3 (Encabezados)
        "A3": "Variável / Pergunta",
        "B3": "Valor",
        "C3": "Unidade",
        "D3": "Fórmula / Notas",
        # Fila 4 (Sección 1)
        "A4": "1. Dados de Pessoal e Salários (P&D)",
        "A5": "Nº de pessoas no P&D dedicadas a manuais",
        "C5": "Pessoas",
        "D5": "Dado inserido",
        "A6": "Salário mensal médio + encargos sociais (CLT)",
        "C6": "R$ / mês",
        "D6": "Estimativa Bento Gonçalves (R$ 3.800 + encargos)",
        "A7": "Horas de trabalho mensais por pessoa",
        "C7": "Horas/mês",
        "D7": "44h/semana x 4 semanas",
        "A8": "Custo Hora / Homem (P&D)",
        "C8": "R$ / hora",
        # Fila 10 (Sección 2)
        "A10": "2. Volume Mensal de Lançamentos por Complexidade",
        "A11": "Manuais Pequenos (< 10 peças do móvel)",
        "C11": "Manuais",
        "D11": "1 dia (8h) por manual",
        "A12": "Manuais Médios (11 a 25 peças do móvel)",
        "C12": "Manuais",
        "D12": "1.5 dias (12h) por manual",
        "A13": "Manuais Grandes (26 a 40 peças do móvel)",
        "C13": "Manuais",
        "D13": "2 dias (16h) por manual",
        "A14": "Total de Novos Manuais por Mês",
        "C14": "Manuais",
        # Fila 16 (Sección 3)
        "A16": "3. Total de Horas Investidas em manuais por Mês",
        "A17": "Horas em Manuais Pequenos",
        "C17": "Horas",
        "A18": "Horas em Manuais Médios",
        "C18": "Horas",
        "A19": "Horas em Manuais Grandes",
        "C19": "Horas",
        "A20": "Total de Horas Investidas por Mês",
        "C20": "Horas",
        "D20": "Soma B17:B19 (Equivale a >1 designer)",
        # Fila 22 (Sección 4)
        "A22": "4. Custos Internos Estimados da Henn (Manual Impresso)",
        "A23": "Custo Interno Mensal da Henn",
        "D23": "B20*B8 (Custo total em tempo de P&D)",
        "A24": "Custo Interno Médio por Manual",
        "C24": "R$ / manual",
        # Fila 26 (Sección 5)
        "A26": "5. Proposta Comercial Mario Mojica (Ganha-Ganha com 30% de Economia)",
        "A27": "Proposta Mario Mojica (30% de Economia Garantida)",
        "C27": "R$ / mês",
        "D27": "B23*0.70 (Tarifa mensal sugerida)",
        "A28": "Economia Líquida Mensal para a Henn",
        "C28": "R$ / mês",
        "D28": "B23-B27 (Economia direta por mês)",
        "A29": "Economia Anual Garantida para a Henn",
        "C29": "R$ / ano",
        "D29": "B28*12 (Economia anual acumulada)"
    }

    for coord, text in translations.items():
        ws[coord] = text

    wb.save(file_path)
    print("Calculadora de Costos traducida con éxito al portugués y guardada en temporal/Calculadora_Costos_Henn.xlsx")

if __name__ == "__main__":
    translate_excel()

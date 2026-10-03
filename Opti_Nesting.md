# 📐 Opti_Nesting: Motor Paramétrico de Nesting & Optimización de Corte Industrial (`3dBimFab`)

> **Ubicación Canónica de Ingeniería:** Este archivo se gestiona y actualiza centralizadamente en **[`3BF/Opti_Nesting.md`](file:///c:/Desarrollo/mmapp/3BF/Opti_Nesting.md)**.
> 
> **Pestaña de Acceso en la Web App:** `[ ✂️ Optimización ]` en la barra superior de navegación de `3bf/app/page.tsx`.

---

## 🧭 Resumen de Acceso Rápido

Para consultar la especificación completa, arquitectura de la Tríada de Corte, formulaciones matemáticas de Guillotina, Nesting CNC Morbidelli X200 y Pies Tablares (PT) para Madera Maciza, remítase al documento maestro:

👉 **[Ver Documentación Completa en 3BF/Opti_Nesting.md](file:///c:/Desarrollo/mmapp/3BF/Opti_Nesting.md)**

### 🧩 La Tríada de Modos de Corte:
1. **Modo 1: Seccionadora Industrial (Corte Guillotina Ortogonal)**:
   - Máquinas: Sierras horizontales (Biesse Selco / Homag SAWTEQ / Giben).
   - Cortes continuos de lado a lado en tableros MDP/MDF ($2440 \times 1830\text{ mm}$), con kerf de 3.2 a 4.4 mm y respeto estricto del sentido de veta.
2. **Modo 2: Celda Nesting CNC (SCM Morbidelli X200 / Rover B FT)**:
   - Máquinas: Centros de mecanizado CNC con mesa de vacío y tablero de sacrificio.
   - Proceso en 1 solo ciclo continuo: Taladrado vertical de barrenos + Ranurado + Fresado perimetral con fresa helicoidal de compresión (10-12 mm). Puentes de sujeción (*onion skin*) para piezas pequeñas.
3. **Modo 3: Madera Maciza & Ebanistería (CILA Jamar / Sillas y Comedores)**:
   - Material: Tablones y listones de madera natural con anchos y largos variables.
   - Estrategias de aserrado: *Rip-First* vs *Crosscut-First*. True Shape Nesting en cuñas contrapuestas para siluetas curvas (patas y copetes de sillas).
   - Cubicación y rendimiento en **Pies Tablares (PT)**:
     $$\text{PT} = \frac{\text{Espesor (pulg)} \times \text{Ancho (pulg)} \times \text{Largo (pies)}}{12} = \frac{E(\text{cm}) \times A(\text{cm}) \times L(\text{m}) \times 0.424}{100}$$

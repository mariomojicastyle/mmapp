---
name: cinematica-rhino-threejs
description: Puente mental y matemático canónico entre el sistema CAD/CNC de taller (Rhino/Grasshopper Z-Up) y el motor WebGL (Three.js Y-Up). Resuelve transformaciones del banco de trabajo, emparentamiento rígido y vectores de aproximación a cantos y caras en animaciones 3D.
---

# 🧭 Cinemática Rhino ➔ Three.js: Puente Mental y Matemático Canónico

## 1. El Conflicto Fundamental de Sistemas de Coordenadas

| Sistema | Eje X | Eje Y | Eje Z | Uso / Ámbito |
| :--- | :--- | :--- | :--- | :--- |
| **Rhino / Grasshopper / CNC** | Ancho (Horizontal) | **Profundidad / Longitud del banco (Plano de corte)** | **Altura Vertical (Perpendicular a la mesa)** | Taller, diseño RTA, fresadoras CNC, DfMA. |
| **Three.js / WebGL** | Ancho (Horizontal) | **Altura Vertical (Cielo / Perpendicular al piso)** | **Profundidad / Fondo de la escena** | Visor 3D Web, Canvas, shaders, cámaras. |

> [!IMPORTANT]
> **Regla de Oro de Interpretación del Usuario:**
> El usuario piensa, habla y diseña siempre en el marco mental de **Rhino/CNC (Z-Up)**.
> Cuando el usuario mencione:
> - *"Se mueve en Y"* $\to$ Se refiere al **eje longitudinal de la mesa/tablero** (Eje **Z** en Three.js).
> - *"Se mueve en Z"* $\to$ Se refiere a la **altura vertical perpendicular a la tabla** (Eje **Y** en Three.js).
> - *"Se mueve en X"* $\to$ Se refiere al **ancho transversal** (Eje **X** en Three.js).
> **PROHIBIDO** pedirle al usuario que cambie su vocabulario o traduzca a Three.js. El agente debe aplicar esta equivalencia de forma silenciosa e instantánea.

---

## 2. Matriz de Coherencia en el Banco de Trabajo (`workbenchTransform`)

Cuando un lateral o tablero de mueble se coloca en el banco de trabajo (`apoyoEnPiso: true`, `acostado: true`):
1. **Espesor del Tablero ($\sim 12\text{ mm} - 18\text{ mm}$):**
   - Queda acostado sobre el piso $Y_{\text{Three}} = 0$.
   - La altura vertical en Three.js abarca $Y \in [0, \text{espesor}]$.
   - El plano medio del canto queda exactamente en $Y_{\text{canto}} = \text{espesor} / 2$.
2. **Largo del Tablero ($\sim 700\text{ mm} - 900\text{ mm}$):**
   - Queda orientado a lo largo del eje **X** de Three.js (de izquierda a derecha).
3. **Profundidad / Ancho del Tablero ($\sim 400\text{ mm} - 500\text{ mm}$):**
   - Queda orientado a lo largo del eje **Z** de Three.js (de frente al fondo de la pantalla).
   - **Borde Superior (Fondo):** $Z < Z_{\text{centro}}$ (coordenada $Z$ más negativa).
   - **Borde Inferior (Frente):** $Z > Z_{\text{centro}}$ (coordenada $Z$ más positiva).

---

## 3. Direcciones Vectoriales de Tarugos (Cavilhas) en Cantos

Para tarugos y pernos que se insertan en los orificios del **canto** del tablero acostado:
- **$\Delta X = 0$**: Inmutable en X, alineado al orificio.
- **$\Delta Y = 0$ (en Three.js)**: Inmutable en altura vertical, exactamente en $Y_{\text{canto}}$.
- **Movimiento longitudinal puro en Z (Three.js) / Y (Taller):**
  - **Canto Superior (Fondo): Dirección Y1 $\to$ Y0:**
    $$\vec{P}_{\text{aparición}} = \left(P_{\text{final}}.x,\; P_{\text{final}}.y,\; P_{\text{final}}.z - 0.20\text{m}\right)$$
    Avanza hacia $+Z$ (hacia adelante) ingresando colinealmente al barreno.
  - **Canto Inferior (Frente): Dirección Y0 $\to$ Y1:**
    $$\vec{P}_{\text{aparición}} = \left(P_{\text{final}}.x,\; P_{\text{final}}.y,\; P_{\text{final}}.z + 0.20\text{m}\right)$$
    Avanza hacia $-Z$ (hacia atrás) ingresando colinealmente al barreno.

---

## 4. Emparentamiento Rígido de Matrices ($T_{\text{rel}}$)

Para evitar desalineaciones o desfases al girar la madera ($180^\circ$ en subbloques de doble cara):
$$\mathbf{T}_{\text{rel}} = \mathbf{W}_{0,\text{madera}}^{-1} \cdot \mathbf{W}_{0,\text{herraje}}$$
En cualquier instante $t$ de la cinemática:
$$\mathbf{W}_{\text{herraje}}(t) = \mathbf{W}_{\text{madera}}(t) \cdot \mathbf{T}_{\text{rel}}$$
Esto garantiza que la posición y orientación relativa entre la superficie del tablero y los herrajes (correderas, tornillos, tarugos) sea **idéntica e inmutable** en todo momento.

---

## 5. Muestreo de Arco Circular (Anti-Clavado)

Al animar un giro angular $\Delta \theta = 180^\circ$ de una pieza:
- **El error de interpolación lineal cartesiana (LERP):** Produce un acortamiento radial de hasta $29.3\%$ ($\Delta R \approx 7.3\text{ cm}$), clavando los herrajes a través del tablero.
- **Protocolo Canónico:** Muestrear el lapso del giro en $N = 24$ intervalos equiespaciados ($\Delta \theta = 7.5^\circ$):
  $$Q(t_i) = \text{Quaternion}(\text{ejeVolteo}, u \cdot \pi) \cdot Q_{\text{base}}$$
  $$\mathbf{W}(t_i) = \text{Matrix4().compose}(P(t_i), Q(t_i), \mathbf{1})$$
  $$\mathbf{W}_{\text{herraje}}(t_i) = \mathbf{W}(t_i) \cdot \mathbf{T}_{\text{rel}}$$
  Reduce el error de cuerda a menos de **$0.5\text{ mm}$**, logrando deslizamiento tangencial perfecto.

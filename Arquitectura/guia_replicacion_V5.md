# 🏛️ Arquitectura del Sistema: V5 AI-Driven Automation (marzo 2026)

## 🎯 Objetivo de la Versión
Integrar una capa de Inteligencia Artificial capaz de gestionar, monitorizar y expandir de forma autónoma los flujos de trabajo en n8n, garantizando la estabilidad y la escalabilidad del sistema B2B.

## 🏗️ Diagrama de Flujo (Lógica IA)

[Frontend: Next.js] <--- (Webhooks) ---> [VPS: n8n + Baserow]
                                          ^
                                          |
                                     (API JSON / MCP)
                                          |
                          +-----------------------------------+
                          |     🤖 AGENTE IA (Antigravity)     |
                          |-----------------------------------|
                          | - n8n-MCP Server (Conexión)        |
                          | - n8n-Skills (7 Habilidades Exp.) |
                          | - AGENTS.md (Reglas de Operación) |
                          +-----------------------------------+

## 🛠️ Stack Tecnológico (Nueva Capa)

1. **Protocolo:** MCP (Model Context Protocol).
2. **Servidor:** `n8n-mcp` (Node.js).
3. **Biblioteca de Conocimiento:** `n8n-skills` (Expresiones, Patrones, Validación).
4. **Control de Calidad:** `validate_node` y `validate_workflow` vía MCP.

## 🚀 Pasos de Replicación para el Agente

1. **Instalación Global:**
   ```bash
   npm install -g n8n-mcp
   ```

2. **Configuración de Antigravity:**
   Editar `mcp_config.json` en el directorio de la IA para incluir `n8n-mcp` con la `N8N_API_KEY` del VPS.

3. **Carga de Habilidades:**
   Clonar `czlonkowski/n8n-skills` y mover las carpetas a `.agent/skills/`.

4. **Instrucciones de Gobernanza:**
   Crear `AGENTS.md` basado en el estándar de `czlonkowski` para evitar alucinaciones en los flujos.

## 🛡️ Variables de Entorno Requeridas

- `N8N_API_URL`: Dirección de la API del VPS (ej. `https://n8n.tu-dominio.com/api/v1`).
- `N8N_API_KEY`: Token de acceso generado en la configuración de n8n.
- `N8N_BASE_URL`: URL base de la instancia.

## ✅ Mantenimiento
- Revisar periódicamente las actualizaciones de `n8n-skills` para soportar nuevos nodos.
- Auditar los logs de cambios realizados por la IA para asegurar que cumplen con el flujo bilingüe.

---
*Arquitectura V5 liderada por Mario Mojica style & Antigravity.*

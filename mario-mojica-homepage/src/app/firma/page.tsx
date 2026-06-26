"use client";

import React, { useState } from "react";

export default function SignaturePage() {
  const [copied, setCopied] = useState(false);

  const signatureHtml = `
    <table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: transparent; border-collapse: collapse;">
      <tr>
        <td valign="middle" style="padding-right: 20px; border-right: 2px solid #0d9488;">
          <a href="https://mariomojica.com" target="_blank" style="text-decoration: none;">
            <img src="https://mariomojica.com/Logo_Signature.png" alt="Mario Mojica" width="110" style="border: 0; display: block; width: 110px; height: auto;" />
          </a>
        </td>
        <td valign="middle" style="padding-left: 20px; text-align: left;">
          <div style="font-size: 16px; font-weight: 700; color: #111827; margin: 0; line-height: 20px; letter-spacing: -0.01em;">
            Mario Mojica
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #0d9488; text-transform: uppercase; margin: 2px 0 8px 0; line-height: 14px; letter-spacing: 0.05em;">
            Architect of 3D Interactive Manuals & B2B SaaS
          </div>
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <tr>
              <td style="font-size: 13px; color: #4b5563; padding: 2px 0; line-height: 16px;">
                <span style="color: #0d9488; font-weight: 600;">W:</span> <a href="https://mariomojica.com" target="_blank" style="color: #0d9488; text-decoration: none; font-weight: 500;">mariomojica.com</a>
              </td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #4b5563; padding: 2px 0; line-height: 16px;">
                <span style="color: #0d9488; font-weight: 600;">E:</span> <a href="mailto:direccion@mariomojica.com" style="color: #4b5563; text-decoration: none;">direccion@mariomojica.com</a>
              </td>
            </tr>
          </table>
          <div style="margin-top: 10px; font-size: 11px; color: #9ca3af; font-style: italic; line-height: 14px;">
            Interactive 3D instructions for RTA furniture manufacturers.
          </div>
        </td>
      </tr>
    </table>
  `;

  const handleCopy = async () => {
    try {
      const blob = new Blob([signatureHtml], { type: "text/html" });
      const data = [new ClipboardItem({ "text/html": blob })];
      await navigator.clipboard.write(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Error al copiar usando Clipboard API", err);
      alert("Hubo un error al copiar automáticamente. Por favor, selecciona la firma visualmente con el mouse y cópiala manualmente con Ctrl+C.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#FAF9F5",
      color: "#141413",
      fontFamily: "'Inter', sans-serif",
      padding: "40px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        maxWidth: "600px",
        width: "100%",
        backgroundColor: "#FFFFFF",
        padding: "40px",
        borderRadius: "16px",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)",
        border: "1px solid #E2E2EB"
      }}>
        <h1 style={{
          fontSize: "24px",
          fontWeight: 700,
          marginBottom: "10px",
          color: "#111827",
          textAlign: "center"
        }}>
          ✨ Generador de Firma Premium
        </h1>
        <p style={{
          fontSize: "14px",
          color: "#4b5563",
          marginBottom: "30px",
          textAlign: "center",
          lineHeight: "20px"
        }}>
          Copia tu firma formateada en texto enriquecido (Rich Text) con un solo clic y pégala directamente en la configuración de Gmail.
        </p>

        {/* Vista previa de la firma */}
        <div style={{
          padding: "30px",
          border: "1px dashed #0d9488",
          borderRadius: "12px",
          backgroundColor: "#fcfdfd",
          marginBottom: "30px",
          display: "flex",
          justifyContent: "center"
        }}>
          <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
        </div>

        {/* Botón de Copiar */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "35px" }}>
          <button
            onClick={handleCopy}
            style={{
              backgroundColor: copied ? "#059669" : "#0d9488",
              color: "#FFFFFF",
              border: "none",
              padding: "14px 28px",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 6px -1px rgba(13, 148, 136, 0.2)"
            }}
          >
            {copied ? "✓ ¡Copiado al Portapapeles!" : "📋 Copiar Firma Formateada"}
          </button>
        </div>

        {/* Instrucciones de Uso */}
        <div style={{
          borderTop: "1px solid #E2E2EB",
          paddingTop: "25px"
        }}>
          <h3 style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "12px"
          }}>
            ¿Cómo instalarla en tu Gmail?
          </h3>
          <ol style={{
            paddingLeft: "20px",
            margin: 0,
            fontSize: "13px",
            color: "#4b5563",
            lineHeight: "22px"
          }}>
            <li>Haz clic arriba en el botón <strong>Copiar Firma Formateada</strong>.</li>
            <li>Abre tu Gmail y ve a <strong>Ajustes</strong> (icono de engranaje) &gt; <strong>Ver todos los ajustes</strong>.</li>
            <li>En la pestaña <strong>General</strong>, baja hasta la sección <strong>Firma</strong>.</li>
            <li>Haz clic en <strong>Crear nueva</strong> (si no tienes una creada), ponle un nombre y haz clic en el cuadro de texto vacío.</li>
            <li>Pega tu firma con <strong>Ctrl + V</strong> (o clic derecho &gt; Pegar). <em>¡Aparecerá directamente formateada con el logo y enlaces activos!</em></li>
            <li>Baja al final de la página de Gmail y haz clic en <strong>Guardar cambios</strong>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

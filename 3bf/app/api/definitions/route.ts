import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const definicionDir = path.join(process.cwd(), "Definiciones");
    
    if (!fs.existsSync(definicionDir)) {
      return NextResponse.json({ 
        categories: ["Armarios", "Comodas", "Cubiertas", "Escritorios"], 
        items: [] 
      });
    }

    const entries = fs.readdirSync(definicionDir, { withFileTypes: true });
    
    // Obtener subcarpetas ordenadas alfabéticamente
    const categories = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

    const items: Array<{
      id: string;
      nombre: string;
      categoria: string;
      archivo: string;
      rutaRelativa: string;
      descripcion: string;
    }> = [];

    for (const cat of categories) {
      const catPath = path.join(definicionDir, cat);
      const files = fs.readdirSync(catPath, { withFileTypes: true });
      
      for (const file of files) {
        if (file.isFile() && file.name.toLowerCase().endsWith(".ghx")) {
          const rawName = file.name.replace(/\.ghx$/i, "").trim();
          // Limpiar sufijos temporales como [Aug-13 '26, 1428] para el nombre visible
          const nombreLimpio = rawName.replace(/\s*\[.*?\]\s*/g, "").trim() || rawName;
          
          items.push({
            id: rawName,
            nombre: nombreLimpio,
            categoria: cat,
            archivo: file.name,
            rutaRelativa: `${cat}/${file.name}`,
            descripcion: `Definición paramétrica GHX de ${nombreLimpio} (${cat}).`,
          });
        }
      }
    }

    return NextResponse.json({ categories, items });
  } catch (error: any) {
    console.error("Error al escanear Definiciones:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

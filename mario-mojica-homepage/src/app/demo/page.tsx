import type { Metadata } from "next";
import DemoClient from "./DemoClient";

export const metadata: Metadata = {
  title: "Demo Interactiva | Mario Mojica",
  description: "Explora la demo de nuestro manual de armado 3D interactivo para fabricantes de muebles RTA.",
};

export default function DemoPage() {
  return <DemoClient />;
}


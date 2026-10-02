import type { Metadata } from "next";

// La página es un client component y no puede exportar metadata; va aquí.
export const metadata: Metadata = {
  title: "Recetas",
  description:
    "Recetas con pollo fresco y huevo orgánico de Pollos Juacos't: ingredientes, tiempos de cocción y preparación paso a paso.",
};

export default function RecetasLayout({ children }: { children: React.ReactNode }) {
  return children;
}

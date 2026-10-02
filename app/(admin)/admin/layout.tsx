import type { Metadata } from "next";

// Todo /admin es privado: título propio y fuera de los buscadores.
export const metadata: Metadata = {
  title: {
    default: "Panel",
    template: "%s · Panel Juacos't",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}

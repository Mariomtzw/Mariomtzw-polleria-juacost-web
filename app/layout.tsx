import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WhatsAppFloat from "@/components/ui/whatsapp-float";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Especialistas en pollo de alta calidad y huevo orgánico para familias y negocios desde hace más de 35 años. Ventas por mayoreo y menudeo en Banderilla, Veracruz.";

export const metadata: Metadata = {
  title: {
    default: "Pollos Juacos't | Pollo fresco y huevo orgánico en Banderilla",
    template: "%s | Pollos Juacos't",
  },
  description,
  openGraph: {
    title: "Pollos Juacos't",
    description,
    siteName: "Pollos Juacos't",
    locale: "es_MX",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#b92b27",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Botón flotante global (se oculta solo dentro de /admin) */}
        <WhatsAppFloat />
      </body>
    </html>
  );
}

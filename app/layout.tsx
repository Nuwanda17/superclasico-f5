import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Superclásico F5",
  description: "La previa, los equipos y la simulación más dudosa del Superclásico entre amigos.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Superclásico F5",
    description: "40 minutos de dudosa calidad futbolística.",
    type: "website",
    locale: "es_PY",
    images: [{ url: "/og.png", width: 1728, height: 910, alt: "Superclásico F5 — Cerro Porteño vs Olimpia" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Superclásico F5",
    description: "40 minutos de dudosa calidad futbolística.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}

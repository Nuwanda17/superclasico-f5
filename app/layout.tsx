import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const bebasNeue = Bebas_Neue({ variable: "--font-bebas-neue", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Superclásico F5",
  description: "La previa digital del Superclásico F5 entre amigos.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  metadataBase: new URL(process.env.SITE_URL ?? "https://superclasico-f5.martinezricardi24.chatgpt.site"),
  openGraph: {
    title: "Superclásico F5",
    description: "La previa digital entre amigos.",
    type: "website",
    locale: "es_PY",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Superclásico F5 — Cerro Porteño vs Olimpia" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Superclásico F5",
    description: "La previa digital entre amigos.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${bebasNeue.variable} antialiased`}>{children}</body>
    </html>
  );
}

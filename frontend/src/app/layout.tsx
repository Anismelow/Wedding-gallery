import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/pinyon-script";
import "@fontsource-variable/jost";
import "./globals.css";
import { wedding } from "@/lib/wedding";

const [first, second] = wedding.names;

export const metadata: Metadata = {
  title: `Fotos de la boda de ${first} y ${second}`,
  description: "Sube tus fotos de la boda y mira las de los demás.",
  // Es una web privada: pedimos a los buscadores que no la indexen.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f8f9f6",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}

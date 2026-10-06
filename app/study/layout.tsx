import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./study.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Study — Orbit",
  description: "An interactive scroll study: constellations, orbital regimes, and the space arsenal.",
  robots: { index: false, follow: false },
};

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${archivo.variable} ${plexMono.variable}`}>{children}</div>;
}

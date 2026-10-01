import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./indice.css";

// Scoped to this route: light display sizes, tabular figures, mono labels.
const sans = Geist({
  variable: "--font-ix-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-ix-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Índice",
  description:
    "Versión minimalista de la web de C.D. La Otra Vertiente: un índice tipográfico que se lee subiendo, del nivel del mar a los 2.069 m de La Maroma.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function IndiceLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${sans.variable} ${mono.variable} ix`}>{children}</div>;
}

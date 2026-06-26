import type { Metadata, Viewport } from "next";
import { Archivo, Fraunces, Geist_Mono } from "next/font/google";
import { club } from "@/content/club";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${club.name} · Club de trail running en Málaga`,
    template: `%s · ${club.name}`,
  },
  description:
    "Club deportivo de montaña y trail running de Rincón de la Victoria (Axarquía, Málaga). Corremos por la otra vertiente: del mar a los 2.000 metros.",
  keywords: [
    "trail running Málaga",
    "club de montaña Axarquía",
    "Rincón de la Victoria",
    "La Maroma",
    "carreras por montaña",
    "La Otra Vertiente",
  ],
  openGraph: {
    title: `${club.name} · Trail running en Málaga`,
    description:
      "Corremos por la otra vertiente. Club de montaña y trail running en la Axarquía malagueña.",
    locale: "es_ES",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${fraunces.variable} ${geistMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}

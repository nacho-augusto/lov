import { IBM_Plex_Mono, Instrument_Serif, Inter_Tight } from "next/font/google";

// Hora Dorada's type system: a film-title serif, a tight grotesque for reading text
// and a mono for timecodes and slates. Scoped to this route.
const serif = Instrument_Serif({
  variable: "--font-hd-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Inter_Tight({
  variable: "--font-hd-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-hd-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export default function HoraDoradaLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable} ${sans.variable} ${mono.variable}`}>{children}</div>;
}

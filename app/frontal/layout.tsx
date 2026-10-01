import { Martian_Mono, Saira } from "next/font/google";

// Frontal's own type system, scoped to this route:
// - Saira (variable width + weight): condensed heavy display, normal width for reading.
// - Martian Mono (variable width): the "instrument" voice — clock, altitude, lumens.
const display = Saira({
  variable: "--font-frontal-display",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const mono = Martian_Mono({
  variable: "--font-frontal-mono",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export default function FrontalLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${mono.variable}`}>{children}</div>;
}

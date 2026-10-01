import { Archivo, Martian_Mono } from "next/font/google";

// DORSAL type system, scoped to this route:
// - Archivo with its width axis (62–125): ultra-extended black for shouting,
//   condensed for stacks, normal width for reading.
// - Martian Mono (width axis 75–112.5) for race data: bibs, tables, captions.
const sans = Archivo({
  variable: "--font-dorsal-sans",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const mono = Martian_Mono({
  variable: "--font-dorsal-mono",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export default function DorsalLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${sans.variable} ${mono.variable}`}>{children}</div>;
}

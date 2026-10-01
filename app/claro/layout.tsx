import { Barlow, Barlow_Condensed } from "next/font/google";

// Claro's own type system: a heavy condensed grotesque for headlines (as in the
// original hero mock-up) and Barlow for reading text. Scoped to this route.
const display = Barlow_Condensed({
  variable: "--font-claro-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const sans = Barlow({
  variable: "--font-claro-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export default function ClaroLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${sans.variable}`}>{children}</div>;
}

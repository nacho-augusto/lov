import { Jersey_10, Press_Start_2P, VT323 } from "next/font/google";
import "./lov-quest.css";

// Pixel type system, scoped to this route only.
const display = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lq-display",
  display: "swap",
});

const body = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lq-body",
  display: "swap",
});

const numbers = Jersey_10({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lq-num",
  display: "swap",
});

export default function LovQuestLayout({ children }: { children: React.ReactNode }) {
  return <div className={`lq ${display.variable} ${body.variable} ${numbers.variable}`}>{children}</div>;
}

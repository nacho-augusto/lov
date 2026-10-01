import type { Metadata } from "next";
import { Saira } from "next/font/google";
import s from "@/components/admin-maqueta/admin.module.css";

// One family with a width axis: condensed and heavy for headings and figures
// (echoing the angular logo lettering), normal width for tables and forms.
const saira = Saira({
  variable: "--font-admin",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Panel de la junta (maqueta)",
  robots: { index: false, follow: false },
};

export default function AdminMockLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-admin-root className={`${saira.variable} ${s.root}`}>
      {children}
    </div>
  );
}

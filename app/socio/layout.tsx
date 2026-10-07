import type { Metadata } from "next";
import { Saira } from "next/font/google";
import s from "@/components/admin/admin.module.css";

// Shares the panel's type and tokens: same club, quieter context.
const saira = Saira({
  variable: "--font-admin",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Zona de socios", template: "%s · Zona de socios" },
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-admin-root className={`${saira.variable} ${s.root}`}>
      {children}
    </div>
  );
}

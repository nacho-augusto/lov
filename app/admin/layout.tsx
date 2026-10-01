import type { Metadata } from "next";
import { Saira } from "next/font/google";
import s from "@/components/admin/admin.module.css";

// Same type system as the approved mockup: Saira with its width axis.
const saira = Saira({
  variable: "--font-admin",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Panel de la junta", template: "%s · Panel de la junta" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-admin-root className={`${saira.variable} ${s.root}`}>
      {children}
    </div>
  );
}

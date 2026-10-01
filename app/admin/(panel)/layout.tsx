import { Shell } from "@/components/admin/Shell";
import { requireAdmin } from "@/lib/admin/session";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <Shell admin={admin}>{children}</Shell>;
}

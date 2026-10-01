import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

// CSV of a year's movements, for the AGM or the bank. Semicolon-separated with a BOM
// so Spanish Excel opens it with the right columns and accents.
export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin?.permissions.has("accounts.read")) return new NextResponse("Sin acceso", { status: 403 });

  const ano = request.nextUrl.searchParams.get("ano") ?? "";
  if (!/^\d{4}$/.test(ano)) return new NextResponse("Año no válido", { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("occurred_on, kind, amount_cents, description, counterparty, receipt_path, categories(name)")
    .gte("occurred_on", `${ano}-01-01`)
    .lte("occurred_on", `${ano}-12-31`)
    .order("occurred_on");
  if (error) return new NextResponse("Error", { status: 500 });

  // Quote; free-text cells also get spreadsheet formulas neutralised.
  const quote = (t: string) => `"${t.replace(/"/g, '""')}"`;
  const cell = (v: unknown) => {
    const t = String(v ?? "");
    return quote(/^[=+\-@\t\r]/.test(t) ? `'${t}` : t);
  };
  const amount = (cents: number, kind: string) =>
    ((kind === "income" ? 1 : -1) * cents / 100).toFixed(2).replace(".", ",");

  const lines = [
    ["Fecha", "Tipo", "Importe", "Categoría", "Descripción", "Quién", "Justificante"].map(cell).join(";"),
    ...(data ?? []).map((t) =>
      [
        quote(t.occurred_on),
        quote(t.kind === "income" ? "Ingreso" : "Gasto"),
        quote(amount(Number(t.amount_cents), t.kind)),
        cell((t.categories as unknown as { name: string } | null)?.name),
        cell(t.description),
        cell(t.counterparty),
        quote(t.receipt_path ? "Sí" : "No"),
      ].join(";"),
    ),
  ];

  return new NextResponse("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cuentas-la-otra-vertiente-${ano}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

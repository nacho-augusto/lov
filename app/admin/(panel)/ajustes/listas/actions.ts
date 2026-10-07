"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { text } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";

const PATH = "/admin/ajustes/listas";

function done(param: "ok" | "error", code: string): never {
  revalidatePath("/admin", "layout");
  redirect(`${PATH}?${param}=${code}`);
}

const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);
const sortOf = (formData: FormData) => {
  const n = Number(formData.get("sort"));
  return Number.isInteger(n) && n >= 0 && n <= 9999 ? n : 0;
};

// Ledger categories. Kind is fixed once created: movements already point at them.
export async function saveCategory(formData: FormData) {
  await requireAdmin("accounts.write");
  const id = formData.get("id");
  const name = text(formData, "name");
  if (!name) done("error", "nombre");

  const supabase = await createClient();
  let error;
  if (isUuid(id)) {
    ({ error } = await supabase
      .from("categories")
      .update({ name, sort: sortOf(formData), active: formData.get("active") !== "false" })
      .eq("id", id));
  } else {
    const kind = String(formData.get("kind"));
    if (kind !== "income" && kind !== "expense") done("error", "tipo");
    ({ error } = await supabase.from("categories").insert({ kind, name, sort: sortOf(formData) }));
  }
  if (error) done("error", error.code === "23505" ? "categoria-repetida" : "guardar");
  done("ok", "categoria");
}

// Onboarding checklist items. "Yearly" is fixed once created so existing checklists
// keep one consistent shape (one-off items have no season).
export async function saveTemplate(formData: FormData) {
  await requireAdmin("members.write");
  const id = formData.get("id");
  const name = text(formData, "name");
  if (!name) done("error", "nombre");
  const fields = { name, description: text(formData, "description"), sort: sortOf(formData) };

  const supabase = await createClient();
  const { error } = isUuid(id)
    ? await supabase
        .from("requirement_templates")
        .update({ ...fields, active: formData.get("active") !== "false" })
        .eq("id", id)
    : await supabase.from("requirement_templates").insert({ ...fields, yearly: formData.get("yearly") === "on" });
  if (error) done("error", "guardar");
  done("ok", "tramite");
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocUpload } from "@/components/admin/DocUpload";
import { GrantFields } from "@/components/admin/GrantFields";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import s from "@/components/admin/admin.module.css";
import { formatDate, todayISO } from "@/lib/admin/format";
import {
  daysUntil, grantMessages, grantStatusLabels, nextDeadline, taskStatusLabels, type GrantStatus, type TaskStatus,
} from "@/lib/admin/grants";
import { eur } from "@/lib/admin/money";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import {
  addRequirements, deleteGrantDocument, deleteGrantRequirement, linkExpense, setGrantRequirementStatus, updateGrant,
} from "../actions";

export const metadata: Metadata = { title: "Subvención" };

interface Requirement {
  id: string;
  description: string;
  status: TaskStatus;
}
interface Doc {
  id: string;
  requirement_id: string | null;
  file_name: string;
  size_bytes: number | null;
  uploaded_at: string;
}
interface Expense {
  id: string;
  occurred_on: string;
  amount_cents: number;
  description: string;
  receipt_path: string | null;
  grant_id: string | null;
}

const kb = (n: number | null) => (n == null ? "" : n > 1_048_576 ? `${(n / 1_048_576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function DocLinks({ docs, grantId, canWrite }: { docs: Doc[]; grantId: string; canWrite: boolean }) {
  if (!docs.length) return null;
  return (
    <ul className={s.docList}>
      {docs.map((d) => (
        <li key={d.id}>
          <a href={`/admin/subvenciones/documento/${d.id}`} target="_blank" rel="noopener" className={s.rowLink}>
            {d.file_name}
          </a>
          <span className={s.adminMeta}> · {kb(d.size_bytes)}</span>
          {canWrite && (
            <form action={deleteGrantDocument} className={s.inline}>
              <input type="hidden" name="grant_id" value={grantId} />
              <input type="hidden" name="id" value={d.id} />
              <button type="submit" className={s.linkButton}>Borrar</button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function GrantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("grants.read");
  const { id } = await params;
  const { ok, error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const canWrite = me.permissions.has("grants.write");
  const canSeeMoney = me.permissions.has("accounts.read");
  const supabase = await createClient();

  const { data: grant } = await supabase.from("grants").select("*").eq("id", id).maybeSingle();
  if (!grant) notFound();

  const [{ data: reqs }, { data: docs }, { data: expenses }] = await Promise.all([
    supabase.from("grant_requirements").select("id, description, status").eq("grant_id", id).order("sort"),
    supabase.from("grant_documents").select("id, requirement_id, file_name, size_bytes, uploaded_at").eq("grant_id", id).order("uploaded_at"),
    canSeeMoney
      ? supabase
          .from("transactions")
          .select("id, occurred_on, amount_cents, description, receipt_path, grant_id")
          .eq("kind", "expense")
          .gte("occurred_on", `${grant.year}-01-01`)
          .lte("occurred_on", `${grant.year}-12-31`)
          .or(`grant_id.is.null,grant_id.eq.${id}`)
          .order("occurred_on")
      : Promise.resolve({ data: [] as Expense[] }),
  ]);

  const requirements = (reqs ?? []) as Requirement[];
  const documents = (docs ?? []) as Doc[];
  const allExpenses = (expenses ?? []) as Expense[];
  const linked = allExpenses.filter((e) => e.grant_id === id);
  const unlinked = allExpenses.filter((e) => !e.grant_id);
  const justified = linked.reduce((a, e) => a + Number(e.amount_cents), 0);
  const target = grant.awarded_cents ?? grant.requested_cents;
  const relevant = requirements.filter((r) => r.status !== "not_applicable");
  const done = relevant.filter((r) => r.status === "done").length;
  const next = nextDeadline(grant as { status: GrantStatus; application_deadline: string | null; justification_deadline: string | null });
  const days = next ? daysUntil(next.date, todayISO()) : null;

  return (
    <>
      <PageHead
        kicker={`${grant.year} · ${grant.awarding_body ?? "Subvención"}`}
        title={grant.name}
        actions={<Link href="/admin/subvenciones" className={s.ghostButton}>Volver</Link>}
      />
      <Notice ok={ok} error={error} messages={grantMessages} />

      <section className={s.figures} aria-label="Resumen">
        <div className={s.figure}>
          <span className={s.figureLabel}>Estado</span>
          <span className={s.figureValue}>{grantStatusLabels[grant.status as GrantStatus]}</span>
        </div>
        <div className={s.figure}>
          <span className={s.figureLabel}>Documentos listos</span>
          <span className={s.figureValue}>
            {done}
            <small>/{relevant.length}</small>
          </span>
        </div>
        {next && (
          <div className={s.figure}>
            <span className={s.figureLabel}>Plazo de {next.kind.toLowerCase()}</span>
            <span className={s.figureValue} data-accent={days !== null && days <= 21 ? "" : undefined}>
              {days !== null && days >= 0 ? `${days} días` : "Vencido"}
            </span>
            <span className={s.figureNote}>{formatDate(next.date)}</span>
          </div>
        )}
        {canSeeMoney && (
          <div className={s.figure}>
            <span className={s.figureLabel}>Justificado</span>
            <span className={s.figureValue}>{eur(justified)}</span>
            <span className={s.figureNote}>{target ? `de ${eur(target)} ${grant.awarded_cents != null ? "concedidos" : "solicitados"}` : "sin importe"}</span>
          </div>
        )}
      </section>

      <div className={s.columns}>
        <section className={s.block} aria-labelledby="documentos">
          <header className={s.blockHead}>
            <h2 id="documentos" className={s.blockTitle}>Documentos que piden</h2>
            {grant.call_url && (
              <a href={grant.call_url} target="_blank" rel="noopener noreferrer" className={s.linkButton}>Ver convocatoria</a>
            )}
          </header>
          {requirements.length ? (
            <ul className={s.checklist}>
              {requirements.map((r) => {
                const rDocs = documents.filter((d) => d.requirement_id === r.id);
                return (
                  <li key={r.id} data-status={r.status === "done" ? "done" : r.status === "not_applicable" ? "not_applicable" : "pending"} className={s.reqItem}>
                    <span className={s.checkMark} aria-hidden="true" />
                    <span>
                      <span className={s.strong}>{r.description}</span>
                      <span className={s.adminMeta}> · {taskStatusLabels[r.status]}</span>
                      <DocLinks docs={rDocs} grantId={id} canWrite={canWrite} />
                    </span>
                    {canWrite && (
                      <span className={s.statusForm}>
                        <DocUpload grantId={id} requirementId={r.id} />
                        <form action={setGrantRequirementStatus} className={s.inline}>
                          <input type="hidden" name="grant_id" value={id} />
                          <input type="hidden" name="id" value={r.id} />
                          {(["done", "in_progress", "pending", "not_applicable"] as const)
                            .filter((st) => st !== r.status)
                            .slice(0, 2)
                            .map((st) => (
                              <button key={st} type="submit" name="status" value={st} className={s.linkButton}>
                                {st === "done" ? "Marcar listo" : taskStatusLabels[st]}
                              </button>
                            ))}
                        </form>
                        <details className={s.popover}>
                          <summary className={s.linkButton} aria-label="Más opciones">···</summary>
                          <div className={s.popoverBody}>
                            <form action={setGrantRequirementStatus}>
                              <input type="hidden" name="grant_id" value={id} />
                              <input type="hidden" name="id" value={r.id} />
                              {(["pending", "in_progress", "done", "not_applicable"] as const).map((st) => (
                                <button key={st} type="submit" name="status" value={st} className={s.linkButton} disabled={st === r.status}>
                                  {taskStatusLabels[st]}
                                </button>
                              ))}
                            </form>
                            <form action={deleteGrantRequirement}>
                              <input type="hidden" name="grant_id" value={id} />
                              <input type="hidden" name="id" value={r.id} />
                              <button type="submit" className={s.linkButton}>Quitar de la lista</button>
                            </form>
                          </div>
                        </details>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={s.emptyText}>Aún no hay documentos en la lista.</p>
          )}

          {canWrite && (
            <details className={s.adminEdit} style={{ marginTop: 14 }}>
              <summary className={s.linkButton}>Añadir documentos a la lista</summary>
              <form action={addRequirements} className={s.formStack}>
                <input type="hidden" name="grant_id" value={id} />
                <textarea name="requirements" rows={4} className={s.textarea} placeholder="Uno por línea" />
                <div>
                  <button type="submit" className={s.secondaryButton}>Añadir</button>
                </div>
              </form>
            </details>
          )}

          <header className={s.blockHead} style={{ marginTop: 28 }}>
            <h3 className={s.blockTitle}>Otros archivos</h3>
            {canWrite && <DocUpload grantId={id} label="Subir archivo" />}
          </header>
          <DocLinks docs={documents.filter((d) => !d.requirement_id)} grantId={id} canWrite={canWrite} />
          {!documents.some((d) => !d.requirement_id) && <p className={s.emptyText}>Resoluciones, correos, bases…</p>}
        </section>

        <div className={s.stack}>
          {canWrite ? (
            <section className={s.block} aria-labelledby="datos">
              <header className={s.blockHead}>
                <h2 id="datos" className={s.blockTitle}>Datos</h2>
              </header>
              <form action={updateGrant} className={s.formStack}>
                <input type="hidden" name="id" value={id} />
                <label className={s.field}>
                  <span>Estado</span>
                  <select name="status" defaultValue={grant.status} className={s.input}>
                    {Object.entries(grantStatusLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>
                <GrantFields v={grant} showAwarded />
                <div>
                  <button type="submit" className={s.primaryButton}>Guardar</button>
                </div>
              </form>
            </section>
          ) : (
            grant.notes && (
              <section className={s.block}>
                <h2 className={s.blockTitle}>Notas</h2>
                <p>{grant.notes}</p>
              </section>
            )
          )}

          {canSeeMoney && (
            <section className={s.block} aria-labelledby="justificacion">
              <header className={s.blockHead}>
                <h2 id="justificacion" className={s.blockTitle}>Justificación</h2>
                <p className={s.blockMeta}>Gastos de {grant.year} que se presentan con esta subvención.</p>
              </header>
              {linked.length ? (
                <ul className={s.ledger}>
                  {linked.map((e) => (
                    <li key={e.id}>
                      <span className={s.deadlineDate}>{formatDate(e.occurred_on, { day: "numeric", month: "short" })}</span>
                      <span>
                        {e.description}
                        {!e.receipt_path && <span className={s.accentText}> · sin justificante</span>}
                        {canWrite && (
                          <form action={linkExpense} className={s.inline}>
                            <input type="hidden" name="grant_id" value={id} />
                            <input type="hidden" name="transaction_id" value={e.id} />
                            <input type="hidden" name="unlink" value="true" />
                            <button type="submit" className={s.linkButton}>Quitar</button>
                          </form>
                        )}
                      </span>
                      <span className={s.num}>{eur(e.amount_cents)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={s.emptyText}>Ningún gasto vinculado todavía.</p>
              )}
              {canWrite && unlinked.length > 0 && (
                <form action={linkExpense} className={s.inlineForm} style={{ marginTop: 12 }}>
                  <input type="hidden" name="grant_id" value={id} />
                  <label className={s.field} style={{ flex: 1 }}>
                    <span>Añadir gasto</span>
                    <select name="transaction_id" className={s.input}>
                      {unlinked.map((e) => (
                        <option key={e.id} value={e.id}>
                          {formatDate(e.occurred_on, { day: "numeric", month: "short" })} · {e.description} · {eur(e.amount_cents)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className={s.secondaryButton}>Vincular</button>
                </form>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { ClubDocUpload } from "@/components/admin/ClubDocUpload";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import { PeakSilhouette } from "@/components/admin/marks";
import s from "@/components/admin/admin.module.css";
import { documentKindLabels, expiryStatus, extrasMessages, type DocumentKind } from "@/lib/admin/extras";
import { formatDate, todayISO } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { deleteDocument, saveDocument } from "./actions";

export const metadata: Metadata = { title: "Documentos del club" };

interface ClubDocument {
  id: string;
  name: string;
  kind: DocumentKind;
  issued_on: string | null;
  expires_on: string | null;
  notes: string | null;
  path: string | null;
  file_name: string | null;
}

function DocumentFields({ d }: { d?: ClubDocument }) {
  return (
    <>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Nombre</span>
          <input name="name" defaultValue={d?.name} className={s.input} placeholder="Póliza de responsabilidad civil…" required />
        </label>
        <label className={s.field}>
          <span>Tipo</span>
          <select name="kind" defaultValue={d?.kind ?? "other"} className={s.input}>
            {Object.entries(documentKindLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      <div className={s.fieldRow}>
        <label className={s.field}>
          <span>Fecha del documento</span>
          <input name="issued_on" type="date" defaultValue={d?.issued_on ?? ""} className={s.input} />
        </label>
        <label className={s.field}>
          <span>Caduca (opcional)</span>
          <input name="expires_on" type="date" defaultValue={d?.expires_on ?? ""} className={s.input} />
        </label>
      </div>
      <label className={s.field}>
        <span>Notas</span>
        <input name="notes" defaultValue={d?.notes ?? ""} className={s.input} placeholder="N.º de póliza, aseguradora…" />
      </label>
    </>
  );
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("documents.read");
  const { ok, error } = await searchParams;
  const canWrite = me.permissions.has("documents.write");
  const supabase = await createClient();
  const { data } = await supabase
    .from("club_documents")
    .select("id, name, kind, issued_on, expires_on, notes, path, file_name")
    .order("kind")
    .order("name");
  const docs = (data ?? []) as ClubDocument[];
  const todayIso = todayISO();

  return (
    <>
      <PageHead kicker="Club" title="Documentos del club" />
      <Notice ok={ok} error={error} messages={extrasMessages} />

      {docs.length ? (
        <ul className={s.adminList}>
          {docs.map((d) => {
            const exp = expiryStatus(d.expires_on, todayIso);
            return (
              <li key={d.id} className={s.adminItem}>
                <div className={s.adminWho}>
                  <span className={s.strong}>
                    {d.path ? (
                      <a href={`/admin/documentos/archivo/${d.id}`} className={s.rowLink}>{d.name}</a>
                    ) : (
                      d.name
                    )}
                  </span>
                  <span className={s.adminMeta}>
                    {documentKindLabels[d.kind]}
                    {d.issued_on && ` · ${formatDate(d.issued_on)}`}
                    {d.expires_on && ` · caduca ${formatDate(d.expires_on)}`}
                    {d.notes && ` · ${d.notes}`}
                    {!d.path && " · sin archivo"}
                  </span>
                  <span className={s.status} data-tone={exp.tone} style={{ justifySelf: "start" }}>{exp.label}</span>
                </div>
                {canWrite ? (
                  <>
                    <details className={s.adminEdit}>
                      <summary className={s.linkButton}>Editar</summary>
                      <form action={saveDocument} className={s.formStack}>
                        <input type="hidden" name="id" value={d.id} />
                        <DocumentFields d={d} />
                        <button type="submit" className={s.secondaryButton}>Guardar</button>
                      </form>
                      <form action={deleteDocument} style={{ marginTop: 10 }}>
                        <input type="hidden" name="id" value={d.id} />
                        <button type="submit" className={s.linkButton}>Borrar documento y archivo</button>
                      </form>
                    </details>
                    <ClubDocUpload documentId={d.id} label={d.path ? "Cambiar archivo" : "Subir archivo"} />
                  </>
                ) : (
                  <span />
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={s.empty}>
          <PeakSilhouette className={s.emptyPeak} />
          <p className={s.emptyTitle}>Aún no hay documentos</p>
          <p className={s.emptyText}>Estatutos, CIF, seguro, actas… Todo a mano y con aviso antes de que caduque.</p>
        </div>
      )}

      {canWrite && (
        <section className={s.block} aria-labelledby="nuevo-documento" style={{ marginTop: 32 }}>
          <header className={s.blockHead}>
            <h2 id="nuevo-documento" className={s.blockTitle}>Nuevo documento</h2>
            <p className={s.blockMeta}>Primero los datos; luego sube el archivo desde la lista.</p>
          </header>
          <form action={saveDocument} className={s.formStack}>
            <DocumentFields />
            <div>
              <button type="submit" className={s.primaryButton}>Crear documento</button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

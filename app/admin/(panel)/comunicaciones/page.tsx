import type { Metadata } from "next";
import Link from "next/link";
import { MailtoButton } from "@/components/admin/MailtoButton";
import { Notice } from "@/components/admin/Notice";
import { PageHead } from "@/components/admin/PageHead";
import s from "@/components/admin/admin.module.css";
import { audienceLabels, groupVars, licenceSeason, needsPersonalSend, render, resolveRecipients, type Audience } from "@/lib/admin/comms";
import { formatDate, fullName } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";
import { createClient } from "@/lib/supabase/server";
import { saveTemplate } from "./actions";

export const metadata: Metadata = { title: "Comunicaciones" };

interface Template {
  id: string;
  key: string | null;
  name: string;
  subject: string;
  body: string;
  audience: Audience;
}

const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);

export default async function CommsPage({
  searchParams,
}: {
  searchParams: Promise<{ plantilla?: string; miembro?: string; nueva?: string; ok?: string; error?: string }>;
}) {
  const me = await requireAdmin("comms.read");
  const q = await searchParams;
  const canSend = me.permissions.has("comms.send");
  const supabase = await createClient();

  const [{ data: tpls }, { data: log }, { data: members }] = await Promise.all([
    supabase.from("email_templates").select("id, key, name, subject, body, audience").order("name"),
    supabase.from("email_messages").select("id, subject, recipient_count, sent_at, channel").order("sent_at", { ascending: false }).limit(20),
    supabase.from("members").select("id, first_name, last_name").eq("active", true).order("first_name"),
  ]);
  const templates = (tpls ?? []) as Template[];
  // ?plantilla accepts an id or a stable key (e.g. links from Cuotas use "fee_reminder").
  const current = q.nueva ? null : templates.find((t) => t.id === q.plantilla || t.key === q.plantilla) ?? templates[0] ?? null;
  const memberId = isUuid(q.miembro) ? q.miembro : undefined;
  const audience: Audience = memberId ? "single" : current?.audience ?? "active";

  const recipients = current && canSend ? await resolveRecipients(supabase, audience, memberId) : [];
  const withEmail = recipients.filter((r): r is typeof r & { email: string } => Boolean(r.email));
  const withoutEmail = recipients.filter((r) => !r.email);
  const personal = current ? needsPersonalSend(current.subject, current.body) || audience === "single" : false;
  const sample = withEmail[0] ?? recipients[0];
  const preview = current
    ? personal && sample
      ? { subject: render(current.subject, sample.vars), body: render(current.body, sample.vars) }
      : { subject: render(current.subject, groupVars(licenceSeason())), body: render(current.body, groupVars(licenceSeason())) }
    : null;

  return (
    <>
      <PageHead kicker="Correos a los miembros" title="Comunicaciones" />
      <Notice
        ok={q.ok}
        error={q.error}
        messages={{
          plantilla: "Plantilla guardada.",
          guardar: "No se ha podido guardar. Inténtalo de nuevo.",
        }}
      />
      {q.error === "plantilla" && (
        <p className={s.notice} data-tone="error" role="alert">Completa nombre, asunto, texto y destinatarios.</p>
      )}

      <section className={s.rangeBar} aria-label="Plantillas">
        <div className={s.chips} role="group" aria-label="Plantilla">
          {templates.map((t) => (
            <Link key={t.id} href={`/admin/comunicaciones?plantilla=${t.id}`} className={s.chip} aria-pressed={current?.id === t.id && !memberId}>
              {t.name}
            </Link>
          ))}
          {canSend && (
            <Link href="/admin/comunicaciones?nueva=1" className={s.chip} aria-pressed={Boolean(q.nueva)}>+ Nueva plantilla</Link>
          )}
        </div>
      </section>

      <div className={s.columns}>
        <section className={s.block} aria-labelledby="enviar">
          {current && preview ? (
            <>
              <header className={s.blockHead}>
                <h2 id="enviar" className={s.blockTitle}>{current.name}</h2>
                <p className={s.blockMeta}>{audienceLabels[audience]}</p>
              </header>

              {canSend && (
                <form className={s.inlineForm} style={{ marginBottom: 16 }}>
                  <input type="hidden" name="plantilla" value={current.id} />
                  <label className={s.field} style={{ flex: 1 }}>
                    <span>Enviar solo a</span>
                    <select name="miembro" defaultValue={memberId ?? ""} className={s.input}>
                      <option value="">{audienceLabels[current.audience]}</option>
                      {(members ?? []).map((m) => (
                        <option key={m.id} value={m.id}>{fullName(m)}</option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" className={s.ghostButton}>Cambiar</button>
                </form>
              )}

              <div className={s.mailPreview}>
                <p className={s.mailSubject}>{preview.subject}</p>
                <p className={s.mailBody}>{preview.body}</p>
                {personal && sample && <p className={s.adminMeta}>Vista previa para {sample.name}. Cada persona recibe sus datos.</p>}
              </div>

              {canSend && (
                <>
                  {withEmail.length === 0 ? (
                    <p className={s.emptyText} style={{ marginTop: 16 }}>Nadie a quien enviar ahora mismo.</p>
                  ) : personal ? (
                    <ul className={`${s.ledger} ${s.ledgerTwo}`} style={{ marginTop: 16 }}>
                      {withEmail.map((r) => (
                        <li key={r.memberId}>
                          <span>
                            <span className={s.strong}>{r.name}</span>
                            <span className={s.adminMeta}> · {r.email}{r.vars.pendiente && current.body.includes("pendiente") ? ` · ${r.vars.pendiente}` : ""}</span>
                          </span>
                          <MailtoButton
                            templateId={current.id}
                            subject={render(current.subject, r.vars)}
                            body={render(current.body, r.vars)}
                            recipients={[{ memberId: r.memberId, email: r.email }]}
                            label="Abrir correo"
                            variant="link"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={s.formActions} style={{ marginTop: 16 }}>
                      <MailtoButton
                        templateId={current.id}
                        subject={preview.subject}
                        body={preview.body}
                        recipients={withEmail.map((r) => ({ memberId: r.memberId, email: r.email }))}
                        label={`Abrir correo para ${withEmail.length} ${withEmail.length === 1 ? "persona" : "personas"} (CCO)`}
                        variant="primary"
                      />
                    </div>
                  )}
                  {withoutEmail.length > 0 && (
                    <p className={s.blockMeta} style={{ marginTop: 12 }}>
                      Sin correo en su ficha:{" "}
                      {withoutEmail.map((r, i) => (
                        <span key={r.memberId}>
                          {i > 0 && ", "}
                          <Link href={`/admin/miembros/${r.memberId}`} className={s.rowLink}>{r.name}</Link>
                        </span>
                      ))}
                      .
                    </p>
                  )}
                  <p className={s.blockMeta} style={{ marginTop: 12 }}>
                    Se abre en tu programa de correo para que lo revises y lo envíes tú. El envío automático llegará con el dominio del club.
                  </p>
                </>
              )}
            </>
          ) : (
            <p className={s.emptyText}>{q.nueva ? "Escribe la nueva plantilla a la derecha." : "No hay plantillas."}</p>
          )}
        </section>

        {canSend && (
          <section className={s.block} aria-labelledby="editar">
            <header className={s.blockHead}>
              <h2 id="editar" className={s.blockTitle}>{current ? "Editar plantilla" : "Nueva plantilla"}</h2>
            </header>
            <form action={saveTemplate} className={s.formStack} key={current?.id ?? "new"}>
              {current && <input type="hidden" name="id" value={current.id} />}
              <label className={s.field}>
                <span>Nombre</span>
                <input name="name" defaultValue={current?.name} className={s.input} required />
              </label>
              <label className={s.field}>
                <span>Para</span>
                <select name="audience" defaultValue={current?.audience ?? "active"} className={s.input}>
                  {(Object.keys(audienceLabels) as Audience[]).filter((a) => a !== "single").map((a) => (
                    <option key={a} value={a}>{audienceLabels[a]}</option>
                  ))}
                </select>
              </label>
              <label className={s.field}>
                <span>Asunto</span>
                <input name="subject" defaultValue={current?.subject} className={s.input} required />
              </label>
              <label className={s.field}>
                <span>Texto</span>
                <textarea name="body" rows={10} defaultValue={current?.body} className={s.textarea} required />
              </label>
              <p className={s.blockMeta}>
                Puedes usar {"{{nombre}}"}, {"{{pendiente}}"}, {"{{conceptos}}"} y {"{{temporada}}"}.
              </p>
              <div>
                <button type="submit" className={s.secondaryButton}>Guardar plantilla</button>
              </div>
            </form>
          </section>
        )}
      </div>

      <section className={s.block} aria-labelledby="registro">
        <header className={s.blockHead}>
          <h2 id="registro" className={s.blockTitle}>Registro</h2>
          <p className={s.blockMeta}>Lo último que se ha preparado desde el panel.</p>
        </header>
        {log?.length ? (
          <ul className={s.ledger}>
            {log.map((m) => (
              <li key={m.id}>
                <span className={s.deadlineDate}>{formatDate(m.sent_at, { day: "numeric", month: "short" })}</span>
                <span>{m.subject}</span>
                <span className={s.adminMeta}>{m.recipient_count} {m.recipient_count === 1 ? "persona" : "personas"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={s.emptyText}>Aún no se ha enviado nada.</p>
        )}
      </section>
    </>
  );
}

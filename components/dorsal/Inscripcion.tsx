import { club } from "@/content";
import { BIB, categories } from "./copy";
import { SectionHead } from "./SectionHead";
import { Barcode, CropMarks, Stamp } from "./marks";
import s from "./dorsal.module.css";

/** 05 — Joining, as an entry ticket. Printed, not a real form: the two ways in are links. */
export function Inscripcion() {
  return (
    <section id="inscripcion" className={s.insc} aria-labelledby="inscripcion-title">
      <SectionHead id="inscripcion" title="Inscripción" fit={8.6} note="Plazas ilimitadas · Ritmo: el tuyo" />

      <div className={s.ticketWrap}>
        <div className={s.ticket}>
          <CropMarks />
          <div className={s.ticketMain}>
            <div className={s.ticketHead}>
              <p className={s.ticketTitle}>Hoja de inscripción</p>
              <p className={s.ticketSerial}>
                Temporada 2026
                <br />
                Nº 00{BIB}
              </p>
            </div>

            <p className={s.ticketNote}>
              <strong>Instrucciones.</strong> No importa tu ritmo: importa que quieras subir. Rellena
              esta hoja mentalmente y entrégala en una de las dos ventanillas.
            </p>

            <div className={s.formRow}>
              <span className={s.formLabel}>Nombre</span>
              <span className={s.formLine}>
                <span className={s.formHint}>el tuyo</span>
              </span>
            </div>

            <div className={s.formRow}>
              <span className={s.formLabel}>Categoría</span>
              <ul className={s.formChecks}>
                {categories.map((c) => (
                  <li key={c.code}>
                    <span className={s.kitBox} aria-hidden="true" />
                    {c.name}
                  </li>
                ))}
              </ul>
            </div>

            <dl className={s.formGrid}>
              <div>
                <dt>Plazas</dt>
                <dd>Ilimitadas</dd>
              </div>
              <div>
                <dt>Ritmo</dt>
                <dd>El tuyo</dd>
              </div>
              <div>
                <dt>Requisito</dt>
                <dd>Querer subir</dd>
              </div>
              <div>
                <dt>Cuota</dt>
                <dd>Pregúntanos</dd>
              </div>
            </dl>

            <div className={s.deliverRow}>
              <p className={s.formLabel}>Entrega de la inscripción</p>
              <Stamp className={s.ticketStamp} tone="orange">
                Sin
                <br />
                sorteo
              </Stamp>
            </div>
            <ul className={s.ctaList}>
              <li>
                <a href={club.instagram} target="_blank" rel="noopener noreferrer" className={s.cta}>
                  <span className={s.ctaWindow}>Ventanilla 1 · Instagram ↗</span>
                  <span className={s.ctaValue}>{club.instagramHandle}</span>
                </a>
              </li>
              <li>
                {/* contactEmail is still a placeholder in content/club.ts: label it as unconfirmed */}
                <a href={`mailto:${club.contactEmail}`} className={`${s.cta} ${s.ctaSecondary}`}>
                  <span className={s.ctaWindow}>Ventanilla 2 · Correo</span>
                  <span className={s.ctaAddress}>
                    <span className={s.tbc}>Por confirmar</span>
                    <span className={s.ctaValue}>{club.contactEmail}</span>
                  </span>
                </a>
              </li>
            </ul>

          </div>

          <div className={s.ticketStub} aria-hidden="true">
            <p className={s.stubTitle}>Entrada</p>
            <div className={s.stubInfo}>
              <p className={s.stubLine}>
                Admite
                <strong>1 {club.memberTermSingular}/a</strong>
              </p>
              <p className={s.stubLine}>
                Válida
                <strong>Toda la temporada</strong>
              </p>
              <p className={s.stubLine}>
                Salida
                <strong>Donde acaba el asfalto</strong>
              </p>
              <Barcode value={`LOV${BIB}`} className={s.ticketBarcode} />
              <p className={s.stubSerial}>Nº 00{BIB}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

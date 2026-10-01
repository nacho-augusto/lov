"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { photos, seasonEvents, type ClubPhoto, type PhotoTag } from "@/content";
import { playSfx } from "./sfx";
import { useSettings } from "./store";

const FILTERS: { id: "todas" | PhotoTag; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "carrera", label: "Carrera" },
  { id: "nocturna", label: "Nocturna" },
  { id: "cumbre", label: "Cumbre" },
  { id: "grupo", label: "Grupo" },
  { id: "bandera", label: "Bandera" },
  { id: "equipacion", label: "Equipación" },
];

const PAGE = 12;

function Capture({ p, index }: { p: ClubPhoto; index: number }) {
  const [on, setOn] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [armed, setArmed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const event = seasonEvents.find((e) => e.id === p.event);
  const active = on || pinned;
  const arm = () => {
    if (!armed) setArmed(true);
  };
  return (
    <li className="lq-cap">
      <figure>
        <button
          type="button"
          className={`lq-cap__btn${active ? " is-on" : ""}${loaded ? " is-loaded" : ""}`}
          aria-pressed={pinned}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") {
              arm();
              setOn(true);
            }
          }}
          onPointerLeave={() => setOn(false)}
          onFocus={() => {
            arm();
            setOn(true);
          }}
          onBlur={() => setOn(false)}
          onClick={() => {
            arm();
            setPinned((v) => !v);
          }}
        >
          <Image
            className="lq-cap__px"
            src={`/lov-quest/caps/${p.id}-8bit.png`}
            width={96}
            height={96}
            alt={p.alt}
            unoptimized
          />
          {armed && (
            <>
              {(["m1", "m2", "m3"] as const).map((m) => (
                <Image
                  key={m}
                  className={`lq-cap__m lq-cap__${m}`}
                  src={`/lov-quest/caps/${p.id}-${m}.png`}
                  width={48}
                  height={48}
                  alt=""
                  unoptimized
                />
              ))}
              <Image
                className="lq-cap__real"
                src={p.src}
                alt=""
                fill
                sizes="(max-width: 700px) 46vw, (max-width: 1200px) 30vw, 300px"
                quality={75}
                onLoad={() => setLoaded(true)}
              />
            </>
          )}
          <span className="lq-cap__slot" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="lq-sr">{pinned ? "Volver a 8 bits" : "Ver en alta resolución"}</span>
        </button>
        <figcaption className="lq-cap__cap">
          <span>{p.caption}</span>
          {event && <small>{event.dateLabel}</small>}
        </figcaption>
      </figure>
    </li>
  );
}

export function Captures() {
  const settings = useSettings();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("todas");
  const [limit, setLimit] = useState(PAGE);
  const list = useMemo(() => (filter === "todas" ? photos : photos.filter((p) => p.tags.includes(filter))), [filter]);
  const shown = list.slice(0, limit);

  return (
    <div className="lq-caps">
      <div className="lq-caps__filters" role="group" aria-label="Filtrar capturas">
        {FILTERS.map((f) => {
          const n = f.id === "todas" ? photos.length : photos.filter((p) => p.tags.includes(f.id as PhotoTag)).length;
          const on = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              className={`lq-chip${on ? " is-on" : ""}`}
              onClick={() => {
                setFilter(f.id);
                setLimit(PAGE);
                if (settings.sound) playSfx("menu");
              }}
            >
              {f.label} <span>{n}</span>
            </button>
          );
        })}
      </div>
      <p className="lq-caps__status" aria-live="polite">
        {list.length} capturas desbloqueadas{filter !== "todas" ? ` con la etiqueta «${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()}»` : ""}.
      </p>
      <ul className="lq-caps__grid">
        {shown.map((p, i) => (
          <Capture key={`${filter}-${p.id}`} p={p} index={i} />
        ))}
      </ul>
      {list.length > limit && (
        <div className="lq-caps__more">
          <button type="button" className="lq-btn lq-btn--white" onClick={() => setLimit((l) => l + PAGE)}>
            Cargar {Math.min(PAGE, list.length - limit)} capturas más
          </button>
        </div>
      )}
    </div>
  );
}

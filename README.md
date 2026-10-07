# C.D. La Otra Vertiente — club website

Informational site for the trail running and mountain club **C.D. La Otra Vertiente**
(Rincón de la Victoria, Axarquía, Málaga). One Next.js app with a **selector** (`/`) and
several **design directions** to compare and pick from. User-facing copy is in Spanish.

## Run locally

```bash
npm install --legacy-peer-deps   # React 19 peer ranges
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Direction | Style |
|-------|-----------|-------|
| `/` | Selector | Cards for every direction, with screenshots |
| `/claro` | **Claro** | Light outdoor brand. Built on `nuevos_heros/lov-hero-claro-ultra5k-v4.png`: a club runner on the ridge while three fog layers drift (and flow with scroll) behind and in front of him |
| `/hora-dorada` | **Hora dorada** | Cinematic documentary. Built on `nuevos_heros/hero.png`: the four runners advance as you scroll (scrubbed video), letterbox, subtitles, season as scenes, end credits |
| `/frontal` | **Frontal** | Night run from 22:47 to sunrise; the pointer is a headlamp |
| `/lov-quest` | **LOV Quest** | 8-bit platform game; the hero is playable |
| `/dorsal` | **Dorsal** | Brutalist race poster in black and orange; halftone photos |
| `/indice` | **Índice** | Minimal editorial "mountain book" with an altitude rail |
| `/cumbre-nocturna`, `/curvas-de-nivel`, `/vertice` | First round | Kept as an archive for comparison |

Club back-office: `/admin` (board panel, invitation only) and `/socio` (members' zone, email
link). Design and status in `docs/admin/DESIGN.md`; database in `db/README.md`.

## Stack

Next.js 16 (App Router, React 19, TS) · Tailwind v4 · GSAP + ScrollTrigger · Lenis ·
React Three Fiber (first-round `/vertice`, `/cumbre-nocturna`) · Framer Motion (selector).
Every direction respects `prefers-reduced-motion` and keeps its content in real DOM.

Note: CSS-module rules are unlayered, so they beat Tailwind v4's layered utilities on the
same element (e.g. a module `display` wins over `hidden`). Own such properties in the module.

## Structure

- `app/<route>/` — one folder per direction; each `layout.tsx` scopes its own fonts.
- `components/<route>/` — the components of each direction (no cross-imports between them).
- `components/shared/` — logo, smooth scroll and pieces used by the first-round designs.
- `content/` — **single source of truth**: club identity, peaks, values, races,
  `season.ts` (2026 season reconstructed from the club's Instagram posts), `photos.ts`
  (the 21 Instagram photos with alt text and captions) and `sponsors.ts`.
- `public/club/` — the club's Instagram photos · `public/heroes/` — hero assets
  (Claro plate, fog strips and ridge mask; Hora dorada clips and posters) ·
  `public/selector/` — selector thumbnails · `public/{dorsal,frontal,lov-quest}/` — assets
  of those directions.
- `nuevos_heros/` — the two source hero images supplied by the club.

### Hero assets

- **Claro:** `plate.jpg` is the supplied hero with the walker replaced by a runner in the
  club shirt (AI-assisted edit) and the baked-in text removed. `ridge-mask.png` re-draws the
  near ridge over the back fog, so clouds pass behind the runner and in front of the far peaks.
- **Hora dorada:** `runners.mp4` (1080p) and `runners-portrait.mp4` (phones) are a 4 s
  AI-generated clip animated from `hero.png`, encoded with 8-frame GOPs and no B-frames so
  scroll-scrubbing can seek quickly. Only the first 3.2 s are used: after that the lettering
  on the shirts starts to degrade.

## Before publishing (pending)

- [ ] Replace the placeholder contact email in `content/club.ts` (`info@laotravertiente.es`).
      Every new direction labels it "por confirmar" and leads with Instagram.
- [ ] Confirm permission to use the Instagram photos (`public/club/`, `public/gallery/`).
- [ ] Verify the elevations of Navachica and Pico del Cielo in `content/peaks.ts`.
- [ ] `stats` in `content/club.ts` ("+100 cumbres") is unverified; only the first round uses it.
- [ ] The 2026 season events are past (Apr–Aug); add the next dates when the club has them.
- [ ] Pick the favourite direction(s); the rest can be removed.

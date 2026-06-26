# C.D. La Otra Vertiente — web del club

Landing informativa del club de trail running y montaña **C.D. La Otra Vertiente**
(Rincón de la Victoria, Axarquía, Málaga). Una sola app con un **selector** y **tres
direcciones de diseño** entre las que elegir; en las tres, la montaña del logo se
**escala al hacer scroll**.

## Arrancar en local

```bash
npm install --legacy-peer-deps   # ya instalado; --legacy-peer-deps por React 19
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Rutas:

| Ruta | Dirección | Estilo |
|------|-----------|--------|
| `/` | Selector | Elige una de las tres versiones |
| `/cumbre-nocturna` | **Cumbre Nocturna** | Cine inmersivo 3D (R3F): asciendes el macizo de la hora azul al amanecer |
| `/curvas-de-nivel` | **Curvas de Nivel** | Editorial topográfico (SVG): un corredor escala la cresta y planta bandera |
| `/vertice` | **Vértice** | WebGL/HUD: terreno wireframe con altímetro y banda de altitud |

## Stack

Next.js 16 (App Router, React 19, TS) · Tailwind v4 · GSAP + ScrollTrigger + MotionPath ·
Lenis (scroll suave) · React Three Fiber + drei + postprocessing · Framer Motion.

Accesibilidad/rendimiento: respeta `prefers-reduced-motion`, detecta WebGL y cae a un
fallback sin canvas, todo el contenido vive en DOM real, y el canvas 3D va con DPR
limitado y carga diferida.

## Estructura

- `app/` — rutas (selector + 3 direcciones) y `layout`/`globals.css` (tokens de marca).
- `content/` — **única fuente de verdad** (club, picos, carreras, valores, copys, galería).
- `components/shared/` — nav, footer, contacto, galería, scroll suave, marca/logo.
- `components/{cumbre-nocturna,curvas-de-nivel,vertice}/` — cada dirección.
- `lib/mountain.ts` — silueta de montaña compartida (derivada del logo).
- `public/gallery/` — fotos reales del club · `public/generated/` — imágenes generadas.

## Antes de publicar (pendientes)

- [ ] Reemplazar el email de contacto en `content/club.ts` (`info@laotravertiente.es`).
- [ ] Confirmar permiso para usar las fotos de Instagram (`public/gallery/`).
- [ ] Verificar las cotas de Navachica y Pico del Cielo en `content/peaks.ts`.
- [ ] Elegir la dirección favorita (las otras pueden retirarse o quedarse).

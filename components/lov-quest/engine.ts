// LOV QUEST engine: the title-screen world + an endless-runner mini game, drawn on a
// low-resolution canvas scaled up with nearest-neighbour. No React in here: the
// hero component drives it through a tiny imperative API and receives callbacks.

import { peaks } from "@/content";
import { FRAMES, type FrameName } from "./atlas";
import { Col, PAL } from "./palette";
import { drawText, textWidth } from "./pixfont";
import { buildLayers, dith, drawBaliza, remap, stamp, type Layers } from "./world";
import type { RunnerClass, SpriteVariant } from "./classes";

export type GameState = "title" | "playing" | "paused" | "over";

export interface Hud {
  alt: number;
  km: number;
  hearts: number;
  maxHearts: number;
  points: number;
  /** Next goal: the next Málaga summit by elevation, then the OMD's D+. */
  goal: { name: string; alt: number; from: number } | null;
}

export interface OverInfo {
  alt: number;
  km: number;
  points: number;
  best: number;
  newBest: boolean;
  lastPeak: string | null;
}

export type Sfx = "jump" | "gel" | "hit" | "peak" | "over" | "start";

export interface EngineCallbacks {
  state: (s: GameState, info?: OverInfo) => void;
  hud: (h: Hud) => void;
  toast: (t: { title: string; text?: string; tone: "gold" | "orange" | "sky" }) => void;
  sfx: (s: Sfx) => void;
  layout: (l: { scale: number; w: number; h: number; groundY: number }) => void;
}

type ObstacleType = "rock_s" | "rock_l" | "bush" | "goat";

interface Obstacle {
  type: ObstacleType;
  x: number; // world x (left)
  w: number;
  h: number;
  vx: number;
  passed: boolean;
  hit: boolean;
}

interface Gel {
  x: number;
  y: number; // height above ground (px) of the gel's bottom
  phase: number;
  taken: boolean;
}

interface Particle {
  kind: "dust" | "spark" | "text";
  x: number; // world
  y: number; // screen
  vx: number;
  vy: number;
  t: number;
  life: number;
  text?: string;
  color?: string;
}

interface Flag {
  x: number; // world
  label: string;
}

const G = 1050; // gravity px/s^2
const JUMP_V = 272;
const ALT_PER_PX = 0.085; // metres of elevation per pixel run
const KM_PER_PX = 0.00045;
const GEL_ALT = 15;

const MILESTONES = [...peaks]
  .sort((a, b) => a.elevation - b.elevation)
  .map((p) => ({ alt: p.elevation, name: p.name }));
const OMD = 8727;

function mod(a: number, n: number) {
  return ((a % n) + n) % n;
}

function fmt(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export class LqEngine {
  private ctx: CanvasRenderingContext2D;
  private atlas: HTMLImageElement | null = null;
  private atlasNight: HTMLCanvasElement | null = null;
  private layers: Layers | null = null;
  private W = 320;
  private H = 180;
  private scale = 1;
  private raf = 0;
  private last = 0;
  private running = false;
  private visible = true;
  private destroyed = false;

  // settings
  private reduced = false;
  /** Night as rendered (user setting OR a night class such as the noctámbulo). */
  private night = false;
  /** The user's own night-mode setting (menu / cheat code). */
  private nightSetting = false;
  private cls: RunnerClass;

  // world
  private camX = 0;
  private scrollY = 0;
  private lastScrollY = 0;
  private t = 0; // seconds since start (animation clock)
  private state: GameState = "title";

  // runner
  private runnerX = 80;
  private ry = 0; // height above ground
  private vy = 0;
  private onGround = true;
  private jumpHeld = false;
  private buffer = 0;
  private coyote = 0;
  private hurtT = 0;
  private invuln = 0;
  private animT = 0;
  private demoHold = 0;

  // run stats
  private speed = 70;
  private runTime = 0;
  private alt = 0;
  private km = 0;
  private points = 0;
  private hearts = 3;
  private maxHearts = 3;
  private milestoneIdx = 0;
  private omdDone = false;
  private lastPeak: string | null = null;
  private best = 0;

  private obstacles: Obstacle[] = [];
  private gels: Gel[] = [];
  private particles: Particle[] = [];
  private flags: Flag[] = [];
  private nextSpawn = 0;
  private shake = 0;
  private hudT = 0;
  private overT = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private cb: EngineCallbacks,
    opts: { reduced: boolean; cls: RunnerClass; night: boolean; best: number },
  ) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2D canvas not available");
    this.ctx = ctx;
    this.reduced = opts.reduced;
    this.cls = opts.cls;
    this.nightSetting = opts.night;
    this.night = opts.night || opts.cls.game.night;
    this.best = opts.best;
    const img = new Image();
    img.decoding = "async";
    img.src = "/lov-quest/atlas.png";
    img.onload = () => {
      if (this.destroyed) return;
      this.atlas = img;
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      this.atlasNight = remap(c);
      this.rebuild();
      this.frame();
    };
  }

  // ------------------------------------------------------------ public API

  resize(cssW: number, cssH: number, dpr: number) {
    const devH = cssH * dpr;
    const devW = cssW * dpr;
    let k = Math.max(1, Math.round(devH / 216));
    k = Math.max(1, Math.min(k, Math.floor(devW / 180)));
    const W = Math.ceil(devW / k);
    const H = Math.ceil(devH / k);
    this.scale = k / dpr;
    if (W !== this.W || H !== this.H || !this.layers) {
      this.W = W;
      this.H = H;
      this.canvas.width = W;
      this.canvas.height = H;
      this.ctx.imageSmoothingEnabled = false;
      this.rebuild();
    }
    this.canvas.style.width = `${(W * k) / dpr}px`;
    this.canvas.style.height = `${(H * k) / dpr}px`;
    this.runnerX = Math.round(Math.min(this.W * 0.24, 104));
    this.cb.layout({ scale: this.scale, w: this.W, h: this.H, groundY: this.layers?.groundY ?? this.H - 24 });
    this.frame();
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (!v && this.state === "playing") this.pause();
    this.sync();
  }

  setScroll(y: number) {
    this.scrollY = y;
    if (this.state === "title" && this.reduced) return;
    if (!this.running) this.frame();
  }

  setReduced(r: boolean) {
    this.reduced = r;
    this.sync();
    this.frame();
  }

  setClass(c: RunnerClass) {
    this.cls = c;
    if (this.state !== "playing") this.setNight(this.nightSetting || c.game.night, true);
    this.frame();
  }

  setNight(n: boolean, internal = false) {
    if (!internal) this.nightSetting = n;
    const want = internal ? n : n || this.cls.game.night;
    if (want === this.night) return;
    this.night = want;
    this.frame();
  }

  getState() {
    return this.state;
  }

  start() {
    if (this.destroyed) return;
    this.resetRun();
    this.setState("playing");
    this.cb.sfx("start");
    this.sync();
  }

  pause() {
    if (this.state !== "playing") return;
    this.setState("paused");
    this.sync();
  }

  resume() {
    if (this.state !== "paused") return;
    this.setState("playing");
    this.last = 0;
    this.sync();
  }

  toTitle() {
    this.obstacles = [];
    this.gels = [];
    this.flags = [];
    this.particles = [];
    this.ry = 0;
    this.vy = 0;
    this.onGround = true;
    this.hurtT = 0;
    this.invuln = 0;
    this.speed = 70;
    this.nextSpawn = this.camX + this.W + 120;
    this.setNight(this.nightSetting || this.cls.game.night, true);
    this.setState("title");
    this.sync();
    this.frame();
  }

  jumpDown() {
    if (this.state !== "playing") return;
    this.jumpHeld = true;
    this.buffer = 0.12;
  }

  jumpUp() {
    this.jumpHeld = false;
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.running = false;
  }

  // ------------------------------------------------------------ internals

  private setState(s: GameState, info?: OverInfo) {
    this.state = s;
    this.cb.state(s, info);
  }

  /** Start/stop the RAF loop depending on visibility, state and motion prefs. */
  private sync() {
    const animate = this.visible && (this.state === "playing" || (this.state === "title" && !this.reduced) || this.state === "over");
    if (animate && !this.running) {
      this.running = true;
      this.last = 0;
      this.raf = requestAnimationFrame(this.loop);
    } else if (!animate && this.running) {
      this.running = false;
      cancelAnimationFrame(this.raf);
      this.frame();
    }
  }

  private loop = (now: number) => {
    if (!this.running || this.destroyed) return;
    const dt = this.last ? Math.min(1 / 30, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  /** Render a single frame (used while the loop is stopped). */
  private frame() {
    if (this.running || !this.layers) return;
    this.render();
  }

  private rebuild() {
    this.layers = buildLayers({ W: this.W, H: this.H, atlas: this.atlas });
    this.prerender();
    if (!this.nextSpawn) this.nextSpawn = this.W + 160;
  }

  private sunImg: HTMLCanvasElement | null = null;
  private moonImg: HTMLCanvasElement | null = null;
  private beamImg: HTMLCanvasElement | null = null;
  private beamReach = 120;

  /** Bake the sun, the moon and the headlamp light once (per-frame pixel loops are too slow on old GPUs). */
  private prerender() {
    const L = this.layers!;
    const mk = (w: number, h: number) => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, w);
      c.height = Math.max(1, h);
      return c;
    };
    // sun: the club's half sun, with a dithered halo and retro bands
    const R = Math.round(L.S * 0.22);
    const pad = 4;
    const sun = mk(2 * (R + pad) + 1, 2 * (R + pad) + 1);
    const sctx = sun.getContext("2d")!;
    for (let dy = -R - pad; dy <= R + pad; dy++) {
      for (let dx = -R - pad; dx <= R + pad; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        let col = -1;
        if (d <= R) {
          col = Col.Orange;
          if (d > R - 1.5 && (dx < 0 || dy < -R * 0.5)) col = Col.Light;
          if (dy > 0 && dy % 6 < 2 && d > R * 0.35) col = Col.Deep;
        } else if (d <= R + pad && dith(dx + 64, dy + 64, d <= R + 2 ? 6 : 2)) {
          col = Col.Light;
        }
        if (col >= 0) {
          sctx.fillStyle = PAL[col];
          sctx.fillRect(dx + R + pad, dy + R + pad, 1, 1);
        }
      }
    }
    this.sunImg = sun;
    // moon
    const MR = Math.max(5, Math.round(L.S * 0.05));
    const moon = mk(2 * MR + 1, 2 * MR + 1);
    const mctx = moon.getContext("2d")!;
    for (let dy = -MR; dy <= MR; dy++) {
      for (let dx = -MR; dx <= MR; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > MR) continue;
        let col: number = d > MR - 1.2 ? Col.Mist : Col.White;
        if (((dx * 7 + dy * 3) & 15) === 3 && d < MR - 2) col = Col.Mist;
        if (dx > MR * 0.35 && dy > -MR * 0.6) col = Col.Stone;
        mctx.fillStyle = PAL[col];
        mctx.fillRect(dx + MR, dy + MR, 1, 1);
      }
    }
    this.moonImg = moon;
    // headlamp light: a dithered gold wash that fades with distance (the cone clip shapes it)
    const reach = Math.round(Math.min(this.W * 0.55, 150));
    this.beamReach = reach;
    const bh = 48;
    const beam = mk(reach, bh);
    const bctx = beam.getContext("2d")!;
    bctx.fillStyle = PAL[Col.Gold];
    for (let x = 0; x < reach; x++) {
      const t = x / reach;
      for (let y = 0; y < bh; y++) {
        // brighter close to the lamp and where the cone meets the ground (y≈34)
        const ground = Math.max(0, 1 - Math.abs(y - 35) / 6);
        const level = Math.round((1 - t) * 2.2 + ground * (1 - t * 0.6) * 3);
        if (level > 0 && dith(x, y, level)) bctx.fillRect(x, y, 1, 1);
      }
    }
    this.beamImg = beam;
  }

  private resetRun() {
    this.obstacles = [];
    this.gels = [];
    this.particles = [];
    this.flags = [];
    this.runTime = 0;
    this.alt = 0;
    this.km = 0;
    this.points = 0;
    this.maxHearts = this.cls.game.hearts;
    this.hearts = this.maxHearts;
    this.milestoneIdx = 0;
    this.omdDone = false;
    this.lastPeak = null;
    this.ry = 0;
    this.vy = 0;
    this.onGround = true;
    this.hurtT = 0;
    this.invuln = 0;
    this.buffer = 0;
    this.jumpHeld = false;
    this.speed = 104 * this.cls.game.speed;
    this.nextSpawn = this.camX + this.W + 40;
    this.overT = 0;
    this.setNight(this.nightSetting || this.cls.game.night, true);
    this.emitHud(true);
  }

  private emitHud(force = false) {
    if (!force && this.hudT > 0) return;
    this.hudT = 0.1;
    const m = MILESTONES[this.milestoneIdx];
    const prev = this.milestoneIdx > 0 ? MILESTONES[this.milestoneIdx - 1].alt : 0;
    const goal = m
      ? { name: m.name, alt: m.alt, from: prev }
      : !this.omdDone
        ? { name: "Desnivel de la OMD", alt: OMD, from: MILESTONES[MILESTONES.length - 1].alt }
        : null;
    this.cb.hud({
      alt: this.alt,
      km: this.km,
      hearts: this.hearts,
      maxHearts: this.maxHearts,
      points: this.points,
      goal,
    });
  }

  private update(dt: number) {
    this.t += dt;
    this.hudT -= dt;
    const L = this.layers;
    if (!L) return;

    if (this.state === "title") {
      // attract mode: relaxed jog, scroll pushes the world forward
      this.speed = 64;
      const ds = Math.abs(this.scrollY - this.lastScrollY);
      this.lastScrollY = this.scrollY;
      this.camX += this.speed * dt + Math.min(ds, 300) * 0.9;
      this.demo();
    } else if (this.state === "playing") {
      this.runTime += dt;
      const ramp = Math.min(128, this.runTime * 1.55 * this.cls.game.speed);
      this.speed = 104 * this.cls.game.speed + ramp;
      const dx = this.speed * dt;
      this.camX += dx;
      this.alt += dx * ALT_PER_PX;
      this.km += dx * KM_PER_PX;
      this.checkMilestones();
      this.emitHud();
    } else if (this.state === "over") {
      this.overT += dt;
      this.speed = Math.max(0, this.speed - 420 * dt);
      this.camX += this.speed * dt;
      if (this.overT > 1.6 && this.speed <= 0) {
        // nothing left to animate
        this.running = false;
        cancelAnimationFrame(this.raf);
      }
    }

    // runner physics
    if (this.state !== "over") {
      this.buffer -= dt;
      this.coyote = this.onGround ? 0.08 : this.coyote - dt;
      if (this.buffer > 0 && (this.onGround || this.coyote > 0)) {
        this.vy = JUMP_V * this.cls.game.jump;
        this.onGround = false;
        this.coyote = 0;
        this.buffer = 0;
        if (this.state === "playing") this.cb.sfx("jump");
      }
    }
    if (!this.onGround) {
      const rising = this.vy > 0;
      const held = this.state === "title" ? this.demoHold > 0 : this.jumpHeld;
      this.vy -= G * dt * (rising && !held ? 2.3 : 1);
      this.ry += this.vy * dt;
      if (this.ry <= 0) {
        this.ry = 0;
        this.vy = 0;
        this.onGround = true;
        this.puff();
      }
    }
    this.demoHold -= dt;
    this.hurtT -= dt;
    this.invuln -= dt;
    this.shake = Math.max(0, this.shake - dt);
    this.animT += dt * (this.speed / 64) * 11;

    this.spawn();
    this.updateEntities(dt);
  }

  /** Title-screen demo: the runner auto-jumps obstacles like an arcade attract mode. */
  private demo() {
    if (!this.onGround) return;
    const feetX = this.camX + this.runnerX + 18;
    for (const o of this.obstacles) {
      const d = o.x - feetX;
      if (d > 0 && d < this.speed * 0.34 + 4) {
        this.buffer = 0.05;
        this.demoHold = o.type === "goat" || o.type === "rock_l" ? 0.3 : 0.08;
        break;
      }
    }
  }

  private spawn() {
    const edge = this.camX + this.W + 24;
    while (this.nextSpawn < edge) {
      const x = this.nextSpawn;
      const playing = this.state === "playing";
      const r = Math.random();
      let type: ObstacleType = "rock_s";
      if (playing) {
        if (this.alt > 120 && r < 0.26) type = "goat";
        else if (r < 0.48) type = "bush";
        else if (r < 0.7) type = "rock_l";
        else type = "rock_s";
      } else {
        type = r < 0.4 ? "rock_s" : r < 0.7 ? "bush" : r < 0.85 ? "goat" : "rock_l";
      }
      const [, , w, h] = FRAMES[type === "goat" ? "goat0" : type];
      this.obstacles.push({ type, x, w, h, vx: type === "goat" ? -16 : 0, passed: false, hit: false });
      // gels: above some obstacles (reward the jump) or floating in the gaps
      if (Math.random() < (playing ? 0.42 : 0.3)) {
        this.gels.push({ x: x + w / 2 - 4, y: h + 12 + Math.random() * 10, phase: Math.random() * 6, taken: false });
      }
      let gap: number;
      if (playing) {
        const min = this.speed * 0.66 + 56;
        gap = min + Math.random() * (110 + this.speed * 0.35);
        // occasional tight double obstacle later in the run
        if (this.alt > 500 && Math.random() < 0.18) gap = Math.max(w + 22, this.speed * 0.2);
      } else {
        gap = 160 + Math.random() * 220;
      }
      this.nextSpawn = x + w + gap;
    }
  }

  private updateEntities(dt: number) {
    const runnerL = this.camX + this.runnerX + 9;
    const runnerR = this.camX + this.runnerX + 19;
    const runnerBottom = this.ry; // height above ground
    const runnerTop = this.ry + 24;

    for (const o of this.obstacles) {
      o.x += o.vx * dt;
      if (this.state === "over") continue;
      // collision (forgiving hitboxes)
      const oL = o.x + 3;
      const oR = o.x + o.w - 3;
      const oTop = o.h - 3;
      if (!o.hit && oR > runnerL && oL < runnerR && runnerBottom < oTop && runnerTop > 0) {
        if (this.state === "playing" && this.invuln <= 0) {
          o.hit = true;
          this.hit();
        }
      }
      if (!o.passed && o.x + o.w < runnerL) {
        o.passed = true;
        if (this.state === "playing" && !o.hit) this.points += 10;
      }
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > this.camX - 40);

    for (const g of this.gels) {
      if (g.taken) continue;
      const gy = g.y + Math.sin(this.t * 4 + g.phase) * 2;
      if (g.x + 9 > runnerL && g.x < runnerR && runnerTop > gy && runnerBottom < gy + 13) {
        g.taken = true;
        if (this.state === "playing") {
          this.alt += GEL_ALT;
          this.points += 50;
          this.cb.sfx("gel");
          this.emitHud(true);
        }
        this.particles.push({ kind: "spark", x: g.x + 1, y: this.layers!.groundY - gy - 10, vx: 0, vy: 0, t: 0, life: 0.3 });
        if (this.state === "playing") {
          this.particles.push({
            kind: "text",
            x: g.x - 4,
            y: this.layers!.groundY - gy - 14,
            vx: 0,
            vy: -18,
            t: 0,
            life: 0.9,
            text: `+${GEL_ALT}M`,
            color: PAL[Col.Gold],
          });
        }
      }
    }
    this.gels = this.gels.filter((g) => !g.taken && g.x > this.camX - 20);

    for (const p of this.particles) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.t < p.life);
    this.flags = this.flags.filter((f) => f.x > this.camX - 60);
  }

  private hit() {
    this.hearts -= 1;
    this.invuln = 1.3;
    this.hurtT = 0.4;
    if (!this.reduced) this.shake = 0.25;
    this.cb.sfx("hit");
    this.emitHud(true);
    if (this.hearts <= 0) this.gameOver();
  }

  private gameOver() {
    const newBest = this.alt > this.best;
    if (newBest) this.best = this.alt;
    this.hurtT = 9;
    this.overT = 0;
    this.cb.sfx("over");
    this.setState("over", {
      alt: this.alt,
      km: this.km,
      points: this.points,
      best: this.best,
      newBest,
      lastPeak: this.lastPeak,
    });
  }

  private checkMilestones() {
    while (this.milestoneIdx < MILESTONES.length && this.alt >= MILESTONES[this.milestoneIdx].alt) {
      const m = MILESTONES[this.milestoneIdx];
      this.milestoneIdx++;
      this.lastPeak = `${m.name} (${fmt(m.alt)} m)`;
      this.points += 500;
      this.flags.push({ x: this.camX + this.W + 10, label: `${m.name} ${m.alt}M` });
      const maroma = m.alt >= 2069;
      this.cb.toast({
        title: maroma ? "¡Techo de Málaga!" : "¡Cumbre superada!",
        text: `${m.name} · ${fmt(m.alt)} m`,
        tone: maroma ? "gold" : "orange",
      });
      this.cb.sfx("peak");
    }
    if (!this.omdDone && this.alt >= OMD) {
      this.omdDone = true;
      this.points += 5000;
      this.cb.toast({ title: "¡Desnivel de la OMD!", text: "+8.727 m: nivel ultrafondista", tone: "gold" });
      this.cb.sfx("peak");
    }
  }

  private puff() {
    const L = this.layers;
    if (!L) return;
    this.particles.push({
      kind: "dust",
      x: this.camX + this.runnerX + 10,
      y: L.groundY - 4,
      vx: -this.speed * 0.25,
      vy: 0,
      t: 0,
      life: 0.3,
    });
  }

  // ------------------------------------------------------------ render

  private render() {
    const L = this.layers;
    if (!L) return;
    const ctx = this.ctx;
    const V = this.night ? L.night : L.day;
    const W = this.W;
    const night = this.night;
    const reducedStatic = this.reduced && this.state === "title";
    const cam = reducedStatic ? 0 : this.camX;

    ctx.save();
    if (this.shake > 0) {
      const s = Math.round(Math.sin(this.t * 90) * 2);
      ctx.translate(s, 0);
    }

    // sky
    ctx.drawImage(V.sky, 0, 0);
    if (night) this.drawStars();

    // sun (logo half-sun) or moon
    this.drawSun(night);

    // clouds
    const cloudBase = Math.max(6, L.farTop - 20);
    V.clouds.forEach((c, i) => {
      const speed = 3 + i * 1.5;
      const span = W + c.width + 40;
      const x = W - mod(this.t * (reducedStatic ? 0 : speed) + cam * 0.04 + i * (span / V.clouds.length) * 1.7, span);
      const y = cloudBase + ((i * 37) % Math.max(20, Math.round(L.farTop * 0.8 + 18))) - 6;
      ctx.drawImage(c, Math.round(x), Math.round(Math.max(2, y)));
    });

    // griffon vultures soaring over the sierra
    if (!night) {
      ctx.fillStyle = PAL[Col.Night];
      for (let i = 0; i < 2; i++) {
        const span = W + 40;
        const bx = Math.round(mod(this.t * (reducedStatic ? 0 : 7 + i * 3) + i * 170 + cam * 0.03, span) - 20);
        const by = Math.round(L.farTop + 6 + i * 14 + Math.sin(this.t * 0.8 + i) * 3);
        const up = !reducedStatic && Math.floor(this.t * 3 + i) % 2 === 0;
        ctx.fillRect(bx, by, 1, 1);
        ctx.fillRect(bx - 1, by + (up ? -1 : 0), 1, 1);
        ctx.fillRect(bx + 1, by + (up ? -1 : 0), 1, 1);
        ctx.fillRect(bx - 2, by + (up ? -2 : 1), 1, 1);
        ctx.fillRect(bx + 2, by + (up ? -2 : 1), 1, 1);
      }
    }

    // far sierras (La Maroma lives here)
    const farOff = cam * 0.06 + (L.maromaX - Math.round(W * 0.8));
    this.tile(V.far, farOff, L.farTop);
    if (this.state === "title" && W >= 260) {
      const mx = Math.round(L.maromaX - mod(farOff, V.far.width));
      for (const sx of [mx, mx + V.far.width, mx - V.far.width]) {
        if (sx > 8 && sx < W - 8) {
          const label = "LA MAROMA 2069";
          const lx = Math.min(W - textWidth(label) - 3, Math.round(sx - 6));
          const ly = L.maromaTop - 9;
          drawText(ctx, label, lx, ly, night ? PAL[Col.Gold] : PAL[Col.Ink], night ? PAL[Col.Ink] : PAL[Col.Mist]);
        }
      }
    }

    // mid layer: Rincón set piece, then rolling Axarquía hills
    const midOff = cam * 0.35;
    if (midOff < V.midSet.width) {
      ctx.drawImage(V.midSet, Math.round(-midOff), L.midTop);
      this.drawSea(midOff, night);
      const start = V.midSet.width - midOff;
      for (let x = start; x < W; x += V.midStrip.width) ctx.drawImage(V.midStrip, Math.round(x), L.midTop);
    } else {
      this.tile(V.midStrip, midOff - V.midSet.width, L.midTop);
    }

    // trail + course markers every 180 px (world space)
    this.tile(V.ground, cam, L.groundTop);
    for (let bx = Math.floor(cam / 180) * 180 + 60; bx < cam + W + 10; bx += 180) {
      drawBaliza(ctx, Math.round(bx - cam), L.groundY - 1, reducedStatic ? 0 : this.t + bx * 0.01);
    }

    // summit flags planted at milestones
    const atlas = night ? this.atlasNight : this.atlas;
    if (this.atlas) {
      for (const f of this.flags) {
        const fx = f.x - cam;
        if (fx < -80 || fx > W + 20) continue;
        const fr: FrameName = Math.floor(this.t * 4) % 2 ? "flag0" : "flag1";
        const fy = L.groundY - FRAMES.flag0[3] + 1;
        stamp(ctx, this.atlas, fr, fx, fy);
        drawText(ctx, f.label, Math.round(fx - 2), fy - 8, PAL[Col.White], PAL[Col.Ink]);
      }
    }

    // gels
    if (this.atlas) {
      for (const g of this.gels) {
        const gx = g.x - cam;
        if (gx < -12 || gx > W + 12) continue;
        const bob = reducedStatic ? 0 : Math.round(Math.sin(this.t * 4 + g.phase) * 2);
        stamp(ctx, this.atlas, "gel", gx, L.groundY - g.y - FRAMES.gel[3] + bob);
      }
    }

    // obstacles (outside the headlamp beam they get the night palette)
    if (atlas && this.atlas) {
      for (const o of this.obstacles) {
        const ox = o.x - cam;
        if (ox < -30 || ox > W + 30) continue;
        const name: FrameName = o.type === "goat" ? (Math.floor(this.t * 6) % 2 ? "goat0" : "goat1") : o.type;
        stamp(ctx, atlas, name, ox, L.groundY - FRAMES[name][3] + 1);
      }
    }

    // particles
    for (const p of this.particles) {
      const px = p.x - cam;
      if (p.kind === "dust" && this.atlas) {
        const fr = Math.min(2, Math.floor((p.t / p.life) * 3));
        stamp(ctx, this.atlas, `dust${fr}` as FrameName, px, p.y);
      } else if (p.kind === "spark" && this.atlas) {
        const fr = Math.min(2, Math.floor((p.t / p.life) * 3));
        stamp(ctx, this.atlas, `spark${fr}` as FrameName, px, p.y);
      } else if (p.kind === "text" && p.text) {
        drawText(ctx, p.text, Math.round(px), Math.round(p.y), p.color ?? PAL[Col.White], PAL[Col.Ink]);
      }
    }

    // headlamp beam at night: re-light the ground and obstacles inside the cone
    if (night) this.drawBeam(cam);

    // runner
    this.drawRunner();

    ctx.restore();
  }

  private tile(img: HTMLCanvasElement, offset: number, y: number) {
    const w = img.width;
    let x = -mod(Math.round(offset), w);
    for (; x < this.W; x += w) this.ctx.drawImage(img, x, y);
  }

  private drawStars() {
    const ctx = this.ctx;
    const L = this.layers!;
    for (let i = 0; i < 46; i++) {
      const x = Math.floor(((i * 97) % 389) / 389 * this.W);
      const y = Math.floor(((i * 53) % 211) / 211 * Math.max(10, L.farTop + 30));
      const tw = this.reduced ? 1 : Math.sin(this.t * 2 + i) > -0.2 ? 1 : 0;
      if (!tw) continue;
      ctx.fillStyle = i % 7 === 0 ? PAL[Col.Gold] : PAL[Col.White];
      ctx.fillRect(x, y, 1, 1);
      if (i % 11 === 0) {
        ctx.fillStyle = PAL[Col.Stone];
        ctx.fillRect(x - 1, y, 1, 1);
        ctx.fillRect(x + 1, y, 1, 1);
        ctx.fillRect(x, y - 1, 1, 1);
        ctx.fillRect(x, y + 1, 1, 1);
      }
    }
  }

  private drawSun(night: boolean) {
    const L = this.layers!;
    const HF = L.farBase - L.farTop;
    if (night) {
      const m = this.moonImg;
      if (!m) return;
      const r = (m.width - 1) / 2;
      const cx = Math.round(this.W * 0.72);
      const cy = Math.round(Math.max(r + 4, L.farTop - r * 2));
      this.ctx.drawImage(m, cx - r, cy - r);
      return;
    }
    const s = this.sunImg;
    if (!s) return;
    const r = (s.width - 1) / 2;
    const cx = Math.round(this.W * 0.8);
    const cy = Math.round(L.farTop + HF * 0.46);
    this.ctx.drawImage(s, cx - r, cy - r);
  }

  private drawSea(midOff: number, night: boolean) {
    // twinkling sparkles on the Mediterranean (only while the coast is on screen)
    const L = this.layers!;
    const ctx = this.ctx;
    const seaW = L.seaEnd - midOff;
    if (seaW <= 0) return;
    const top = L.horizonY + 2;
    const bottom = L.midTop + this.layers!.day.midSet.height - 6;
    for (let i = 0; i < 22; i++) {
      const sx = Math.round(((i * 71) % 293) / 293 * L.seaEnd - midOff);
      if (sx < 0 || sx > seaW - 3) continue;
      const sy = Math.round(top + (((i * 37) % 101) / 101) * Math.max(1, bottom - top));
      const on = this.reduced || Math.sin(this.t * 3 + i * 1.7) > 0.35;
      if (!on) continue;
      ctx.fillStyle = night ? PAL[Col.Stone] : PAL[Col.White];
      ctx.fillRect(sx, sy, 2, 1);
      if (i % 3 === 0) ctx.fillRect(sx + 3, sy, 1, 1);
    }
  }

  private drawBeam(cam: number) {
    const L = this.layers!;
    const ctx = this.ctx;
    if (!this.atlas) return;
    const hx = this.runnerX + 20;
    const hy = L.groundY - Math.round(this.ry) - 26;
    const reach = this.beamReach;
    ctx.save();
    ctx.beginPath();
    // a wedge pointing forward and down: it hits the trail a few steps ahead
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + reach, L.groundY - 30);
    ctx.lineTo(hx + reach, L.groundY + 12);
    ctx.lineTo(hx + Math.round(reach * 0.35), L.groundY + 12);
    ctx.closePath();
    ctx.clip();
    // day-lit ground + obstacles + gels inside the cone
    const g = L.day.ground;
    let x = -mod(Math.round(cam), g.width);
    for (; x < this.W; x += g.width) ctx.drawImage(g, x, L.groundTop);
    for (const o of this.obstacles) {
      const ox = o.x - cam;
      if (ox < -30 || ox > this.W + 30) continue;
      const name: FrameName = o.type === "goat" ? (Math.floor(this.t * 6) % 2 ? "goat0" : "goat1") : o.type;
      stamp(ctx, this.atlas, name, ox, L.groundY - FRAMES[name][3] + 1);
    }
    if (this.beamImg) ctx.drawImage(this.beamImg, hx, L.groundY - 34);
    ctx.restore();
  }

  private runnerFrame(): FrameName {
    const v: SpriteVariant = this.cls.sprite;
    if (this.state === "title" && this.reduced) return `${v}_idle` as FrameName;
    if (this.hurtT > 0) return `${v}_hurt` as FrameName;
    if (!this.onGround) return (this.vy > 40 ? `${v}_jump` : `${v}_fall`) as FrameName;
    if (this.state === "over" || this.speed <= 1) return `${v}_idle` as FrameName;
    return `${v}_run${Math.floor(this.animT) % 8}` as FrameName;
  }

  private drawRunner() {
    const L = this.layers!;
    if (!this.atlas) return;
    if (this.invuln > 0 && this.state === "playing" && Math.floor(this.t * 16) % 2 === 0) return;
    const name = this.runnerFrame();
    const [, , , h] = FRAMES[name];
    const x = this.runnerX;
    const y = L.groundY - h + 2 - Math.round(this.ry);
    // soft shadow on the trail
    const ctx = this.ctx;
    const sw = Math.max(4, 12 - Math.round(this.ry / 6));
    ctx.fillStyle = this.night ? PAL[Col.Ink] : PAL[Col.Earth];
    ctx.fillRect(x + 14 - sw / 2, L.groundY + 1, sw, 1);
    stamp(ctx, this.atlas, name, x, y);
  }
}

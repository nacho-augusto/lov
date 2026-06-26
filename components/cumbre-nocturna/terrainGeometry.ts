import * as THREE from "three";
import { ridgeHeightAt } from "@/lib/mountain";

// Deterministic value-noise FBM so the terrain is stable across reloads.
function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function vnoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const tl = hash2(xi, yi);
  const tr = hash2(xi + 1, yi);
  const bl = hash2(xi, yi + 1);
  const br = hash2(xi + 1, yi + 1);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(tl, tr, u),
    THREE.MathUtils.lerp(bl, br, u),
    v,
  );
}
function fbm(x: number, y: number): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    sum += amp * (vnoise(x * freq, y * freq) * 2 - 1);
    freq *= 2;
    amp *= 0.5;
  }
  return sum;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const smooth = (t: number) => t * t * (3 - 2 * t);

export interface TerrainOpts {
  width?: number;
  depth?: number;
  segX?: number;
  segZ?: number;
  maxH?: number;
}

/**
 * Builds the Cumbre Nocturna massif: a displaced plane whose X-silhouette follows
 * the shared logo ridgeline, banded into a front + back range, snow-capped above a
 * height threshold via vertex colours. Pure function — call once and memoise.
 */
export function buildTerrain(opts: TerrainOpts = {}): THREE.BufferGeometry {
  const { width = 48, depth = 64, segX = 220, segZ = 180, maxH = 19 } = opts;

  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  const rockLow = new THREE.Color("#0b0f15");
  const rockHigh = new THREE.Color("#222a33");
  const snow = new THREE.Color("#e9eef3");
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const xNorm = clamp01(x / width + 0.5);
    const zc = clamp01(z / depth + 0.5);

    // front ridge follows the logo silhouette
    const profile = 1 - ridgeHeightAt(xNorm);
    const frontEnv = Math.exp(-Math.pow((zc - 0.48) / 0.3, 2));
    let h = profile * maxH * frontEnv;

    // a softer back range, offset, for depth
    const backProfile = 1 - ridgeHeightAt((xNorm * 1.6 + 0.25) % 1);
    const backEnv = Math.exp(-Math.pow((zc - 0.82) / 0.22, 2));
    h += backProfile * maxH * 0.5 * backEnv;

    // detail noise, stronger on the slopes
    h += fbm(x * 0.18 + 11, z * 0.18 - 7) * 1.7 * Math.max(frontEnv, 0.28);

    pos.setY(i, h);

    // colour: rock gradient → snow above the snow line
    const rockT = clamp01(h / (maxH * 0.55));
    tmp.copy(rockLow).lerp(rockHigh, smooth(rockT));
    const snowT = smooth(clamp01((h - maxH * 0.52) / (maxH * 0.32)));
    tmp.lerp(snow, snowT);

    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  geo.computeVertexNormals();
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

"use client";

import * as THREE from "three";
import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Html, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { damp3, damp } from "maath/easing";
import { buildTerrain } from "./terrainGeometry";
import { ridgePoints } from "@/lib/mountain";

export type ClimbProgress = { value: number; dir: number; vel: number };

/* ---------- Sky dome: blue hour → orange dawn (dithered) ---------- */
const SKY_VERT = /* glsl */ `
  varying vec3 vPos;
  void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const SKY_FRAG = /* glsl */ `
  varying vec3 vPos;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  // cheap ordered dither to kill gradient banding
  float dither(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  void main(){
    float h = normalize(vPos).y;
    float t = smoothstep(-0.18, 0.6, h);
    vec3 c = mix(uHorizon, uTop, t);
    c += (dither(gl_FragCoord.xy) - 0.5) * (1.6/255.0);
    gl_FragColor = vec4(c, 1.0);
  }
`;

function Sky({ progressRef }: { progressRef: RefObject<ClimbProgress> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color("#060912") },
      uHorizon: { value: new THREE.Color("#101a28") },
    }),
    [],
  );
  const night = useMemo(() => new THREE.Color("#26395a"), []);
  const dawn = useMemo(() => new THREE.Color("#e0641a"), []);
  const topNight = useMemo(() => new THREE.Color("#1a2746"), []);
  const topDawn = useMemo(() => new THREE.Color("#241019"), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  const tmp2 = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const p = progressRef.current?.value ?? 0;
    if (!mat.current) return;
    tmp.copy(night).lerp(dawn, Math.min(p * 1.1, 1));
    (mat.current.uniforms.uHorizon.value as THREE.Color).copy(tmp);
    tmp2.copy(topNight).lerp(topDawn, Math.min(p * 1.1, 1));
    (mat.current.uniforms.uTop.value as THREE.Color).copy(tmp2);
  });

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[340, 48, 24]} />
      <shaderMaterial
        ref={mat}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={SKY_VERT}
        fragmentShader={SKY_FRAG}
      />
    </mesh>
  );
}

/* ---------- Sun: bright soft core + layered halos, rising ---------- */
const GLOW_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const GLOW_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uFalloff;
  void main(){
    float d = distance(vUv, vec2(0.5));
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, uFalloff);
    gl_FragColor = vec4(uColor, a * uIntensity);
  }
`;

function glowUniforms(color: string, intensity: number, falloff: number) {
  return {
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: intensity },
    uFalloff: { value: falloff },
  };
}

function Sun({ progressRef }: { progressRef: RefObject<ClimbProgress> }) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const wide = useMemo(() => glowUniforms("#ff7a1a", 0.4, 1.2), []);
  const tight = useMemo(() => glowUniforms("#ffd9a0", 0.6, 2.4), []);

  useFrame(() => {
    const p = progressRef.current?.value ?? 0;
    // a horizon sun (never a blinding zenith): even at rest a sliver glows so the
    // pre-dawn hero is always present, then it rises gently as you climb
    if (group.current) group.current.position.y = THREE.MathUtils.lerp(-9, 4, p);
    if (light.current) light.current.intensity = THREE.MathUtils.lerp(0.55, 2.2, p);
    wide.uIntensity.value = THREE.MathUtils.lerp(0.3, 0.45, p);
  });

  return (
    <group>
      <directionalLight ref={light} position={[20, 16, -48]} color="#ff9a4d" />
      {/* offset to the side so the summit reads as a back-lit vista, not staring at the sun */}
      <group ref={group} position={[26, -15, -82]}>
        <Billboard>
          <mesh>
            <planeGeometry args={[150, 150]} />
            <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={wide} vertexShader={GLOW_VERT} fragmentShader={GLOW_FRAG} />
          </mesh>
          <mesh>
            <planeGeometry args={[62, 62]} />
            <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} uniforms={tight} vertexShader={GLOW_VERT} fragmentShader={GLOW_FRAG} />
          </mesh>
          <mesh>
            <circleGeometry args={[5, 64]} />
            <meshBasicMaterial color="#ffcf8f" toneMapped={false} />
          </mesh>
        </Billboard>
      </group>
    </group>
  );
}

function Massif() {
  const geo = useMemo(() => buildTerrain(), []);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial vertexColors roughness={0.9} metalness={0.03} />
    </mesh>
  );
}

/* ---------- Distant ridges (atmospheric vista behind the cloud sea) ---------- */
function ridgeShapeGeo(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, -0.5);
  for (const [x, y] of ridgePoints) shape.lineTo(x - 0.5, 0.5 - y);
  shape.lineTo(0.5, -0.5);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function DistantRidges() {
  const geo = useMemo(() => ridgeShapeGeo(), []);
  const layers = [
    { z: -52, sx: 140, sy: 22, y: -3, color: "#243044" },
    { z: -72, sx: 185, sy: 27, y: -2, color: "#36465f" },
    { z: -94, sx: 240, sy: 33, y: -1, color: "#4c5f7d" },
  ];
  return (
    <group>
      {layers.map((l, i) => (
        <mesh key={i} geometry={geo} position={[0, l.y, l.z]} scale={[l.sx, l.sy, 1]}>
          <meshBasicMaterial color={l.color} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Sea of clouds (summit inversion) — a dense, continuous layer ---------- */
function Clouds() {
  const puffs = useMemo(() => {
    let s = 7;
    const rand = () => {
      s = (s * 48271) % 2147483647;
      return s / 2147483647;
    };
    return Array.from({ length: 30 }, () => ({
      // tight vertical band → reads as one inversion layer, not floating blobs
      pos: [(rand() - 0.5) * 96, 4.8 + rand() * 1.6, -8 - rand() * 52] as [number, number, number],
      scale: 22 + rand() * 30,
      uniforms: glowUniforms("#f3cba0", 0.12 + rand() * 0.2, 1.8),
    }));
  }, []);

  return (
    <group>
      {puffs.map((p, i) => (
        <Billboard key={i} position={p.pos}>
          <mesh scale={p.scale}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
              transparent
              depthWrite={false}
              uniforms={p.uniforms}
              vertexShader={GLOW_VERT}
              fragmentShader={GLOW_FRAG}
            />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}

/* ---------- Summit reward marker ---------- */
function SummitMarker({ progressRef }: { progressRef: RefObject<ClimbProgress> }) {
  const labelRef = useRef<HTMLDivElement>(null);
  useFrame(() => {
    const p = progressRef.current?.value ?? 0;
    if (labelRef.current)
      labelRef.current.style.opacity = String(
        THREE.MathUtils.clamp((p - 0.62) / 0.22, 0, 1),
      );
  });
  return (
    <group position={[0, 17.8, -1.3]}>
      <Html center position={[0, 1.4, 0]} zIndexRange={[5, 0]}>
        <div
          ref={labelRef}
          style={{ opacity: 0 }}
          className="whitespace-nowrap rounded-full border border-white/25 bg-ink/55 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-widest text-snow backdrop-blur-sm"
        >
          La Maroma · 2.069 m
        </div>
      </Html>
    </group>
  );
}

/* Fill light fades as you climb: lit ridges at blue hour → dramatic back-lit
   silhouettes against the bright dawn at the summit. */
function DynamicLights({ progressRef }: { progressRef: RefObject<ClimbProgress> }) {
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  useFrame(() => {
    const p = Math.min((progressRef.current?.value ?? 0) * 1.3, 1);
    if (amb.current) amb.current.intensity = THREE.MathUtils.lerp(0.34, 0.09, p);
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.lerp(0.65, 0.16, p);
  });
  return (
    <>
      <ambientLight ref={amb} intensity={0.34} color="#46587a" />
      <hemisphereLight ref={hemi} args={["#5a6e8a", "#0a0f18", 0.65]} />
    </>
  );
}

function CameraRig({ progressRef }: { progressRef: RefObject<ClimbProgress> }) {
  const { camera, scene } = useThree();

  const posCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1, 6, 34),
        new THREE.Vector3(-3, 10, 24),
        new THREE.Vector3(3, 15, 16),
        new THREE.Vector3(-2, 20, 9),
        new THREE.Vector3(1, 24, 4),
        new THREE.Vector3(6, 22, -7),
        new THREE.Vector3(4, 17, -20),
      ]),
    [],
  );
  const lookCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 8, 8),
        new THREE.Vector3(-2, 9, -2),
        new THREE.Vector3(-4, 9, -12),
        new THREE.Vector3(-5, 8, -18),
        new THREE.Vector3(-6, 7, -24),
        new THREE.Vector3(-5, 6, -32),
        new THREE.Vector3(-4, 5, -40),
      ]),
    [],
  );
  const look = useRef(new THREE.Vector3(0, 11, 2));

  useFrame((_, dt) => {
    const p = THREE.MathUtils.clamp(progressRef.current?.value ?? 0, 0, 1);
    damp3(camera.position, posCurve.getPointAt(p), 0.28, dt);
    damp3(look.current, lookCurve.getPointAt(p), 0.28, dt);
    camera.lookAt(look.current);

    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) {
      const climb = Math.min(p / 0.7, 1);
      const descend = Math.max(0, p - 0.75);
      damp(fog, "density", THREE.MathUtils.lerp(0.034, 0.009, climb) + descend * 0.012, 0.2, dt);
    }
  });
  return null;
}

export default function CumbreScene({
  progressRef,
}: {
  progressRef: RefObject<ClimbProgress>;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [1, 6, 34], fov: 50, near: 0.1, far: 460 }}
    >
      <fogExp2 attach="fog" args={["#1a2433", 0.04]} />

      <DynamicLights progressRef={progressRef} />

      <Sky progressRef={progressRef} />
      <Stars radius={170} depth={70} count={2600} factor={5} fade speed={0.3} />
      <DistantRidges />
      <Massif />
      <Clouds />
      <SummitMarker progressRef={progressRef} />
      <Sun progressRef={progressRef} />
      <CameraRig progressRef={progressRef} />

      <EffectComposer>
        <Bloom intensity={0.42} luminanceThreshold={0.8} luminanceSmoothing={0.3} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}

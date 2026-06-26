"use client";

import * as THREE from "three";
import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Html, Stars } from "@react-three/drei";
import { damp3, damp } from "maath/easing";
import { buildTerrain } from "./terrainGeometry";

export type ClimbProgress = { value: number; dir: number; vel: number };

/* ---------- Sky dome: blue hour → orange dawn (dithered to avoid banding) ---------- */
const SKY_VERT = /* glsl */ `
  varying vec3 vPos;
  void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const SKY_FRAG = /* glsl */ `
  varying vec3 vPos;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  float dither(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  void main(){
    float h = normalize(vPos).y;
    float t = smoothstep(-0.2, 0.62, h);
    vec3 c = mix(uHorizon, uTop, t);
    c += (dither(gl_FragCoord.xy) - 0.5) * (1.8/255.0);
    gl_FragColor = vec4(c, 1.0);
  }
`;

function Sky({ progressRef }: { progressRef: RefObject<ClimbProgress> }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color("#0a1124") },
      uHorizon: { value: new THREE.Color("#27395a") },
    }),
    [],
  );
  const hNight = useMemo(() => new THREE.Color("#27395a"), []);
  const hDawn = useMemo(() => new THREE.Color("#d9601c"), []);
  const tNight = useMemo(() => new THREE.Color("#0a1124"), []);
  const tDawn = useMemo(() => new THREE.Color("#2a1626"), []);
  const a = useMemo(() => new THREE.Color(), []);
  const b = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const p = progressRef.current?.value ?? 0;
    if (!mat.current) return;
    a.copy(hNight).lerp(hDawn, Math.min(p * 1.1, 1));
    (mat.current.uniforms.uHorizon.value as THREE.Color).copy(a);
    b.copy(tNight).lerp(tDawn, Math.min(p * 1.1, 1));
    (mat.current.uniforms.uTop.value as THREE.Color).copy(b);
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

/* ---------- Sun: a clean soft disc (normal blending, no postprocessing) ---------- */
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

function glow(color: string, intensity: number, falloff: number) {
  return {
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: intensity },
    uFalloff: { value: falloff },
  };
}

function Sun({ progressRef }: { progressRef: RefObject<ClimbProgress> }) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.DirectionalLight>(null);
  const halo = useMemo(() => glow("#ff9a4d", 0.85, 1.5), []);
  const core = useMemo(() => glow("#fff0d2", 0.95, 3.0), []);

  useFrame(() => {
    const p = progressRef.current?.value ?? 0;
    if (group.current) group.current.position.y = THREE.MathUtils.lerp(-10, 5, p);
    if (light.current) light.current.intensity = THREE.MathUtils.lerp(0.55, 2.0, p);
  });

  return (
    <group>
      <directionalLight ref={light} position={[22, 16, -46]} color="#ff9a4d" />
      <group ref={group} position={[24, -10, -80]}>
        <Billboard>
          <mesh>
            <planeGeometry args={[120, 120]} />
            <shaderMaterial transparent depthWrite={false} uniforms={halo} vertexShader={GLOW_VERT} fragmentShader={GLOW_FRAG} />
          </mesh>
          <mesh>
            <planeGeometry args={[34, 34]} />
            <shaderMaterial transparent depthWrite={false} uniforms={core} vertexShader={GLOW_VERT} fragmentShader={GLOW_FRAG} />
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
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0.02} />
    </mesh>
  );
}

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

/* Fill light fades as you climb → dramatic back-lit silhouettes at the summit. */
function DynamicLights({ progressRef }: { progressRef: RefObject<ClimbProgress> }) {
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  useFrame(() => {
    const p = Math.min((progressRef.current?.value ?? 0) * 1.25, 1);
    if (amb.current) amb.current.intensity = THREE.MathUtils.lerp(0.36, 0.12, p);
    if (hemi.current) hemi.current.intensity = THREE.MathUtils.lerp(0.7, 0.2, p);
  });
  return (
    <>
      <ambientLight ref={amb} intensity={0.36} color="#46587a" />
      <hemisphereLight ref={hemi} args={["#5a6e8a", "#0a0f18", 0.7]} />
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
  const look = useRef(new THREE.Vector3(0, 8, 8));

  useFrame((_, dt) => {
    const p = THREE.MathUtils.clamp(progressRef.current?.value ?? 0, 0, 1);
    damp3(camera.position, posCurve.getPointAt(p), 0.28, dt);
    damp3(look.current, lookCurve.getPointAt(p), 0.28, dt);
    camera.lookAt(look.current);

    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) {
      const climb = Math.min(p / 0.7, 1);
      damp(fog, "density", THREE.MathUtils.lerp(0.03, 0.008, climb), 0.2, dt);
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
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [1, 6, 34], fov: 50, near: 0.1, far: 460 }}
    >
      <fogExp2 attach="fog" args={["#1a2433", 0.03]} />

      <DynamicLights progressRef={progressRef} />
      <Sky progressRef={progressRef} />
      <Stars radius={170} depth={70} count={2400} factor={4.5} fade speed={0.3} />
      <Massif />
      <SummitMarker progressRef={progressRef} />
      <Sun progressRef={progressRef} />
      <CameraRig progressRef={progressRef} />
    </Canvas>
  );
}

"use client";

import { useEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { ridgeHeightAt } from "@/lib/mountain";
import { terrainVertex, terrainFragment } from "./shaders";
import type { VerticeProgress } from "./types";

function buildGeometry() {
  const cols = 196;
  const rows = 104;
  const width = 3.6;
  const maxH = 1.6;
  const count = cols * rows;
  const pos = new Float32Array(count * 3);
  const elev = new Float32Array(count);
  const rnd = new Float32Array(count);

  let k = 0;
  for (let i = 0; i < cols; i++) {
    const xN = i / (cols - 1);
    const topYn = 1 - ridgeHeightAt(xN); // 0 (base) .. 1 (summit)
    const topH = topYn * maxH;
    for (let j = 0; j < rows; j++) {
      const t = j / (rows - 1);
      const px = (xN - 0.5) * width;
      const py = t * topH;
      const z =
        (Math.sin(xN * 22.0) * 0.5 + Math.sin(t * 15.0 + xN * 7.0) * 0.5) *
          0.05 *
          (0.25 + 0.75 * t) +
        Math.sin(xN * 60.0) * 0.012;
      pos[k * 3] = px;
      pos[k * 3 + 1] = py;
      pos[k * 3 + 2] = z;
      elev[k] = t * topYn;
      rnd[k] = Math.random();
      k++;
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aElev", new THREE.BufferAttribute(elev, 1));
  g.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 1));
  return g;
}

function TerrainPoints({
  progressRef,
}: {
  progressRef: RefObject<VerticeProgress>;
}) {
  const { gl, camera } = useThree();

  const geo = useMemo(() => buildGeometry(), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uDir: { value: 1 },
          uPixelRatio: { value: 1 },
        },
        vertexShader: terrainVertex,
        fragmentShader: terrainFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const points = useMemo(() => new THREE.Points(geo, mat), [geo, mat]);

  useEffect(() => {
    mat.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.5);
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [gl, geo, mat]);

  useFrame((state, dt) => {
    const pr = progressRef.current;
    const u = mat.uniforms;
    const d = Math.min(1, dt * 60);
    u.uTime.value += dt;
    u.uProgress.value += (pr.p - u.uProgress.value) * Math.min(1, dt * 5);
    const targetDir = pr.vel === 0 ? u.uDir.value : pr.dir >= 0 ? 1 : -1;
    u.uDir.value += (targetDir - u.uDir.value) * Math.min(1, dt * 4);

    points.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.07;
    points.rotation.x = -0.04;

    const cy = -0.05 + u.uProgress.value * 0.5;
    camera.position.y += (cy - camera.position.y) * Math.min(1, dt * 2);
    camera.lookAt(0, 0.1 + u.uProgress.value * 0.25, 0);
    void d;
  });

  return <primitive object={points} position={[0, -0.6, 0]} />;
}

function Effects({ desktop }: { desktop: boolean }) {
  const ca = useMemo(() => new THREE.Vector2(0.0006, 0.0006), []);
  if (!desktop) {
    return (
      <EffectComposer>
        <Bloom intensity={1.25} luminanceThreshold={0.15} luminanceSmoothing={0.4} mipmapBlur />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer>
      <Bloom intensity={1.3} luminanceThreshold={0.14} luminanceSmoothing={0.4} mipmapBlur />
      <ChromaticAberration offset={ca} radialModulation={false} modulationOffset={0} />
    </EffectComposer>
  );
}

export default function VerticeTerrain({
  progressRef,
  desktop,
}: {
  progressRef: RefObject<VerticeProgress>;
  desktop: boolean;
}) {
  return (
    <Canvas
      aria-hidden
      className="!absolute !inset-0"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.05, 3.0], fov: 42 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#07090c"]} />
      <fog attach="fog" args={["#07090c", 3.2, 6.5]} />
      <TerrainPoints progressRef={progressRef} />
      <Effects desktop={desktop} />
    </Canvas>
  );
}

// GLSL for the Vértice point-cloud terrain. Inlined as template strings so no
// glsl loader is needed. The mountain silhouette is baked into the geometry
// (see VerticeTerrain) from @/lib/mountain; here we drive the altitude band,
// the holographic glow and the ascent(orange)/descent(teal) direction colour.

export const terrainVertex = /* glsl */ `
  uniform float uProgress;   // 0..1 normalized altitude band position
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aElev;      // 0..1 absolute normalized elevation of this point
  attribute float aRnd;       // per-point random
  varying float vGlow;
  varying float vElev;
  varying float vBandSide;     // sign of (aElev - band), for trailing pulse

  void main() {
    vElev = aElev;
    float band = uProgress;
    float d = aElev - band;
    vBandSide = d;
    float glow = smoothstep(0.07, 0.0, abs(d));
    vGlow = glow;

    vec3 p = position;
    // points near the sweeping band lift toward the camera + gentle shimmer
    p.z += glow * 0.14;
    p.z += sin(uTime * 1.4 + aRnd * 6.2831 + p.x * 2.5) * 0.013;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = (2.3 + glow * 7.0) * uPixelRatio;
    gl_PointSize = size * (1.0 / -mv.z);
  }
`;

export const terrainFragment = /* glsl */ `
  precision mediump float;
  uniform float uDir;        // +1 ascent, -1 descent
  varying float vGlow;
  varying float vElev;
  varying float vBandSide;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float dd = dot(c, c);
    if (dd > 0.25) discard;
    float a = smoothstep(0.25, 0.0, dd);

    vec3 lowCol  = vec3(0.55, 0.28, 0.10);   // warm amber base (no muddy red)
    vec3 highCol = vec3(1.0, 0.62, 0.30);    // ember toward summit
    vec3 base = mix(lowCol, highCol, vElev);

    // faint topographic banding by elevation
    float bands = abs(sin(vElev * 46.0));
    base += vec3(0.14) * smoothstep(0.86, 1.0, bands);

    vec3 asc  = vec3(1.0, 0.64, 0.22);       // orange (ascent)
    vec3 desc = vec3(0.30, 0.82, 0.86);      // cool cyan (descent)
    vec3 bandCol = mix(desc, asc, step(0.0, uDir));

    vec3 col = mix(base, bandCol, vGlow);
    col += bandCol * vGlow * 1.7;            // emissive boost for bloom

    // the mountain reads as a clear point field; the sweeping band is brightest
    float alpha = a * (0.46 + 0.54 * vGlow);
    gl_FragColor = vec4(col, alpha);
  }
`;

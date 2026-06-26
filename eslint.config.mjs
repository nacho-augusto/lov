import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Three Fiber animates by mutating Three.js objects (camera, meshes,
    // uniforms) inside useFrame — the canonical, required pattern. The new
    // react-hooks/immutability rule flags that as an error, which is a false
    // positive for imperative graphics code, so we turn it off project-wide.
    rules: {
      "react-hooks/immutability": "off",
      // Client-only media-query / WebGL-support reads must initialise in an
      // effect (the values are unavailable during SSR); this rule false-positives.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

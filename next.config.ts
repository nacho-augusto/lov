import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the Three.js ecosystem so their ESM/JSX builds work across
  // Next's server/client boundary without resolution surprises.
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "@react-three/postprocessing",
    "postprocessing",
    "maath",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 requires an explicit allowlist; hero plates use 85–90, the rest 75.
    qualities: [60, 75, 85, 90],
  },
};

export default nextConfig;

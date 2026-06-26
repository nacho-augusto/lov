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
  },
};

export default nextConfig;

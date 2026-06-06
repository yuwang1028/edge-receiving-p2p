import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating dev-mode indicator (small "N" badge in bottom-left
  // during `npm run dev`). Production builds never show it anyway.
  devIndicators: false,
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sign-in is a dialog on every page now; keep old /login links working
  async redirects() {
    return [
      { source: "/login", destination: "/", permanent: true },
      { source: "/roadmap", destination: "/other", permanent: false },   // Roadmap was replaced by Other
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Parent directory also has a package-lock.json; pin Turbopack to this app.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;

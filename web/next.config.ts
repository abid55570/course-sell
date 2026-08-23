import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Unsplash's API guidelines require hotlinking their CDN rather than
    // downloading and rehosting the file, so their host is allowed here
    // rather than the images being copied into public/.
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
  // The repo root (C:\Dropdesk) carries its own package.json/lockfile for
  // the unrelated `api/` workspace, which made Turbopack infer the wrong
  // workspace root and warn on every build. Pin it to this app explicitly.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const studioOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_STUDIO_URL ? new URL(process.env.NEXT_PUBLIC_STUDIO_URL).origin : "";
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/create-account',
        destination: '/register',
        permanent: true,
      },
    ];
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const headers = [
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
          "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https: http:",
          `connect-src 'self' https://accounts.google.com ${studioOrigin}`.trim(),
          "frame-src 'self' https://accounts.google.com https://www.google.com https://google.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin-allow-popups",
      },
    ];

    if (isProduction) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/:path*",
        headers,
      },
      // Must come after the catch-all so camera=(self) wins over camera=().
      {
        source: "/collect-data/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

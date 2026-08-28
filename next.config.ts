const isDev = process.env.NODE_ENV === "development";

function buildContentSecurityPolicy() {
  return [
    "default-src 'self'",
    // 'unsafe-inline' dibutuhkan oleh Next.js (bootstrap) & styled-components.
    // 'unsafe-eval' hanya di dev (webpack HMR).
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self' https:",
    "frame-ancestors 'none'",
  ].join("; ");
}

const nextConfig = {
  // Next.js 16: cacheComponents & cacheLife berada di top-level (bukan experimental)
  cacheComponents: true, // wajib untuk pakai 'use cache' directive
  cacheLife: {
    matches: {
      stale: 10,      // client boleh pakai cache stale sampai 10 detik
      revalidate: 10, // server refresh tiap 10 detik
      expire: 60,     // maksimal umur cache 60 detik
    },
    reference: {
      stale: 300,
      revalidate: 300,
      expire: 3600,
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
        ],
      },
    ];
  },
}

export default nextConfig
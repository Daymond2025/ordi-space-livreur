import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
const API_ORIGIN = new URL(API_URL).origin;

// 'unsafe-eval' n'est nécessaire qu'en dev (source maps/HMR de Turbopack) —
// jamais en production, où le bundle ne l'utilise pas.
const scriptSrc = process.env.NODE_ENV === "development" ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

const CSP = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: ${API_ORIGIN}`,
  "font-src 'self' data:",
  `connect-src 'self' ${API_ORIGIN}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
  // Un vieux package-lock.json orphelin dans C:\Users\pc (hors de ce projet)
  // fait remonter Turbopack trop haut dans l'arborescence pour deviner la
  // racine du workspace — on la fixe explicitement pour supprimer l'avertissement.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/storage/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/storage/**" },
      { protocol: "https", hostname: "ordisapce.daymondboutique.com", pathname: "/storage/**" },
    ],
    // Backend API tourne en local en développement (127.0.0.1 / localhost) :
    // à retirer si l'API pointe un jour vers un domaine public en prod.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;

/**
 * ASCII Architecture Flowchart: next.config
 *
 *   ┌──────────────────────────────────┐
 *   │      Initialize next.config      │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │            nextConfig            │
 *   └──────────────────────────────────┘
 *                    │
 *                    ▼
 *   ┌──────────────────────────────────┐
 *   │  Return State / Result Payload   │
 *   └──────────────────────────────────┘
 */

/** @type {import('next').NextConfig} */
// ════ TYPES & DOMAIN CONTRACTS ════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════

const nextConfig = {
  output: 'standalone',
  swcMinify: true,
  reactStrictMode: true,
  compress: true,
  outputFileTracingExcludes: {
    '*': ['@swc/core', 'esbuild', 'terser', 'uglify-js', 'typescript'],
  },
};

module.exports = nextConfig;
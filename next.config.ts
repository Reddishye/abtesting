import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Allows <script src="/p/uuid.js"> to route to /p/[id]/route.ts
      {
        source: '/p/:id.js',
        destination: '/p/:id',
      },
      // Allows <script src="/e/uuid.js"> to route to /e/[id]/route.ts
      {
        source: '/e/:id.js',
        destination: '/e/:id',
      },
    ]
  },
  async headers() {
    return [
      {
        // Applied to all routes except public script/event endpoints
        source: '/((?!p/|e/|api/events).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  turbopack: {},
}

export default nextConfig

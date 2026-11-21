/** @type {import('next').NextConfig} */

// Backend API origin, used to scope CSP connect-src to just our own API
// instead of wildcarding it.
const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
  .replace(/\/api\/?$/, '');

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' ${apiOrigin};
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
  // Forces HTTPS on every subsequent visit (browser-enforced).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Mitigates XSS by restricting where scripts/styles/frames can load from.
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  // Blocks this site from ever being framed (clickjacking protection) —
  // effectively our CSRF/clickjacking defense since the admin panel uses
  // Bearer-token auth (no cookies), so classic cookie-based CSRF doesn't apply.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://al-sharqiyat-backend.onrender.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

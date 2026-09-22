import type { NextConfig } from 'next';

const config: NextConfig = {
  // Os pacotes do workspace são TypeScript cru, sem build próprio.
  transpilePackages: ['@fleet/sites', '@fleet/i18n', '@fleet/content', '@fleet/ui', '@fleet/ads'],
  // Imagem enxuta pro container: só o necessário para rodar.
  output: 'standalone',
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default config;

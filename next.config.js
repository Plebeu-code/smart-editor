/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@remotion/renderer',
      '@remotion/bundler',
      'fluent-ffmpeg',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        '@remotion/renderer',
        '@remotion/bundler',
        'fluent-ffmpeg',
      ];
    }
    return config;
  },
};

module.exports = nextConfig;

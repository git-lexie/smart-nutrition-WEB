/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Keeps Bluetooth stable
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []),
        '@tensorflow/tfjs',
        '@tensorflow-models/universal-sentence-encoder'
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
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
};

module.exports = nextConfig;
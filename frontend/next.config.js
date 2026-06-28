/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  async rewrites() {
    const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiHost.replace(/\/$/, '')}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${apiHost.replace(/\/$/, '')}/socket.io/:path*`,
      },
    ];
  },
  webpack(config) {
    config.resolve.modules = config.resolve.modules || [];
    config.resolve.modules.push(path.resolve(__dirname, '..', 'node_modules'));
    return config;
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "http", hostname: "backend" },
    ],
  },
  outputFileTracingIncludes: {
    "/api/ia/**": ["./cerebro/**/*.md"],
  },
  experimental: {
    cpus: 2,
  },
};

module.exports = nextConfig;

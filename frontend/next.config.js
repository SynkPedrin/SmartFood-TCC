/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "http", hostname: "backend" },
    ],
  },
  experimental: {
    // O cérebro é lido do disco em tempo de execução (fs), então o Next não consegue
    // rastrear esses arquivos sozinho. Sem isto, as rotas de IA sobem sem o vault
    // no bundle serverless e a conta perde a memória em produção.
    outputFileTracingIncludes: {
      "/api/ia/**": ["./cerebro/**/*.md"],
    },
  },
};

module.exports = nextConfig;

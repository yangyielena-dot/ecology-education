/** @type {import('next').NextConfig} */
const nextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),  // Uncomment and add 'const path = require("path")' if needed
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  
  // 将 coze-coding-dev-sdk 标记为服务器外部依赖，避免构建问题
  serverExternalPackages: ['coze-coding-dev-sdk'],
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'coze-coding-project.tos.coze.site',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'code.coze.cn',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;

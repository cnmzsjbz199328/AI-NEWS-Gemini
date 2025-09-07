/** @type {import('next').NextConfig} */
const nextConfig = {
  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // 重定向静态资源到 public 目录
  images: {
    domains: ['localhost'],
  },
  // TypeScript 配置
  typescript: {
    // 在生产构建期间忽略 TypeScript 错误
    ignoreBuildErrors: false,
  },
  // 路径别名配置
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': './src',
    }
    return config
  }
}

module.exports = nextConfig

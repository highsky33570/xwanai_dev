/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@heroui/react']
  },
  // 使用环境变量，避免硬编码敏感信息
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://glktmlzxxrkyzmhnheqd.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsa3RtbHp4eHJreXptaG5oZXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTI2NjksImV4cCI6MjA3NDc4ODY2OX0.xcTTECadCrfaZZhGkZ7lHYT3smMq3kCHXdr6EK2Um1Q',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://xwanai-back-rmxvs5nflq-as.a.run.app'
  },
  // 生产环境优化
  compress: true,
  poweredByHeader: false,
  // 如果需要自定义服务器配置
  serverRuntimeConfig: {
    // 这里可以添加服务器端专用的配置
  },
  publicRuntimeConfig: {
    // 这里可以添加客户端可访问的配置
  }
};

export default nextConfig;

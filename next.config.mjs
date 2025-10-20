/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Transpile Ant Design for better compatibility
  transpilePackages: ['antd', '@ant-design/icons'],

  // Experimental features for App Router
  experimental: {
    // Improved server actions support
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig

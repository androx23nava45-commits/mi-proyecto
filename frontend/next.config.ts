import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://mi-proyecto-production-3a61.up.railway.app/:path*'
          : 'http://localhost:3000/:path*'
      }
    ]
  }
}

export default nextConfig
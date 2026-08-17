/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
      {
        source: '/ws/:path*',
        destination: 'http://localhost:8000/ws/:path*',
      },
    ]
  },
}

module.exports = nextConfig

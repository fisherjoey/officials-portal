/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export for production builds, not in dev mode
  // Dev mode needs dynamic rendering for CSS/JS to load properly
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
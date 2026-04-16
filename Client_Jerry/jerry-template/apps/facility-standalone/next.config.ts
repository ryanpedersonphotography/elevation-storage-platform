import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  transpilePackages: ['@jerry/storage-ui', '@jerry/facility-config'],
}

export default nextConfig

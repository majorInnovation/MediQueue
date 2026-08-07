/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow development HMR from specific hosts (useful for LAN/dev VMs)
  // Add the host shown in the console to avoid cross-origin dev resource blocking
  allowedDevOrigins: ['192.168.56.1', 'localhost'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig

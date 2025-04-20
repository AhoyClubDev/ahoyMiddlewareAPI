/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configure images to allow domains for remote images
  images: {
    domains: [
      'api.ankor.io',  // API server domain
      'cdn.ankor.io',  // Possible CDN domain
      'ankor.io'       // Base domain
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ankor.io',
        pathname: '/**',
      }
    ]
  },
};

export default nextConfig;

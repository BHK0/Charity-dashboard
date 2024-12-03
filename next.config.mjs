/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ogk5jafeoc6is43h.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'farmersdonations2.s3.me-south-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'farmersdonations.s3.eu-north-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

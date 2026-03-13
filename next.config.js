/** @type {import('next').NextConfig} */
const nextConfig = {
   reactStrictMode: false,
  images: {
    domains: ['images.unsplash.com', 'covers.openlibrary.org', 'res.cloudinary.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

module.exports = nextConfig;

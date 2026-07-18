/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isProduction ? '/Jive-Translator' : '',
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

export default nextConfig;

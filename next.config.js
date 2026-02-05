const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.GITHUB_PAGES ? '/resume-pure' : '',
  assetPrefix: process.env.GITHUB_PAGES ? '/resume-pure/' : '',
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(nextConfig);

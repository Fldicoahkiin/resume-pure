/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.GITHUB_PAGES ? '/resume-pure' : '',
  assetPrefix: process.env.GITHUB_PAGES ? '/resume-pure/' : '',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;

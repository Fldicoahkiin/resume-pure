import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import withSerwistInit from '@serwist/next';

const githubPagesBasePath = process.env.GITHUB_PAGES ? '/resume-pure' : '';
const generatedServiceWorkerPattern = /^(?:sw(?:\.js|\.js\.map)|swe-worker-.*|workbox-.*)$/;

function getPublicAssetPrecacheEntries() {
  const publicDirectory = path.resolve(process.cwd(), 'public');
  const entries = [];

  const appendAsset = (inputPath) => {
    if (statSync(inputPath).isDirectory()) {
      for (const entry of readdirSync(inputPath).sort()) {
        appendAsset(path.join(inputPath, entry));
      }
      return;
    }

    const assetPath = path.relative(publicDirectory, inputPath).split(path.sep).join('/');
    if (generatedServiceWorkerPattern.test(assetPath)) return;

    entries.push({
      url: `${githubPagesBasePath}/${assetPath}`,
      revision: createHash('sha256').update(readFileSync(inputPath)).digest('hex'),
    });
  };

  appendAsset(publicDirectory);
  return entries;
}

function getStaticPageRevision() {
  const hash = createHash('sha256');

  const appendPath = (inputPath) => {
    if (statSync(inputPath).isDirectory()) {
      for (const entry of readdirSync(inputPath).sort()) {
        appendPath(path.join(inputPath, entry));
      }
      return;
    }

    hash.update(path.relative(process.cwd(), inputPath));
    hash.update(readFileSync(inputPath));
  };

  for (const input of ['src', 'package.json', 'public/manifest.json']) {
    appendPath(path.resolve(process.cwd(), input));
  }

  return hash.digest('hex');
}

const staticPageRevision = getStaticPageRevision();
const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [
    ...getPublicAssetPrecacheEntries(),
    { url: `${githubPagesBasePath}/`, revision: staticPageRevision },
    { url: `${githubPagesBasePath}/builder/`, revision: staticPageRevision },
  ],
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  outputFileTracingRoot: process.cwd(),
  basePath: githubPagesBasePath,
  assetPrefix: githubPagesBasePath ? `${githubPagesBasePath}/` : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: githubPagesBasePath,
  },
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
    ],
  },
};

export default withSerwist(nextConfig);

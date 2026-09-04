import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputDirectory = join(process.cwd(), 'dist', 'client');
const basePath = process.env.PAGES_BASE_PATH;

if (!basePath?.startsWith('/')) {
  throw new Error('PAGES_BASE_PATH must start with "/".');
}

const html = await readFile(join(outputDirectory, 'index.html'), 'utf8');
const requiredFiles = [
  '404.html',
  'favicon.svg',
  'og.png',
  'oshikatsu-profile.jpg',
];

for (const file of requiredFiles) {
  await access(join(outputDirectory, file));
}

const localAssetUrls = [
  ...html.matchAll(/(?:href|src)="(\/[^"?#]+)(?:[?#][^"]*)?"/g),
].map((match) => match[1]);

const nextAssetUrls = localAssetUrls.filter((url) => url.includes('/_next/'));

if (nextAssetUrls.length === 0) {
  throw new Error('No Next.js assets were found in the generated HTML.');
}

for (const url of nextAssetUrls) {
  if (!url.startsWith(`${basePath}/_next/`)) {
    throw new Error(`Asset URL is missing the GitHub Pages base path: ${url}`);
  }

  const artifactPath = url.slice(basePath.length + 1);
  await access(join(outputDirectory, artifactPath));
}

const canonical =
  'https://oshikatsu-profile-thanks-chelsea.pekomaro1001.chatgpt.site';

if (!html.includes(`<link rel="canonical" href="${canonical}"`)) {
  throw new Error('The canonical URL no longer points to the Sites version.');
}

console.log(
  `GitHub Pages build verified (${nextAssetUrls.length} local assets, base path: ${basePath}).`,
);

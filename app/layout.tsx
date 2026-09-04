import type { Metadata, Viewport } from 'next';

import './globals.css';

const title = '推し活プロフィールメーカー ～Thanks, Chelsea!～';
const description =
  'フォームへ入力するだけで、推し活プロフィール画像をかんたんに作成・保存できる無料ツールです。';
const siteUrl = new URL(
  'https://oshikatsu-profile-thanks-chelsea.pekomaro1001.chatgpt.site',
);
const ogImageUrl =
  'https://whike-chan.github.io/oshikatsu_profile_thanks_chelsea/og.png?v=20260904-2';
const publicBasePath = process.env.PAGES_BASE_PATH?.replace(/\/$/, '') ?? '';
const faviconPath = `${publicBasePath}/favicon.png`;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  applicationName: title,
  icons: {
    icon: [{ url: faviconPath, type: 'image/png', sizes: '512x512' }],
    apple: [{ url: faviconPath, type: 'image/png', sizes: '512x512' }],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'ja_JP',
    url: '/',
    images: [
      {
        url: ogImageUrl,
        width: 1731,
        height: 909,
        alt: title,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [{ url: ogImageUrl, alt: title }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fff5fb',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

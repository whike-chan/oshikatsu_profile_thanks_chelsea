import type { Metadata, Viewport } from 'next';

import './globals.css';

const title = '推し活プロフィールメーカー ～Thanks, Chelsea!～';
const description =
  'フォームへ入力するだけで、推し活プロフィール画像をかんたんに作成・保存できる無料ツールです。';
const siteUrl = new URL(
  'https://oshikatsu-profile-thanks-chelsea.pekomaro1001.chatgpt.site',
);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  applicationName: title,
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
        url: '/og.png',
        width: 1733,
        height: 909,
        alt: title,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og.png'],
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

import type { Metadata, Viewport } from 'next';

import './globals.css';

const title = '推し活プロフィールメーカー ～Thanks, Chelsea!～';
const description =
  'フォームへ入力するだけで、推し活プロフィール画像をかんたんに作成・保存できる無料ツールです。';

export const metadata: Metadata = {
  title,
  description,
  applicationName: title,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fff5fb',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

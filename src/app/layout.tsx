import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import './globals.css';
import Header from '@/components/Header';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '핫딜모아 — 실시간 특가 모음',
    template: '%s | 핫딜모아',
  },
  description:
    '뽐뿌, 루리웹, 클리앙, 퀘이사존 등 주요 커뮤니티의 특가 정보를 한곳에 모아 실시간 랭킹으로 보여줍니다.',
  openGraph: {
    type: 'website',
    siteName: '핫딜모아',
    locale: 'ko_KR',
  },
  robots: { index: true, follow: true },
};

const themeScript = `
try {
  var s = localStorage.getItem('theme');
  var d = s ? s === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  if (d) document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Suspense fallback={<div className="h-[57px] border-b border-line" />}>
          <Header />
        </Suspense>
        {children}
        <footer className="mt-12 border-t border-line py-8">
          <div className="mx-auto max-w-6xl px-4 text-[12px] leading-relaxed text-muted">
            <div className="mb-3 flex flex-wrap gap-4">
              <Link href="/guide" className="hover:text-fg">이용안내</Link>
              <Link href="/privacy" className="hover:text-fg">개인정보·면책</Link>
              <Link href="/source" className="hover:text-fg">출처별 모아보기</Link>
            </div>
            <p>
              핫딜모아는 각 커뮤니티에 공개된 특가 게시글의 제목·링크를 수집해 보여주는 집계
              서비스입니다. 게시물의 저작권은 각 원저작자에게 있으며, 거래로 인한 책임은 지지
              않습니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

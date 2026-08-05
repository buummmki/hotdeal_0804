import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/Header';
import { SITE, siteJsonLd } from '@/lib/site';

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.shortName}`,
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  applicationName: SITE.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: {
    card: 'summary',
    title: SITE.title,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
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
        {/* 검색엔진·AI 답변엔진이 사이트 정체를 파악할 수 있게 하는 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
      </head>
      <body>
        {/* AdSense 로더. 페이지 렌더링을 막지 않도록 afterInteractive 로 붙입니다. */}
        {adsenseClient && (
          <Script
            id="adsbygoogle-init"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          />
        )}
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
              {SITE.name}은 각 커뮤니티에 공개된 특가 게시글의 제목·링크를 수집해 보여주는 집계
              서비스입니다. 게시물의 저작권은 각 원저작자에게 있으며, 거래로 인한 책임은 지지
              않습니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

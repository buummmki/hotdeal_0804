'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const on = stored ? stored === 'dark' : prefers;
    setDark(on);
    document.documentElement.classList.toggle('dark', on);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className="rounded-lg border border-line p-2 text-muted transition-colors hover:text-fg"
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M5 5l1.5 1.5M17.5 17.5 19 19M2 12h2M20 12h2M5 19l1.5-1.5M17.5 6.5 19 5" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params?.get('q') ?? '');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = q.trim();
        if (v) router.push(`/search?q=${encodeURIComponent(v)}`);
      }}
      className="relative flex-1"
      role="search"
    >
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="상품명, 브랜드로 검색"
        aria-label="딜 검색"
        className="w-full rounded-lg border border-line bg-card py-2 pl-9 pr-3 text-sm
                   outline-none transition-colors placeholder:text-muted focus:border-accent"
      />
    </form>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-extrabold tracking-tight">
          핫딜<span className="text-accent">모아</span>
        </Link>
        <div className="hidden flex-1 sm:flex">
          <SearchBar />
        </div>
        <nav className="ml-auto flex items-center gap-1 text-sm text-muted">
          <Link href="/source" className="hidden rounded-lg px-2.5 py-2 hover:text-fg sm:block">
            출처별
          </Link>
          <Link href="/admin" className="hidden rounded-lg px-2.5 py-2 hover:text-fg sm:block">
            관리자
          </Link>
          <ThemeToggle />
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-3 sm:hidden">
        <SearchBar />
      </div>
    </header>
  );
}

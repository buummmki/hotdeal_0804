'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, ReadonlyURLSearchParams } from 'next/navigation';
import { CATEGORIES, SORTS } from '@/lib/types';

function buildHref(base: string, params: URLSearchParams | ReadonlyURLSearchParams | null, patch: Record<string, string | null>) {
  const next = new URLSearchParams(params?.toString() ?? '');
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) next.delete(k);
    else next.set(k, v);
  }
  next.delete('page');
  const qs = next.toString();
  return qs ? `${base}?${qs}` : base;
}

export function CategoryTabs({ active }: { active: string }) {
  const params = useSearchParams();
  return (
    <nav
      className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      style={{ scrollbarWidth: 'none' }}
      aria-label="카테고리"
    >
      {CATEGORIES.map((c) => {
        const on = active === c.slug;
        const href = c.slug === 'all' ? buildHref('/', params, { cat: null }) : buildHref('/', params, { cat: c.slug });
        return (
          <Link
            key={c.slug}
            href={href}
            aria-current={on ? 'page' : undefined}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors
              ${on ? 'bg-accent text-white' : 'bg-card text-muted hover:text-fg border border-line'}`}
          >
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SortTabs({ active }: { active: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-0.5" role="tablist" aria-label="정렬">
      {SORTS.map((s) => {
        const on = active === s.key;
        return (
          <Link
            key={s.key}
            role="tab"
            aria-selected={on}
            href={buildHref(pathname ?? '/', params, { sort: s.key })}
            className={`rounded-md px-2.5 py-1.5 text-[13px] transition-colors
              ${on ? 'font-semibold text-fg' : 'text-muted hover:text-fg'}`}
          >
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { listDeals } from '@/lib/queries';
import { CATEGORIES, categoryLabel } from '@/lib/types';
import type { SortKey } from '@/lib/types';
import DealCard from '@/components/DealCard';
import Pagination from '@/components/Pagination';
import { SortTabs } from '@/components/Tabs';
import Link from 'next/link';

export const revalidate = 60;
const PER_PAGE = 20;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const q = (await searchParams).q?.trim();
  return {
    title: q ? `"${q}" 검색 결과` : '검색',
    description: q ? `${q} 관련 특가·핫딜 검색 결과입니다.` : '핫딜 검색',
    robots: { index: false, follow: true }, // 검색 결과는 색인 제외
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const cat = sp.cat ?? 'all';
  const sort = (sp.sort ?? 'rank') as SortKey;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const list = q
    ? await listDeals({ query: q, category: cat, sort, page, perPage: PER_PAGE })
    : { deals: [], total: 0, usingMock: false };

  return (
    <main className="mx-auto max-w-4xl px-4 py-5">
      <h1 className="text-lg font-bold">
        {q ? (
          <>
            <span className="text-accent">&ldquo;{q}&rdquo;</span> 검색 결과
            <span className="tnum ml-2 text-xs font-normal text-muted">
              {list.total.toLocaleString('ko-KR')}건
            </span>
          </>
        ) : (
          '검색어를 입력하세요'
        )}
      </h1>

      {q && (
        <>
          <div
            className="-mx-4 mt-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {CATEGORIES.map((c) => {
              const on = cat === c.slug;
              const sp = new URLSearchParams({ q });
              if (c.slug !== 'all') sp.set('cat', c.slug);
              if (sort !== 'rank') sp.set('sort', sort);
              return (
                <Link
                  key={c.slug}
                  href={`/search?${sp.toString()}`}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors
                    ${on ? 'bg-accent text-white' : 'border border-line bg-card text-muted hover:text-fg'}`}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>

          <div className="mb-3 mt-4 flex items-center justify-between border-b border-line pb-2">
            <span className="text-[13px] text-muted">
              {cat === 'all' ? '전체 카테고리' : categoryLabel(cat)}
            </span>
            <Suspense fallback={null}>
              <SortTabs active={sort} />
            </Suspense>
          </div>

          {list.deals.length === 0 ? (
            <div className="rounded-xl border border-line bg-card py-16 text-center">
              <p className="text-sm text-muted">검색 결과가 없습니다.</p>
              <p className="mt-1 text-[12px] text-muted">
                더 짧은 키워드로 다시 시도해 보세요. (예: &ldquo;삼성 SSD&rdquo; → &ldquo;SSD&rdquo;)
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {list.deals.map((d) => (
                <DealCard key={d.id} deal={d} />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            total={list.total}
            perPage={PER_PAGE}
            basePath="/search"
            query={{ q, cat: cat === 'all' ? undefined : cat, sort: sort === 'rank' ? undefined : sort }}
          />
        </>
      )}
    </main>
  );
}

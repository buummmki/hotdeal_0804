import { Suspense } from 'react';
import { listDeals, hotDeals, latestDeals, mostCommented } from '@/lib/queries';
import { categoryLabel } from '@/lib/types';
import type { SortKey } from '@/lib/types';
import DealCard from '@/components/DealCard';
import Sidebar from '@/components/Sidebar';
import Pagination from '@/components/Pagination';
import { CategoryTabs, SortTabs } from '@/components/Tabs';
import MockNotice from '@/components/MockNotice';

export const revalidate = 60;

const PER_PAGE = 20;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const cat = sp.cat ?? 'all';
  const sort = (sp.sort ?? 'rank') as SortKey;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const [list, hot, latest, commented] = await Promise.all([
    listDeals({ category: cat, sort, page, perPage: PER_PAGE }),
    hotDeals(7),
    latestDeals(7),
    mostCommented(7),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-5">
      {list.usingMock && <MockNotice />}

      <Suspense fallback={<div className="h-10" />}>
        <CategoryTabs active={cat} />
      </Suspense>

      <div className="mt-5 flex gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
            <h1 className="text-[15px] font-bold">
              {cat === 'all' ? '전체 딜' : categoryLabel(cat)}
              <span className="tnum ml-2 text-xs font-normal text-muted">
                {list.total.toLocaleString('ko-KR')}건
              </span>
            </h1>
            <Suspense fallback={null}>
              <SortTabs active={sort} />
            </Suspense>
          </div>

          {list.deals.length === 0 ? (
            <p className="rounded-xl border border-line bg-card py-16 text-center text-sm text-muted">
              해당 조건의 딜이 없습니다.
            </p>
          ) : (
            <div className="space-y-2.5">
              {list.deals.map((d, i) => (
                <DealCard
                  key={d.id}
                  deal={d}
                  rank={sort === 'rank' ? (page - 1) * PER_PAGE + i + 1 : undefined}
                />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            total={list.total}
            perPage={PER_PAGE}
            basePath="/"
            query={{ cat: cat === 'all' ? undefined : cat, sort: sort === 'rank' ? undefined : sort }}
          />
        </div>

        <Sidebar hot={hot} latest={latest} commented={commented} />
      </div>
    </main>
  );
}

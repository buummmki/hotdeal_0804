import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getSource, listDeals } from '@/lib/queries';
import type { SortKey } from '@/lib/types';
import DealCard from '@/components/DealCard';
import Pagination from '@/components/Pagination';
import { SortTabs } from '@/components/Tabs';

export const revalidate = 60;
const PER_PAGE = 20;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const s = await getSource((await params).id);
  if (!s) return { title: '출처를 찾을 수 없습니다' };
  return {
    title: `${s.name} 특가 모음`,
    description: `${s.name}에 올라온 최신 특가·핫딜을 모아 랭킹으로 보여줍니다.`,
    alternates: { canonical: `/source/${s.id}` },
    // 수집이 멈춘 출처는 딜이 없어 빈 페이지가 되므로 색인에서 제외
    robots: s.is_active ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function SourcePage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const source = await getSource(id);
  if (!source) notFound();

  const sort = (sp.sort ?? 'latest') as SortKey;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  // 출처별은 "그 커뮤니티 글을 훑어보러" 온 화면이라 기간 제한을 걸지 않는다
  const list = await listDeals({ sourceId: id, sort, page, perPage: PER_PAGE, includeOld: true });

  return (
    <main className="mx-auto max-w-4xl px-4 py-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold"
          style={{ background: `${source.color ?? '#64748b'}22`, color: source.color ?? '#64748b' }}
        >
          {source.name.slice(0, 1)}
        </span>
        <div>
          <h1 className="text-lg font-bold">{source.name}</h1>
          <a
            href={source.base_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-[12px] text-muted hover:text-fg"
          >
            {source.base_url} ↗
          </a>
        </div>
      </div>

      <div className="mb-3 mt-5 flex items-center justify-between border-b border-line pb-2">
        <span className="tnum text-[13px] text-muted">
          {list.total.toLocaleString('ko-KR')}건
        </span>
        <Suspense fallback={null}>
          <SortTabs active={sort} />
        </Suspense>
      </div>

      {list.deals.length === 0 ? (
        <p className="rounded-xl border border-line bg-card py-16 text-center text-sm text-muted">
          아직 수집된 딜이 없습니다.
        </p>
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
        basePath={`/source/${id}`}
        query={{ sort: sort === 'latest' ? undefined : sort }}
      />
    </main>
  );
}

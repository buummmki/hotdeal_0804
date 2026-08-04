import type { Metadata } from 'next';
import Link from 'next/link';
import { listSources } from '@/lib/queries';

export const revalidate = 300;

export const metadata: Metadata = {
  title: '출처별 모아보기',
  description: '뽐뿌, 루리웹, 클리앙, 퀘이사존 등 수집 중인 커뮤니티별로 특가를 모아 봅니다.',
};

export default async function SourceIndexPage() {
  const sources = await listSources();

  return (
    <main className="mx-auto max-w-4xl px-4 py-5">
      <h1 className="text-lg font-bold">출처별 모아보기</h1>
      <p className="mt-1 text-[13px] text-muted">
        현재 수집 중인 커뮤니티입니다. 각 사이트의 공개 게시글 제목과 링크만 수집합니다.
      </p>

      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {sources.map((s) => (
          <li key={s.id}>
            <Link
              href={`/source/${s.id}`}
              className="flex items-center gap-3 rounded-xl border border-line bg-card p-4 transition-colors hover:border-accent/40"
            >
              <span
                className="h-9 w-9 shrink-0 rounded-lg"
                style={{ background: `${s.color ?? '#64748b'}22`, color: s.color ?? '#64748b' }}
              >
                <span className="flex h-full w-full items-center justify-center text-sm font-bold">
                  {s.name.slice(0, 1)}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold">{s.name}</span>
                <span className="tnum block text-[12px] text-muted">
                  {s.crawl_cycle}분 주기 · {s.is_active ? '수집 중' : '중지됨'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

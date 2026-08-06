import Link from 'next/link';
import { DealRow } from './DealCard';
import { formatPrice } from '@/lib/format';
import type { DealWithSource } from '@/lib/types';

/** 사이드바·모바일 공통으로 쓰는 목록 블록 */
export function CurationBlock({
  title,
  deals,
  className = '',
}: {
  title: string;
  deals: DealWithSource[];
  className?: string;
}) {
  if (!deals.length) return null;
  return (
    <section className={`rounded-xl border border-line bg-card p-3 ${className}`}>
      <h2 className="mb-1.5 px-2 text-[13px] font-bold">{title}</h2>
      <div className="space-y-0.5">
        {deals.map((d, i) => (
          <DealRow key={d.id} deal={d} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}

/**
 * 모바일 상단 "실시간 인기" 가로 스크롤.
 *
 * 세로 목록으로 넣으면 정작 봐야 할 딜 목록이 화면 아래로 밀려납니다.
 * 가로 스크롤이면 높이를 적게 쓰면서 인기 딜을 먼저 보여줄 수 있습니다.
 */
export function MobileHotStrip({ deals }: { deals: DealWithSource[] }) {
  if (!deals.length) return null;
  return (
    <section className="mt-4 lg:hidden">
      <h2 className="mb-2 text-[14px] font-bold">지금 인기 있는 딜</h2>
      {/* -mx-4 + px-4 : 카드가 화면 가장자리까지 흐르도록 */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {deals.slice(0, 8).map((d, i) => (
          <Link
            key={d.id}
            href={`/deal/${d.id}`}
            className="flex w-[210px] shrink-0 snap-start flex-col justify-between rounded-xl border border-line bg-card p-3"
          >
            <div className="flex gap-2">
              <span className="tnum shrink-0 text-xs font-bold text-accent">{i + 1}</span>
              <p className="line-clamp-2 text-[13px] leading-snug">{d.title}</p>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted">
              <span className="tnum font-semibold text-accent">
                {formatPrice(d.price_text, d.price_value)}
              </span>
              <span className="tnum">댓글 {d.comment_count}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

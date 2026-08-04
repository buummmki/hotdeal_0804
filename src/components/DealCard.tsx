import Link from 'next/link';
import type { DealWithSource } from '@/lib/types';
import { timeAgo, formatPrice } from '@/lib/format';
import { SourceBadge, StatusBadge, FreeShipBadge, HotBadge } from './Badges';

function Thumb({ deal }: { deal: DealWithSource }) {
  if (!deal.image_url) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-line/40 text-muted"
        aria-hidden
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={deal.image_url}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );
}

export default function DealCard({
  deal, rank,
}: {
  deal: DealWithSource;
  rank?: number;
}) {
  const dim = deal.status !== 'normal';
  const hot = deal.comment_count >= 200 && deal.status === 'normal';

  return (
    <article
      className={`group relative rounded-xl border border-line bg-card transition-colors
                  hover:border-accent/40 ${dim ? 'opacity-60' : ''}`}
    >
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        {rank != null && (
          <div className="hidden w-6 shrink-0 pt-1 text-center sm:block">
            <span
              className={`tnum text-sm font-bold ${
                rank <= 3 ? 'text-accent' : 'text-muted'
              }`}
            >
              {rank}
            </span>
          </div>
        )}

        <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg sm:h-[92px] sm:w-[92px]">
          <Thumb deal={deal} />
        </div>

        <div className="min-w-0 flex-1">
          {/* 1순위: 가격 */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="tnum text-[17px] font-bold leading-none text-accent sm:text-lg">
              {formatPrice(deal.price_text, deal.price_value)}
            </span>
            {deal.shipping_free && deal.status === 'normal' && <FreeShipBadge />}
            <StatusBadge status={deal.status} />
            {hot && <HotBadge />}
          </div>

          {/* 2순위: 제목 */}
          <h3 className="mt-1.5 line-clamp-2 text-[14px] font-medium leading-snug text-fg group-hover:text-accent sm:text-[15px]">
            <Link href={`/deal/${deal.id}`} className="before:absolute before:inset-0">
              {deal.title}
            </Link>
          </h3>

          {/* 3순위: 출처 / 배송 / 시간 / 반응 */}
          <div className="relative z-10 mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted sm:text-xs">
            {deal.source && (
              <SourceBadge id={deal.source.id} name={deal.source.name} color={deal.source.color} />
            )}
            {!deal.shipping_free && deal.shipping_text && (
              <span className="tnum pointer-events-none">배송 {deal.shipping_text}</span>
            )}
            <span className="tnum pointer-events-none">{timeAgo(deal.published_at)}</span>
            <span className="tnum pointer-events-none inline-flex items-center gap-0.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {deal.comment_count.toLocaleString('ko-KR')}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/** 사이드바용 컴팩트 행 */
export function DealRow({ deal, rank }: { deal: DealWithSource; rank: number }) {
  return (
    <Link
      href={`/deal/${deal.id}`}
      className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-line/40"
    >
      <span
        className={`tnum mt-0.5 w-4 shrink-0 text-center text-xs font-bold ${
          rank <= 3 ? 'text-accent' : 'text-muted'
        }`}
      >
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] leading-snug">{deal.title}</p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
          <span className="tnum font-semibold text-accent">
            {formatPrice(deal.price_text, deal.price_value)}
          </span>
          <span className="tnum">댓글 {deal.comment_count}</span>
        </div>
      </div>
    </Link>
  );
}

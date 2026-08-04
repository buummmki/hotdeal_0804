import { DealRow } from './DealCard';
import type { DealWithSource } from '@/lib/types';

function Block({
  title, deals,
}: {
  title: string;
  deals: DealWithSource[];
}) {
  if (!deals.length) return null;
  return (
    <section className="rounded-xl border border-line bg-card p-3">
      <h2 className="mb-1.5 px-2 text-[13px] font-bold">{title}</h2>
      <div className="space-y-0.5">
        {deals.map((d, i) => (
          <DealRow key={d.id} deal={d} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}

export default function Sidebar({
  hot, latest, commented,
}: {
  hot: DealWithSource[];
  latest: DealWithSource[];
  commented: DealWithSource[];
}) {
  return (
    <aside className="hidden w-[300px] shrink-0 space-y-3 lg:block">
      <Block title="실시간 인기" deals={hot.slice(0, 7)} />
      <Block title="댓글 많은 딜" deals={commented.slice(0, 7)} />
      <Block title="방금 올라온 딜" deals={latest.slice(0, 7)} />
      <div className="rounded-xl border border-line bg-card p-4 text-[12px] leading-relaxed text-muted">
        <p className="mb-1 font-semibold text-fg">안내</p>
        <p>
          이 사이트는 각 커뮤니티에 게시된 특가 정보를 모아 보여줍니다. 실제 거래는 원문 및
          판매처에서 이루어지며, 가격·재고는 실시간과 다를 수 있습니다.
        </p>
      </div>
    </aside>
  );
}

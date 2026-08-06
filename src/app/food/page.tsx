import type { Metadata } from 'next';
import Link from 'next/link';
import { listDeals } from '@/lib/queries';
import DealCard from '@/components/DealCard';
import AdSlot from '@/components/AdSlot';
import { AD_SLOTS } from '@/lib/ads';
import { SITE } from '@/lib/site';
import type { DealWithSource } from '@/lib/types';

export const revalidate = 60;

const TITLE = '오늘의 식품 특가 · 먹거리 핫딜 모음';
const DESCRIPTION =
  '커뮤니티에 올라온 식품·먹거리 특가만 따로 모았습니다. 정육·수산, 간편식, 음료, 간식, ' +
  '건강식품까지 가격과 배송비를 한눈에 비교하세요. 매일 갱신됩니다.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/food' },
  openGraph: { title: `${TITLE} | ${SITE.name}`, description: DESCRIPTION, type: 'website' },
};

function Section({
  title,
  desc,
  deals,
  href,
}: {
  title: string;
  desc: string;
  deals: DealWithSource[];
  href: string;
}) {
  if (!deals.length) return null;
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-end justify-between border-b border-line pb-2">
        <div>
          <h2 className="text-[15px] font-bold">{title}</h2>
          <p className="mt-0.5 text-[12px] text-muted">{desc}</p>
        </div>
        <Link href={href} className="shrink-0 text-[12px] text-muted hover:text-fg">
          더보기 ›
        </Link>
      </div>
      <div className="space-y-2.5">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
    </section>
  );
}

export default async function FoodPage() {
  // 세 관점으로 나눠 보여준다. 전체 목록은 홈의 식품 탭이 담당하고,
  // 여기서는 "무엇부터 보면 되는지"를 정리해 주는 역할.
  const [fresh, cheap, popular] = await Promise.all([
    listDeals({ category: 'food', sort: 'latest', perPage: 8 }),
    listDeals({ category: 'food', sort: 'price', perPage: 6 }),
    listDeals({ category: 'food', sort: 'comment', perPage: 6 }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header>
        <h1 className="text-xl font-extrabold leading-snug sm:text-2xl">{TITLE}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          뽐뿌·루리웹·퀘이사존에 올라온 특가 글 중 <strong className="text-fg">식품·먹거리만</strong>{' '}
          골라 모았습니다. 제목에서 가격과 배송비를 뽑아내 정리하고, 댓글 반응과 조회수로 순위를
          매깁니다. 매일 아침 갱신되며, 올라온 지 14일이 지난 글은 자동으로 내려갑니다.
        </p>
        <p className="mt-2 text-[12px] text-muted">
          가격·재고는 수집 시점 기준이라 실제와 다를 수 있습니다. 구매 전 판매처에서 확인하세요.
        </p>
      </header>

      <Section
        title="방금 올라온 식품 특가"
        desc="가장 최근에 등록된 순서"
        deals={fresh.deals}
        href="/?cat=food&sort=latest"
      />

      <AdSlot slot={AD_SLOTS.detail} minHeight={280} className="!mt-7" />

      <Section
        title="가격 낮은 순"
        desc="지금 올라온 식품 딜 중 최저가"
        deals={cheap.deals}
        href="/?cat=food&sort=price"
      />

      <Section
        title="반응 많은 식품 딜"
        desc="댓글이 많이 달린 순 — 실제로 살 만한지 판단에 참고하세요"
        deals={popular.deals}
        href="/?cat=food&sort=comment"
      />

      <div className="mt-8 rounded-xl border border-line bg-card p-5 text-center">
        <p className="text-[14px] font-semibold">식품 특가 전체 보기</p>
        <p className="mt-1 text-[12px] text-muted">
          현재 {fresh.total.toLocaleString('ko-KR')}건이 올라와 있습니다
        </p>
        <Link
          href="/?cat=food"
          className="mt-3 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          전체 목록으로
        </Link>
      </div>
    </main>
  );
}

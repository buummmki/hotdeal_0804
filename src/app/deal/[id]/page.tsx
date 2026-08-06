import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDeal, relatedDeals } from '@/lib/queries';
import { categoryLabel } from '@/lib/types';
import { formatPrice, timeAgo, fullDate } from '@/lib/format';
import { SourceBadge, StatusBadge, FreeShipBadge } from '@/components/Badges';
import DealCard from '@/components/DealCard';
import AdSlot from '@/components/AdSlot';
import { AD_SLOTS } from '@/lib/ads';
import { SITE } from '@/lib/site';

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) return { title: '딜을 찾을 수 없습니다' };

  const price = formatPrice(deal.price_text, deal.price_value);
  const title = `${deal.title} — ${price}`;
  const description =
    deal.summary ??
    `${deal.source?.name ?? '커뮤니티'}에 올라온 ${categoryLabel(deal.category)} 특가. ${price}${
      deal.shipping_free ? ' / 무료배송' : ''
    }.`;

  return {
    title,
    description,
    alternates: { canonical: `/deal/${deal.id}` },
    // 품절·종료 딜은 색인에서 제외
    robots:
      deal.status === 'normal'
        ? { index: true, follow: true }
        : { index: false, follow: true },
    openGraph: {
      title,
      description,
      type: 'article',
      images: deal.image_url ? [deal.image_url] : undefined,
      publishedTime: deal.published_at,
    },
  };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-line py-2.5 last:border-0">
      <dt className="w-20 shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-[13px]">{value}</dd>
    </div>
  );
}

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const related = await relatedDeals(deal);
  const price = formatPrice(deal.price_text, deal.price_value);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: deal.title,
        image: deal.image_url ?? undefined,
        description: deal.summary ?? undefined,
        category: categoryLabel(deal.category),
        offers: {
          '@type': 'Offer',
          price: deal.price_value ?? undefined,
          priceCurrency: deal.currency ?? 'KRW',
          availability:
            deal.status === 'normal'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: deal.source_url,
          ...(deal.shipping_free
            ? {
                shippingDetails: {
                  '@type': 'OfferShippingDetails',
                  shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'KRW' },
                },
              }
            : {}),
        },
      },
      // 검색결과에 계층 경로가 노출되고, AI 답변엔진이 문서 맥락을 잡는 데도 쓰입니다.
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE.name, item: SITE.url },
          {
            '@type': 'ListItem',
            position: 2,
            name: categoryLabel(deal.category),
            item: `${SITE.url}/?cat=${deal.category}`,
          },
          { '@type': 'ListItem', position: 3, name: deal.title },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-4 flex items-center gap-1.5 text-[12px] text-muted">
        <Link href="/" className="hover:text-fg">홈</Link>
        <span>›</span>
        <Link href={`/?cat=${deal.category}`} className="hover:text-fg">
          {categoryLabel(deal.category)}
        </Link>
      </nav>

      <article className="rounded-xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          {deal.source && (
            <SourceBadge id={deal.source.id} name={deal.source.name} color={deal.source.color} />
          )}
          <StatusBadge status={deal.status} />
          <span className="tnum text-[12px] text-muted">{timeAgo(deal.published_at)}</span>
        </div>

        <h1 className="mt-2 text-xl font-bold leading-snug sm:text-[22px]">{deal.title}</h1>

        <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
          <span className="tnum text-3xl font-extrabold text-accent">{price}</span>
          {deal.shipping_free ? (
            <FreeShipBadge />
          ) : (
            deal.shipping_text && (
              <span className="tnum text-sm text-muted">배송비 {deal.shipping_text}</span>
            )
          )}
        </div>

        {deal.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deal.image_url}
            alt={deal.title}
            loading="lazy"
            // 뽐뿌 CDN 은 외부 Referer 를 302 로 막는다
            referrerPolicy="no-referrer"
            // 작은 썸네일이 억지로 늘어나 뭉개지지 않도록 원본 크기를 넘기지 않는다.
            // (w-full 로 늘리면 60px 이미지가 700px 로 확대돼 계단현상이 생김)
            className="mt-4 h-auto max-h-[520px] w-auto max-w-full rounded-lg border border-line object-contain"
          />
        )}

        {deal.summary && (
          <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed">{deal.summary}</p>
        )}

        {deal.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {deal.tags.map((t) => (
              <Link
                key={t}
                href={`/search?q=${encodeURIComponent(t)}`}
                className="rounded-full border border-line px-2.5 py-1 text-[12px] text-muted hover:text-fg"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <a
            href={deal.buy_url ?? deal.source_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex-1 rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {deal.buy_url ? '구매처로 이동' : '원문 보기'}
          </a>
          {deal.buy_url && (
            <a
              href={deal.source_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex-1 rounded-lg border border-line px-4 py-3 text-center text-sm font-medium transition-colors hover:border-accent/50"
            >
              원문 게시글 보기
            </a>
          )}
        </div>

        <dl className="mt-5">
          <InfoRow label="카테고리" value={categoryLabel(deal.category)} />
          <InfoRow label="출처" value={deal.source?.name ?? deal.source_id} />
          <InfoRow label="등록" value={fullDate(deal.published_at)} />
          <InfoRow
            label="반응"
            value={<span className="tnum">댓글 {deal.comment_count.toLocaleString('ko-KR')}개</span>}
          />
          <InfoRow
            label="상태"
            value={
              deal.status === 'normal'
                ? `판매 중 (마지막 확인 ${timeAgo(deal.checked_at ?? deal.updated_at)})`
                : deal.status === 'soldout'
                  ? '품절'
                  : '종료됨'
            }
          />
          <InfoRow label="랭킹 점수" value={<span className="tnum">{deal.rank_score}</span>} />
        </dl>

        <p className="mt-4 rounded-lg bg-line/30 p-3 text-[12px] leading-relaxed text-muted">
          가격과 재고는 수집 시점 기준이며 실제와 다를 수 있습니다. 구매 전 판매처에서 반드시
          확인하세요.
        </p>
      </article>

      {/* 본문을 다 읽은 뒤, 관련 딜로 넘어가기 직전. 원문 링크 버튼과 충분히
          떨어져 있어야 오클릭으로 오해받지 않습니다. */}
      <AdSlot slot={AD_SLOTS.detail} minHeight={280} className="!mt-6" />

      {related.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-[15px] font-bold">
            같은 카테고리 딜 · {categoryLabel(deal.category)}
          </h2>
          <div className="space-y-2.5">
            {related.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

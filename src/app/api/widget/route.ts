import { NextResponse } from 'next/server';
import { listDeals } from '@/lib/queries';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';
export const revalidate = 300; // 5분 캐시. 위젯이 매 방문마다 DB 를 때리지 않게.

/**
 * 외부 사이트(워드프레스 등)에 붙이는 위젯용 딜 목록.
 *
 * 워드프레스는 다른 도메인이라 브라우저가 CORS 를 요구합니다.
 * 공개 정보만 내보내므로 모든 출처에 허용합니다.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get('cat') ?? 'food';
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get('limit') ?? 5)));

  try {
    const { deals } = await listDeals({ category, sort: 'rank', perPage: limit });

    return NextResponse.json(
      {
        site: SITE.name,
        link: `${SITE.url}/${category === 'food' ? 'food' : `?cat=${category}`}`,
        updatedAt: new Date().toISOString(),
        deals: deals.map((d) => ({
          id: d.id,
          title: d.title,
          price: d.price_text ?? null,
          freeShipping: d.shipping_free ?? false,
          source: d.source?.name ?? null,
          comments: d.comment_count,
          url: `${SITE.url}/deal/${d.id}`,
        })),
      },
      { headers: CORS }
    );
  } catch (e) {
    return NextResponse.json(
      { deals: [], error: e instanceof Error ? e.message : String(e) },
      { status: 500, headers: CORS }
    );
  }
}

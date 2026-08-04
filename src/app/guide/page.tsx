import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용안내',
  description: '핫딜모아 서비스 이용 방법과 데이터 수집 원칙을 안내합니다.',
};

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold">이용안내</h1>

      <section className="mt-6 space-y-2">
        <h2 className="text-[15px] font-bold">이 사이트는 무엇인가요</h2>
        <p className="text-[14px] leading-relaxed text-muted">
          여러 커뮤니티에 흩어져 올라오는 특가 정보를 한곳에 모아 랭킹 형태로 보여주는 집계
          서비스입니다. 직접 상품을 판매하지 않으며, 실제 거래는 원문 게시글과 각 판매처에서
          이루어집니다.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-[15px] font-bold">랭킹은 어떻게 정해지나요</h2>
        <p className="text-[14px] leading-relaxed text-muted">
          단순 최신순이 아니라 반응·조회·신선도·정보 완성도를 합산한 점수로 정렬합니다.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-line bg-card p-3 text-[12px] leading-relaxed">
{`rank_score = 반응 × 0.5
           + 조회 × 0.2
           + 신선도 × 0.2   (24시간 반감기)
           + 품질 × 0.1     (가격·이미지·배송비 정보 유무)
           + 운영 보정`}
        </pre>
        <p className="text-[14px] leading-relaxed text-muted">
          품절·종료 딜은 감점되어 자연스럽게 아래로 내려갑니다.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-[15px] font-bold">수집 원칙</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-muted">
          <li>공개된 게시글의 제목, 링크, 가격 등 사실 정보만 수집합니다.</li>
          <li>본문 전문은 복제하지 않으며, 항상 원문으로 연결합니다.</li>
          <li>각 사이트의 robots.txt 를 준수하고 요청 간격을 충분히 둡니다.</li>
          <li>수집 중단 요청이 있으면 해당 출처를 즉시 제외합니다.</li>
        </ul>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-[15px] font-bold">문의</h2>
        <p className="text-[14px] leading-relaxed text-muted">
          수집 중단 요청, 오류 신고, 제휴 문의는 운영자 이메일로 보내주세요.
          {' '}
          <span className="rounded bg-line/50 px-1.5 py-0.5">여기에 연락처를 채워 넣으세요</span>
        </p>
      </section>
    </main>
  );
}

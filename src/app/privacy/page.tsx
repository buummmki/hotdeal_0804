import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보 처리방침 및 면책조항',
  description: '핫딜모아의 개인정보 처리방침과 면책 안내입니다.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold">개인정보 처리방침 · 면책조항</h1>

      <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[12.5px] leading-relaxed text-amber-700 dark:text-amber-400">
        아래 내용은 초안 템플릿입니다. 실제 서비스 공개 전에 운영 주체·연락처·수집 항목을 실제
        상황에 맞게 채우고, 필요하다면 법률 검토를 받으세요.
      </p>

      <section className="mt-6 space-y-2">
        <h2 className="text-[15px] font-bold">수집하는 개인정보</h2>
        <p className="text-[14px] leading-relaxed text-muted">
          현재 버전은 회원가입 기능이 없으며 이름, 이메일 등 개인을 식별할 수 있는 정보를
          수집하지 않습니다. 서비스 운영을 위한 접속 로그(IP, 브라우저 정보)가 호스팅
          제공자에 의해 일시적으로 기록될 수 있습니다.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-[15px] font-bold">쿠키 및 로컬 저장소</h2>
        <p className="text-[14px] leading-relaxed text-muted">
          다크모드 설정을 기억하기 위해 브라우저 로컬 저장소를 사용합니다. 이 값은 서버로
          전송되지 않습니다.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-[15px] font-bold">저작권</h2>
        <p className="text-[14px] leading-relaxed text-muted">
          이 사이트에 표시되는 게시물의 제목과 링크는 각 커뮤니티 및 원저작자에게 저작권이
          있습니다. 본 서비스는 검색·탐색 편의를 위한 집계와 인용의 범위에서 이를 표시하며,
          권리자의 요청이 있으면 지체 없이 삭제합니다.
        </p>
      </section>

      <section className="mt-6 space-y-2">
        <h2 className="text-[15px] font-bold">면책</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-muted">
          <li>표시된 가격·배송비·재고는 수집 시점 기준이며 실제와 다를 수 있습니다.</li>
          <li>본 서비스는 상품을 직접 판매하지 않으며 거래 당사자가 아닙니다.</li>
          <li>거래 과정에서 발생한 손해에 대해 책임을 지지 않습니다.</li>
          <li>구매 전 반드시 판매처에서 조건을 확인하시기 바랍니다.</li>
        </ul>
      </section>
    </main>
  );
}

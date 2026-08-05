/**
 * 사이트 브랜드/SEO 상수를 한곳에 모은 파일.
 * 이름이나 도메인이 바뀌면 여기만 고치면 됩니다.
 */

export const SITE = {
  /** 서비스명 */
  name: '온누리 할인정보',
  /** 짧은 표기 (템플릿 접미사 등) */
  shortName: '온누리 할인정보',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',

  title: '온누리 할인정보 — 오늘의 핫딜·특가 실시간 모음',

  description:
    '뽐뿌·루리웹·퀘이사존 등 국내 주요 커뮤니티에 올라온 핫딜과 특가 정보를 하루 단위로 모아 ' +
    '가격·댓글 반응·조회수 기준 랭킹으로 보여줍니다.',

  /** 검색 노출을 노리는 핵심어. 실제 페이지 내용과 어긋나지 않는 범위로만 둡니다. */
  keywords: [
    '온누리 할인정보',
    '핫딜',
    '핫딜 모음',
    '오늘의 특가',
    '특가 정보',
    '할인 정보',
    '뽐뿌 핫딜',
    '루리웹 핫딜',
    '퀘이사존 지름',
    '최저가 정보',
  ],

  locale: 'ko_KR',
} as const;

/** 현재 수집 중인 출처 (구조화 데이터·안내 문구에 함께 사용) */
export const SOURCE_NAMES = ['뽐뿌', '루리웹', '퀘이사존'] as const;

/**
 * 사이트 전역 구조화 데이터.
 *
 * 검색엔진뿐 아니라 AI 검색(GEO)에서도 "이 사이트가 무엇을 다루는 곳인지"를
 * 기계가 읽을 수 있어야 답변에 인용됩니다. WebSite + Organization 를 함께 둡니다.
 */
export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: 'ko-KR',
        publisher: { '@id': `${SITE.url}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE.url}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
      },
    ],
  };
}

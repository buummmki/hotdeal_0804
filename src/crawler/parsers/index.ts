/**
 * ============================================================
 *  파서 레지스트리
 * ============================================================
 *
 *  ⚠️ 중요 — 셀렉터는 반드시 직접 검증하세요.
 *
 *  아래 파서들의 CSS 셀렉터는 각 커뮤니티의 일반적인 마크업 패턴을
 *  기준으로 작성한 "골격"입니다. 사이트는 예고 없이 HTML을 바꾸므로,
 *  실제 수집 전에 각 사이트의 목록 페이지를 브라우저 개발자 도구로
 *  열어 셀렉터를 확인하고 SELECTORS 상수를 수정해야 합니다.
 *
 *  검증 방법:
 *    npx tsx src/crawler/inspect.ts ppomppu
 *  → 목록 페이지를 받아 파싱 결과 상위 5건을 출력합니다.
 *
 *  ⚠️ 법적 고려
 *    - 각 사이트의 robots.txt 와 이용약관을 먼저 확인하세요.
 *    - 제목·링크·가격 같은 사실 정보만 수집하고 본문 전문은 복제하지 마세요.
 *    - 요청 간격을 충분히 두고(기본 1.5초) User-Agent에 연락처를 남기세요.
 *    - 사이트에서 중단 요청이 오면 즉시 해당 소스를 is_active=false 로 내리세요.
 */
import type { Parser } from '../types';
import { ppomppu } from './ppomppu';
import { ruliweb } from './ruliweb';
import { clien } from './clien';
import { quasar } from './quasar';

export const PARSERS: Record<string, Parser> = {
  ppomppu: ppomppu,
  ruliweb: ruliweb,
  clien: clien,
  quasar: quasar,
};

export function getParser(sourceId: string): Parser | null {
  return PARSERS[sourceId] ?? null;
}

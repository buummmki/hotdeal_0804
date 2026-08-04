/**
 * 파서 셀렉터 검증용 도구.
 *   npx tsx src/crawler/inspect.ts ppomppu
 *
 * 목록 페이지를 받아 파싱 결과 상위 5건과 정규화 결과를 출력합니다.
 * 결과가 0건이면 parsers/<id>.ts 의 SELECTORS 를 수정하세요.
 */
import { loadEnv } from './env';
loadEnv();

const LIST_URLS: Record<string, { list: string; base: string }> = {
  ppomppu: { list: 'https://www.ppomppu.co.kr/zboard/zboard.php?id=ppomppu', base: 'https://www.ppomppu.co.kr/zboard/' },
  ruliweb: { list: 'https://bbs.ruliweb.com/market/board/1020', base: 'https://bbs.ruliweb.com' },
  clien:   { list: 'https://www.clien.net/service/board/jirum', base: 'https://www.clien.net' },
  quasar:  { list: 'https://quasarzone.com/bbs/qb_saleinfo', base: 'https://quasarzone.com' },
};

async function main() {
  const id = process.argv[2];
  const target = LIST_URLS[id];
  if (!target) {
    console.error(`사용법: npx tsx src/crawler/inspect.ts <${Object.keys(LIST_URLS).join('|')}>`);
    process.exit(1);
  }

  const { getParser } = await import('./parsers');
  const { normalize } = await import('./normalize');

  const parser = getParser(id)!;
  const res = await fetch(target.list, {
    headers: { 'User-Agent': 'HotdealBot/0.1', 'Accept-Language': 'ko-KR' },
  });
  console.log(`HTTP ${res.status} ${res.headers.get('content-type')}`);

  const ct = res.headers.get('content-type') ?? '';
  const charset = ct.match(/charset=([\w-]+)/i)?.[1]?.toLowerCase();
  const buf = await res.arrayBuffer();
  const html = new TextDecoder(charset && charset !== 'utf8' ? charset : 'utf-8').decode(buf);

  const items = parser.parseList(html, target.base);
  console.log(`\n파싱된 항목: ${items.length}건\n`);

  if (items.length === 0) {
    console.log('⚠️  0건입니다. src/crawler/parsers/' + id + '.ts 의 SELECTORS 를 브라우저 개발자');
    console.log('    도구로 확인한 실제 셀렉터로 교체하세요.');
    console.log('\nHTML 앞부분 미리보기:\n');
    console.log(html.slice(0, 1200));
    return;
  }

  for (const item of items.slice(0, 5)) {
    console.log('─'.repeat(60));
    console.log(item.title);
    console.log(normalize(item, id, {}));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

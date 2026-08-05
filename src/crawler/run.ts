/**
 * 수동 수집 실행
 *   npx tsx src/crawler/run.ts            # 전체 활성 소스
 *   npx tsx src/crawler/run.ts ppomppu    # 특정 소스만
 *
 * .env.local 의 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.
 */
import { loadEnv } from './env';
loadEnv();

async function main() {
  const { crawlAll, crawlSource, purgeOldDeals, rescore, RETENTION_DAYS } = await import('./pipeline');
  const { serviceClient } = await import('@/lib/supabase');

  const only = process.argv[2];

  if (only) {
    const db = serviceClient();
    const { data } = await db.from('source').select('*').eq('id', only).maybeSingle();
    if (!data) {
      console.error(`소스 '${only}' 를 찾을 수 없습니다.`);
      process.exit(1);
    }
    console.table([await crawlSource(data as never)]);
  } else {
    console.table(await crawlAll());
    const purged = await purgeOldDeals();
    console.log(`${RETENTION_DAYS}일 지난 딜 ${purged}건 정리`);
  }

  await rescore();
  console.log('랭킹 점수 재계산 완료');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

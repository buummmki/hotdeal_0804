export default function MockNotice() {
  return (
    <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-700 dark:text-amber-400">
      <strong className="font-semibold">샘플 데이터로 표시 중</strong> — Supabase 키가 설정되지
      않아 <code className="rounded bg-amber-500/15 px-1">src/lib/mock.ts</code> 의 예시 딜을
      보여주고 있습니다. <code className="rounded bg-amber-500/15 px-1">.env.local</code> 에 키를
      넣으면 실제 DB로 자동 전환됩니다.
    </div>
  );
}

import { NextResponse } from 'next/server';
import { crawlAll, rescore } from '@/crawler/pipeline';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Hobby 한도

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const results = await crawlAll();
    await rescore();
    const total = results.reduce(
      (a, r) => ({
        found: a.found + r.found,
        inserted: a.inserted + r.inserted,
        updated: a.updated + r.updated,
        skipped: a.skipped + r.skipped,
      }),
      { found: 0, inserted: 0, updated: 0, skipped: 0 }
    );
    return NextResponse.json({ ok: true, total, results });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

/**
 * 커뮤니티 목록 페이지 HTTP 클라이언트.
 *
 * 왜 fetch() 를 그대로 안 쓰나:
 *   퀘이사존 등 일부 사이트는 Node 내장 fetch(undici) 의 TLS/HTTP1.1 지문을
 *   봇으로 판정해 헤더를 어떻게 바꿔도 403 을 돌려줍니다.
 *   브라우저와 동일하게 HTTP/2 로 요청하면 정상 200 이 옵니다.
 *   → 1차: node:http2, 2차(ALPN 실패 등): fetch 폴백
 */
import http2 from 'node:http2';
import zlib from 'node:zlib';

export const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const TIMEOUT_MS = Number(process.env.CRAWL_TIMEOUT_MS ?? 20_000);

const COMMON_HEADERS: Record<string, string> = {
  'user-agent': BROWSER_UA,
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'upgrade-insecure-requests': '1',
};

interface RawResponse {
  status: number;
  contentType: string;
  encoding: string;
  body: Buffer;
}

function fetchViaHttp2(url: string): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    let settled = false;
    const fail = (e: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { client.destroy(); } catch { /* noop */ }
      reject(e);
    };

    const client = http2.connect(u.origin);
    const timer = setTimeout(() => fail(new Error(`timeout ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
    client.on('error', fail);

    const req = client.request({
      ':method': 'GET',
      ':path': u.pathname + u.search,
      ...COMMON_HEADERS,
      referer: u.origin + '/',
    });

    let status = 0;
    let contentType = '';
    let encoding = '';
    const chunks: Buffer[] = [];

    req.on('response', (h) => {
      status = Number(h[':status'] ?? 0);
      contentType = String(h['content-type'] ?? '');
      encoding = String(h['content-encoding'] ?? '');
    });
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('error', fail);
    req.on('end', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { client.close(); } catch { /* noop */ }
      resolve({ status, contentType, encoding, body: Buffer.concat(chunks) });
    });
    req.end();
  });
}

async function fetchViaFetch(url: string): Promise<RawResponse> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: COMMON_HEADERS, signal: ctrl.signal, cache: 'no-store' });
    return {
      status: res.status,
      contentType: res.headers.get('content-type') ?? '',
      encoding: '', // fetch 가 이미 해제함
      body: Buffer.from(await res.arrayBuffer()),
    };
  } finally {
    clearTimeout(timer);
  }
}

function decompress(body: Buffer, encoding: string): Buffer {
  try {
    if (/\bgzip\b/i.test(encoding)) return zlib.gunzipSync(body);
    if (/\bdeflate\b/i.test(encoding)) return zlib.inflateSync(body);
    if (/\bbr\b/i.test(encoding)) return zlib.brotliDecompressSync(body);
  } catch { /* 압축 해제 실패 시 원본 사용 */ }
  return body;
}

const CHARSET_ALIAS: Record<string, string> = {
  'ks_c_5601-1987': 'euc-kr',
  ksc5601: 'euc-kr',
  'x-windows-949': 'euc-kr',
  cp949: 'euc-kr',
  'windows-949': 'euc-kr',
};

function decode(body: Buffer, contentType: string): string {
  const pick = (raw: string | undefined) => {
    if (!raw) return null;
    const c = raw.toLowerCase();
    return CHARSET_ALIAS[c] ?? c;
  };

  // 1) 응답 헤더의 charset
  let charset = pick(contentType.match(/charset=["']?([\w-]+)/i)?.[1]);

  // 2) 헤더에 없으면 <meta charset> 스니핑 (뽐뿌 등 EUC-KR 대응)
  if (!charset) {
    const head = body.subarray(0, 4096).toString('latin1');
    charset = pick(head.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]);
  }

  if (charset && !/^utf-?8$/.test(charset)) {
    try {
      return new TextDecoder(charset).decode(body);
    } catch { /* 미지원 인코딩이면 utf-8 로 폴백 */ }
  }
  return body.toString('utf8');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 한 번 시도.
 *  기본은 fetch. 대부분의 사이트에서 가장 안정적입니다.
 *  fetch 가 실패하거나 403/429 를 받으면(= 봇 판정) http2 로 재시도합니다.
 *  퀘이사존이 정확히 이 경우입니다.
 */
async function attempt(url: string): Promise<RawResponse> {
  let res: RawResponse | null = null;
  let fetchErr: unknown = null;

  try {
    res = await fetchViaFetch(url);
    if (res.status !== 403 && res.status !== 429) return res;
  } catch (e) {
    fetchErr = e;
  }

  // 여기까지 왔다는 건 fetch 가 막혔거나 실패했다는 뜻
  try {
    return await fetchViaHttp2(url);
  } catch (h2err) {
    if (res) return res; // http2 도 안 되면 fetch 의 403 응답이라도 반환
    throw fetchErr ?? h2err;
  }
}

/**
 * 목록 페이지 HTML 을 문자열로. 실패하면 예외를 던집니다.
 * 커뮤니티 서버는 순간적으로 느려지는 일이 잦아 1회 재시도합니다.
 */
export async function fetchHtml(url: string, retries = 1): Promise<string> {
  let lastErr: unknown;

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await attempt(url);
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`HTTP ${res.status} — ${url}`);
      }
      return decode(decompress(res.body, res.encoding), res.contentType);
    } catch (e) {
      lastErr = e;
      if (i < retries) await sleep(2_000);
    }
  }

  const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(`${msg} — ${url}`);
}

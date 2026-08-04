import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** .env.local → .env 순으로 읽어 process.env 에 주입 (의존성 없이) */
export function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = (m[2] ?? '').trim();
      if (/^(['"]).*\1$/.test(val)) val = val.slice(1, -1);
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

import { NextResponse } from "next/server";
import { redisCache, isRedisConfigured } from "@/lib/redis-enhanced";

type Metric = {
  name: string; // LCP, INP, CLS, FCP, TTFB
  value: number;
  delta?: number;
  id?: string;
  rating?: "good" | "needs-improvement" | "poor";
  navigationType?: string;
  url?: string;
  ts?: number;
};

const KEY_PREFIX = "wv:home:";
const MAX_ENTRIES = 200; // cap stored samples

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Metric | Metric[];
    const now = Date.now();
    const metrics = Array.isArray(body) ? body : [body];

    const entries = metrics.map(m => ({ ...m, ts: m.ts ?? now }));

    // Store per metric name as a simple rolling list
    await Promise.all(
      entries.map(async entry => {
        const key = `${KEY_PREFIX}${entry.name.toUpperCase()}`;
        const existing = ((await redisCache.get<any[]>(key)) || []) as any[];
        const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
        await redisCache.set(key, updated, 60 * 60 * 24); // 24h TTL
      })
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 400 }
    );
  }
}

export async function GET() {
  // Return a compact snapshot for quick review
  const names = ["LCP", "INP", "CLS", "FCP", "TTFB"];
  const data: Record<string, any> = {};
  for (const n of names) {
    const key = `${KEY_PREFIX}${n}`;
    const list = ((await redisCache.get<any[]>(key)) || []) as any[];
    const values = list.map(x => Number(x.value)).filter(v => !Number.isNaN(v));
    const avg = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
    const p75 = values.length
      ? values.slice().sort((a, b) => a - b)[Math.floor(values.length * 0.75)]
      : 0;
    data[n] = {
      count: values.length,
      avg,
      p75,
      last: list[0] || null,
    };
  }
  return NextResponse.json({ redis: isRedisConfigured, data });
}

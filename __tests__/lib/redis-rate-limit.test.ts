import { NextRequest } from "next/server";

jest.mock("@/lib/redis", () => ({
  isRedisConfigured: true,
  rateLimitRedisTimeoutMs: 1000,
  rateLimitRedis: { eval: jest.fn() },
}));

function req(ip = "198.51.100.1") {
  return new NextRequest("https://www.techtots.ro/api/books", {
    headers: { "x-forwarded-for": ip },
  });
}

let limiterModule: typeof import("@/lib/rate-limit");
let redis: { eval: jest.Mock };

beforeEach(async () => {
  jest.resetModules();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-06T13:00:00Z"));
  process.env.RATE_LIMIT_PROVIDER = "redis";
  limiterModule = await import("@/lib/rate-limit");
  redis = (await import("@/lib/redis")).rateLimitRedis as unknown as {
    eval: jest.Mock;
  };
  jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  delete process.env.RATE_LIMIT_PROVIDER;
});

it("starts absent counters atomically and blocks the request after the allowance", async () => {
  redis.eval
    .mockResolvedValueOnce([1, 60_000])
    .mockResolvedValueOnce([2, 59_000])
    .mockResolvedValueOnce([3, 58_000]);
  const timersBefore = jest.getTimerCount();
  const limit = limiterModule.rateLimit({ limit: 2, windowMs: 60_000 });
  expect(await limit(req())).toBeNull();
  expect(await limit(req())).toBeNull();
  const blocked = await limit(req());
  expect(blocked?.status).toBe(429);
  expect(Number(blocked?.headers.get("Retry-After"))).toBeLessThanOrEqual(60);
  expect(redis.eval).toHaveBeenCalledWith(
    expect.stringContaining("redis.call('INCR'"),
    ["ratelimit:v2:2:60000:198.51.100.1"],
    [60_000]
  );
  expect(limiterModule.rateLimitHealth.status.fallbackRequests).toBe(0);
  expect(jest.getTimerCount()).toBe(timersBefore);
});

it("retains usage when Redis fails, opens the circuit and safely recovers", async () => {
  redis.eval
    .mockResolvedValueOnce([1, 60_000])
    .mockRejectedValue(new Error("unavailable"));
  const limit = limiterModule.rateLimit({ limit: 3, windowMs: 60_000 });
  expect(await limit(req())).toBeNull();
  expect(await limit(req())).toBeNull();
  expect(await limit(req())).toBeNull();
  expect((await limit(req()))?.status).toBe(429);
  expect(limiterModule.rateLimitHealth.status.circuitOpen).toBe(true);
  const calls = redis.eval.mock.calls.length;
  expect((await limit(req()))?.status).toBe(429);
  expect(redis.eval).toHaveBeenCalledTimes(calls);
  jest.advanceTimersByTime(30_001);
  redis.eval.mockResolvedValueOnce([2, 29_999]);
  expect((await limit(req()))?.status).toBe(429);
  expect(limiterModule.rateLimitHealth.status.circuitOpen).toBe(false);
  jest.advanceTimersByTime(60_000);
  redis.eval.mockResolvedValueOnce([1, 60_000]);
  expect(await limit(req())).toBeNull();
});

it("does not let a hanging operation block requests past its budget", async () => {
  redis.eval.mockImplementation(() => new Promise(() => {}));
  const pending = limiterModule.rateLimit({ limit: 1, windowMs: 60_000 })(
    req()
  );
  await jest.advanceTimersByTimeAsync(1000);
  expect(await pending).toBeNull();
  const next = limiterModule.rateLimit({ limit: 1, windowMs: 60_000 })(req());
  await jest.advanceTimersByTimeAsync(1000);
  expect((await next)?.status).toBe(429);
});

it("isolates different quotas and rejects invalid Redis responses", async () => {
  redis.eval.mockResolvedValue([1, -1]);
  const one = limiterModule.rateLimit({ limit: 1, windowMs: 60_000 });
  const two = limiterModule.rateLimit({ limit: 2, windowMs: 60_000 });
  expect(await one(req())).toBeNull();
  expect((await one(req()))?.status).toBe(429);
  expect(await two(req())).toBeNull();
  expect(limiterModule.rateLimitHealth.status.fallbackRequests).toBe(3);
});

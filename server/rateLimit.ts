import { TRPCError } from "@trpc/server";

type RateLimitEntry = {
  count: number;
  firstSeenAt: number;
};

export function assertWindowRateLimit({
  store,
  key,
  maxAttempts,
  windowMs,
  message,
}: {
  store: Map<string, RateLimitEntry>;
  key: string;
  maxAttempts: number;
  windowMs: number;
  message: string;
}) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) return;

  if (now - entry.firstSeenAt > windowMs) {
    store.delete(key);
    return;
  }

  if (entry.count >= maxAttempts) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message,
    });
  }
}

export function recordWindowRateLimitHit({
  store,
  key,
  windowMs,
}: {
  store: Map<string, RateLimitEntry>;
  key: string;
  windowMs: number;
}) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now - entry.firstSeenAt > windowMs) {
    store.set(key, { count: 1, firstSeenAt: now });
    return;
  }

  store.set(key, {
    count: entry.count + 1,
    firstSeenAt: entry.firstSeenAt,
  });
}

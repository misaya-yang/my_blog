import { describe, expect, it } from "vitest";
import { createMemoryQuotaStore, nextUtcDay, utcDayStart } from "./quota";
import type { AgentIdentity } from "./types";

const anonymous: AgentIdentity = {
  type: "anonymous",
  tier: "anonymous",
  key: "anon-key",
  displayName: null,
};

const visitor: AgentIdentity = {
  type: "visitor",
  tier: "visitor",
  key: "visitor-key",
  displayName: "Reader",
};

describe("AI quota store", () => {
  it("normalizes daily quota windows to UTC days", () => {
    const date = new Date("2026-05-30T18:30:00.000Z");

    expect(utcDayStart(date).toISOString()).toBe("2026-05-30T00:00:00.000Z");
    expect(nextUtcDay(date).toISOString()).toBe("2026-05-31T00:00:00.000Z");
  });

  it("blocks anonymous readers on the third daily assistant message", async () => {
    const store = createMemoryQuotaStore();
    const now = new Date("2026-05-30T08:00:00.000Z");

    expect((await store.reserveDailyMessage(anonymous, 2, now)).allowed).toBe(true);
    expect((await store.reserveDailyMessage(anonymous, 2, now)).allowed).toBe(true);

    const third = await store.reserveDailyMessage(anonymous, 2, now);
    expect(third.allowed).toBe(false);
    expect(third.used).toBe(2);
    expect(third.remaining).toBe(0);
  });

  it("blocks visitor readers on the seventh daily assistant message", async () => {
    const store = createMemoryQuotaStore();
    const now = new Date("2026-05-30T08:00:00.000Z");

    const attempts = await Promise.all(
      Array.from({ length: 7 }, () => store.reserveDailyMessage(visitor, 6, now))
    );

    expect(attempts.slice(0, 6).every((quota) => quota.allowed)).toBe(true);
    expect(attempts[6]).toMatchObject({ allowed: false, used: 6, remaining: 0 });
  });

  it("does not allow concurrent reservations to exceed the configured limit", async () => {
    const store = createMemoryQuotaStore();
    const now = new Date("2026-05-30T08:00:00.000Z");
    const attempts = await Promise.all(
      Array.from({ length: 12 }, () => store.reserveDailyMessage(anonymous, 2, now))
    );

    expect(attempts.filter((quota) => quota.allowed)).toHaveLength(2);
    expect(attempts.filter((quota) => !quota.allowed)).toHaveLength(10);
  });

  it("tracks file upload quota separately from assistant messages", async () => {
    const store = createMemoryQuotaStore();
    const now = new Date("2026-05-30T10:00:00.000Z");

    const firstMessage = await store.reserveDailyMessage(anonymous, 2, now);
    const firstUpload = await store.reserveDailyAction(anonymous, "file_upload", 1, now);
    const secondUpload = await store.reserveDailyAction(anonymous, "file_upload", 1, now);
    const messageQuota = await store.getDailyMessageQuota(anonymous, 2, now);

    expect(firstMessage).toMatchObject({ allowed: true, used: 1, remaining: 1 });
    expect(firstUpload).toMatchObject({ allowed: true, used: 1, remaining: 0 });
    expect(secondUpload).toMatchObject({ allowed: false, used: 1, remaining: 0 });
    expect(messageQuota).toMatchObject({ used: 1, remaining: 1 });
  });
});

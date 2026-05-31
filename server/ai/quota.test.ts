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

  it("blocks anonymous readers after ten daily assistant messages", async () => {
    const store = createMemoryQuotaStore();
    const now = new Date("2026-05-30T08:00:00.000Z");

    const attempts = await Promise.all(
      Array.from({ length: 11 }, () =>
        store.reserveDailyMessage(anonymous, 10, now)
      )
    );

    expect(attempts.slice(0, 10).every(quota => quota.allowed)).toBe(true);
    expect(attempts[10]).toMatchObject({
      allowed: false,
      used: 10,
      remaining: 0,
    });
  });

  it("blocks visitor readers after thirty daily assistant messages", async () => {
    const store = createMemoryQuotaStore();
    const now = new Date("2026-05-30T08:00:00.000Z");

    const attempts = await Promise.all(
      Array.from({ length: 31 }, () =>
        store.reserveDailyMessage(visitor, 30, now)
      )
    );

    expect(attempts.slice(0, 30).every(quota => quota.allowed)).toBe(true);
    expect(attempts[30]).toMatchObject({
      allowed: false,
      used: 30,
      remaining: 0,
    });
  });

  it("does not allow concurrent reservations to exceed the configured limit", async () => {
    const store = createMemoryQuotaStore();
    const now = new Date("2026-05-30T08:00:00.000Z");
    const attempts = await Promise.all(
      Array.from({ length: 12 }, () =>
        store.reserveDailyMessage(anonymous, 10, now)
      )
    );

    expect(attempts.filter(quota => quota.allowed)).toHaveLength(10);
    expect(attempts.filter(quota => !quota.allowed)).toHaveLength(2);
  });

  it("tracks file upload quota separately from assistant messages", async () => {
    const store = createMemoryQuotaStore();
    const now = new Date("2026-05-30T10:00:00.000Z");

    const firstMessage = await store.reserveDailyMessage(anonymous, 2, now);
    const firstUpload = await store.reserveDailyAction(
      anonymous,
      "file_upload",
      1,
      now
    );
    const secondUpload = await store.reserveDailyAction(
      anonymous,
      "file_upload",
      1,
      now
    );
    const messageQuota = await store.getDailyMessageQuota(anonymous, 2, now);

    expect(firstMessage).toMatchObject({
      allowed: true,
      used: 1,
      remaining: 1,
    });
    expect(firstUpload).toMatchObject({ allowed: true, used: 1, remaining: 0 });
    expect(secondUpload).toMatchObject({
      allowed: false,
      used: 1,
      remaining: 0,
    });
    expect(messageQuota).toMatchObject({ used: 1, remaining: 1 });
  });
});

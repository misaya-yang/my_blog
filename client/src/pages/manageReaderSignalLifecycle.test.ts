import { describe, expect, it } from "vitest";

import {
  getReaderSignalDisplayStatus,
  isReaderSignalLocalStatus,
  readReaderSignalStatusMap,
  setReaderSignalLocalStatus,
  writeReaderSignalStatusMap,
  READER_SIGNAL_LIFECYCLE_STORAGE_KEY,
} from "./manageReaderSignalLifecycle";

function createStorage(initial?: Record<string, string>) {
  const values = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    values,
  };
}

describe("reader signal local lifecycle", () => {
  it("validates lifecycle statuses", () => {
    expect(isReaderSignalLocalStatus("triaged")).toBe(true);
    expect(isReaderSignalLocalStatus("in_revision")).toBe(true);
    expect(isReaderSignalLocalStatus("archived")).toBe(false);
  });

  it("reads only valid stored statuses", () => {
    const storage = createStorage({
      [READER_SIGNAL_LIFECYCLE_STORAGE_KEY]: JSON.stringify({
        "signal-1": "planned",
        "signal-2": "archived",
        "signal-3": "ignored",
      }),
    });

    expect(readReaderSignalStatusMap(storage)).toEqual({
      "signal-1": "planned",
      "signal-3": "ignored",
    });
  });

  it("ignores malformed and unavailable storage", () => {
    const storage = createStorage({
      [READER_SIGNAL_LIFECYCLE_STORAGE_KEY]: "not-json",
    });

    expect(readReaderSignalStatusMap(storage)).toEqual({});
    expect(readReaderSignalStatusMap(null)).toEqual({});
  });

  it("writes and applies local status without changing the signal id", () => {
    const storage = createStorage();
    const statusMap = setReaderSignalLocalStatus({}, "signal-1", "triaged");
    writeReaderSignalStatusMap(statusMap, storage);

    expect(
      JSON.parse(
        storage.values.get(READER_SIGNAL_LIFECYCLE_STORAGE_KEY) ?? "{}"
      )
    ).toEqual({ "signal-1": "triaged" });
    expect(
      getReaderSignalDisplayStatus(
        {
          id: "signal-1",
          kind: "search_miss",
          status: "new",
          severity: "medium",
        },
        statusMap
      )
    ).toBe("triaged");
  });
});

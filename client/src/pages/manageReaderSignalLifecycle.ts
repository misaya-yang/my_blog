import type { ManageReaderSignal } from "./manageReaderSignals";

export const READER_SIGNAL_LIFECYCLE_STORAGE_KEY =
  "misaya:reader-signal-lifecycle:v1";

export const READER_SIGNAL_LOCAL_STATUSES = [
  "new",
  "triaged",
  "planned",
  "in_revision",
  "resolved",
  "ignored",
] as const;

export type ReaderSignalLocalStatus =
  (typeof READER_SIGNAL_LOCAL_STATUSES)[number];

export type ReaderSignalStatusMap = Record<string, ReaderSignalLocalStatus>;

type ReaderSignalStorage = Pick<Storage, "getItem" | "setItem">;

export function isReaderSignalLocalStatus(
  value: unknown
): value is ReaderSignalLocalStatus {
  return (
    typeof value === "string" &&
    READER_SIGNAL_LOCAL_STATUSES.includes(value as ReaderSignalLocalStatus)
  );
}

export function readReaderSignalStatusMap(
  storage = getReaderSignalStorage()
): ReaderSignalStatusMap {
  if (!storage) return {};

  try {
    const rawValue = storage.getItem(READER_SIGNAL_LIFECYCLE_STORAGE_KEY);
    if (!rawValue) return {};
    return parseReaderSignalStatusMap(rawValue);
  } catch {
    return {};
  }
}

export function writeReaderSignalStatusMap(
  statusMap: ReaderSignalStatusMap,
  storage = getReaderSignalStorage()
) {
  if (!storage) return;

  try {
    storage.setItem(
      READER_SIGNAL_LIFECYCLE_STORAGE_KEY,
      JSON.stringify(statusMap)
    );
  } catch {
    // Storage can be unavailable in private or embedded browsing contexts.
  }
}

export function setReaderSignalLocalStatus(
  statusMap: ReaderSignalStatusMap,
  signalId: string,
  status: ReaderSignalLocalStatus
) {
  return {
    ...statusMap,
    [signalId]: status,
  };
}

export function getReaderSignalDisplayStatus(
  signal: ManageReaderSignal,
  statusMap: ReaderSignalStatusMap
): ReaderSignalLocalStatus {
  const localStatus = statusMap[signal.id];
  if (localStatus) return localStatus;
  return isReaderSignalLocalStatus(signal.status) ? signal.status : "new";
}

function parseReaderSignalStatusMap(rawValue: string): ReaderSignalStatusMap {
  const parsed = JSON.parse(rawValue) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  const entries = Object.entries(parsed).filter((entry): entry is [
    string,
    ReaderSignalLocalStatus,
  ] => isReaderSignalLocalStatus(entry[1]));
  return Object.fromEntries(entries);
}

function getReaderSignalStorage(): ReaderSignalStorage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage ?? null;
}

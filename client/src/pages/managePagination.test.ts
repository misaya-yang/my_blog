import { describe, expect, it } from "vitest";

import { getManagePagination } from "./managePagination";

describe("Manage pagination", () => {
  it("keeps empty lists on a stable first page", () => {
    expect(getManagePagination(0, 4, 20)).toEqual({
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
      start: 0,
      end: 0,
      hasPrevious: false,
      hasNext: false,
    });
  });

  it("keeps articles beyond the old 50-item ceiling reachable", () => {
    expect(getManagePagination(51, 3, 20)).toEqual({
      page: 3,
      pageSize: 20,
      total: 51,
      totalPages: 3,
      start: 41,
      end: 51,
      hasPrevious: true,
      hasNext: false,
    });
  });
});

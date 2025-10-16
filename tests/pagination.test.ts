import { describe, expect, it } from "bun:test";
import { cursorPaginate } from "@/lib/pagination";

describe("cursorPaginate", () => {
  it("backfills to keep page length after deletion", async () => {
    const dataset = Array.from({ length: 50 }, (_, index) => ({
      id: index + 1,
    }));
    const { items: firstPage } = await cursorPaginate({
      limit: 5,
      fetcher: async ({ limit }) => dataset.slice(0, limit),
      getCursor: (item) => String(item.id),
    });

    expect(firstPage).toHaveLength(5);

    const remaining = dataset.filter((item) => item.id !== 3);

    const { items: secondPage } = await cursorPaginate({
      cursor: String(firstPage.at(-1)?.id),
      limit: 5,
      fetcher: async ({ limit }) => remaining.slice(5, 5 + limit),
      getCursor: (item) => String(item.id),
    });

    expect(secondPage).toHaveLength(5);
  });
});

import { describe, expect, it } from "bun:test";
import { cursorPaginate } from "@/lib/pagination";

describe("cursorPaginate", () => {
  it("backfills to keep page length after deletion", async () => {
    const datasetLength = 50;
    const pageSize = 5;
    const removedItemId = 3;
    const dataset = Array.from({ length: datasetLength }, (_, index) => ({
      id: index + 1,
    }));
    const { items: firstPage } = await cursorPaginate({
      limit: pageSize,
      fetcher: async ({ limit }) => dataset.slice(0, limit),
      getCursor: (item) => String(item.id),
    });

    expect(firstPage).toHaveLength(pageSize);

    const remaining = dataset.filter((item) => item.id !== removedItemId);

    const { items: secondPage } = await cursorPaginate({
      cursor: String(firstPage.at(-1)?.id),
      limit: pageSize,
      fetcher: async ({ limit }) => remaining.slice(pageSize, pageSize + limit),
      getCursor: (item) => String(item.id),
    });

    expect(secondPage).toHaveLength(pageSize);
  });
});

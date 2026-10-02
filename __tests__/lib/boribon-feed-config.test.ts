/** @jest-environment node */
import { PrismaClient, SupplierFeed } from "@prisma/client";

import {
  BORIBON_ID,
  fetchBoribonProducts,
  getBoribonFeedUrl,
} from "@/lib/suppliers/boribon/feed";
import { syncBoribonPortfolio } from "@/lib/suppliers/boribon/sync";

describe("private Boribon feed configuration", () => {
  const fixtureUrl = "https://www.boribon.ro/feed/products/test-fixture";
  const previousUrl = process.env.BORIBON_FEED_URL;
  const previousFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    delete process.env.BORIBON_FEED_URL;
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });
  afterEach(() => {
    if (previousUrl === undefined) delete process.env.BORIBON_FEED_URL;
    else process.env.BORIBON_FEED_URL = previousUrl;
    global.fetch = previousFetch;
  });

  it("fails before fetching without a private URL", async () => {
    await expect(fetchBoribonProducts()).rejects.toThrow(
      "Missing Boribon feed URL"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("leaves stock untouched when the stored feed URL is missing", async () => {
    const transaction = jest.fn();
    const db = { $transaction: transaction } as unknown as PrismaClient;
    const feed = { supplierId: BORIBON_ID, sourceUrl: null } as SupplierFeed;
    const log = jest.spyOn(console, "error").mockImplementation();
    try {
      await expect(syncBoribonPortfolio(db, feed)).rejects.toThrow(
        "Missing Boribon feed URL"
      );
      expect(fetchMock).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
  it("uses explicit configuration ahead of the environment", async () => {
    process.env.BORIBON_FEED_URL = `${fixtureUrl}-env`;
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    await expect(fetchBoribonProducts(fixtureUrl)).rejects.toThrow(
      "Boribon feed HTTP 503"
    );
    expect(fetchMock).toHaveBeenCalledWith(
      fixtureUrl,
      expect.objectContaining({ cache: "no-store" })
    );
  });
  it("reads environment configuration at call time", () => {
    process.env.BORIBON_FEED_URL = fixtureUrl;
    expect(getBoribonFeedUrl()).toBe(fixtureUrl);
    process.env.BORIBON_FEED_URL = `${fixtureUrl}-rotated`;
    expect(getBoribonFeedUrl()).toBe(`${fixtureUrl}-rotated`);
  });
  it.each([
    "not-a-url",
    "http://www.boribon.ro/feed/products/test-fixture",
    "https://boribon.ro.attacker.example/feed/products/test-fixture",
    "https://localhost/feed/products/test-fixture",
    "https://www.boribon.ro/other/test-fixture",
    "https://user:password@www.boribon.ro/feed/products/test-fixture",
  ])("rejects invalid feed configuration without leaking it", async url => {
    await expect(fetchBoribonProducts(url)).rejects.toThrow(
      "Invalid Boribon feed URL"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("does not propagate a credential-bearing network error", async () => {
    fetchMock.mockRejectedValue(new Error(`Timeout requesting ${fixtureUrl}`));
    await expect(fetchBoribonProducts(fixtureUrl)).rejects.toThrow(
      /^Boribon feed request failed$/
    );
  });
  it("does not propagate a credential-bearing response-read error", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: jest
        .fn()
        .mockRejectedValue(new Error(`Interrupted stream from ${fixtureUrl}`)),
    });
    await expect(fetchBoribonProducts(fixtureUrl)).rejects.toThrow(
      /^Boribon feed request failed$/
    );
  });
});

/** @jest-environment node */
import { NextRequest } from "next/server";

import { GET } from "@/app/api/download/[token]/route";
import { db } from "@/lib/db";

jest.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));
jest.mock("@/lib/db", () => ({
  db: {
    digitalDownload: { findUnique: jest.fn(), update: jest.fn() },
    orderItem: { update: jest.fn() },
    $transaction: jest.fn(),
  },
}));
const request = () =>
  GET(new NextRequest("http://localhost/api/download/test"), {
    params: Promise.resolve({ token: "test" }),
  });
beforeEach(() => jest.clearAllMocks());

test.each([
  ["REFUNDED", "PAID"],
  ["NONE", "REFUNDED"],
  ["NONE", "PENDING"],
])(
  "denies supply for item %s / payment %s before consuming a token",
  async (returnStatus, paymentStatus) => {
    jest.mocked(db.digitalDownload.findUnique).mockResolvedValue({
      orderItem: { returnStatus, order: { paymentStatus } },
    } as never);
    expect((await request()).status).toBe(410);
    expect(db.$transaction).not.toHaveBeenCalled();
  }
);

test("a pending digital complaint keeps paid supply available", async () => {
  jest.mocked(db.digitalDownload.findUnique).mockResolvedValue({
    id: "download",
    orderItemId: "item",
    expiresAt: new Date(Date.now() + 60000),
    downloadedAt: null,
    orderItem: {
      returnStatus: "REQUESTED",
      order: { paymentStatus: "PAID" },
      downloadCount: 0,
      maxDownloads: 3,
    },
    digitalFile: {
      fileName: "fixture.epub",
      fileUrl: "https://example.invalid/fixture",
      format: "epub",
      fileSize: 3,
    },
  } as never);
  jest.mocked(fetch).mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
  } as Response);
  expect((await request()).status).toBe(200);
  expect(db.$transaction).toHaveBeenCalledTimes(1);
});

/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

var mockPrisma = {
  $queryRaw: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe("/api/health", () => {
  let GET: (request: NextRequest) => Promise<Response>;
  let HEAD: () => Promise<Response>;

  beforeAll(() => {
    ({ GET, HEAD } = require("@/app/api/health/route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockPrisma.$disconnect.mockResolvedValue(undefined);
  });

  it("returns healthy status when checks pass", async () => {
    const request = new NextRequest("http://localhost:3000/api/health");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.checks.database).toBe("healthy");
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
  });

  it("returns unhealthy status when database check fails", async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error("database down"));

    const request = new NextRequest("http://localhost:3000/api/health");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.database).toBe("unhealthy");
  });

  it("returns unhealthy when memory is critical", async () => {
    const originalMemoryUsage = process.memoryUsage;
    (process as any).memoryUsage = jest.fn(() => ({
      rss: 1_000_000_000,
      heapTotal: 900_000_000,
      heapUsed: 850_000_000,
      external: 10_000_000,
      arrayBuffers: 1_000_000,
    }));

    const request = new NextRequest("http://localhost:3000/api/health");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.memory).toBe("critical");

    process.memoryUsage = originalMemoryUsage;
  });

  it("HEAD returns 200 for healthy database", async () => {
    const response = await HEAD();
    expect(response.status).toBe(200);
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
  });

  it("HEAD returns 503 when database ping fails", async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error("db error"));

    const response = await HEAD();
    expect(response.status).toBe(503);
    expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
  });
});

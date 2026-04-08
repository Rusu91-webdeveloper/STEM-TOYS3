import {
  appendResolutionNote,
  buildDuplicateCleanupResolutionNote,
  getDuplicateActiveReturnLosers,
  mapKeeperToOrderItemReturnStatus,
  pickDuplicateActiveReturnKeeper,
  type DuplicateActiveReturnRecord,
} from "@/lib/returns/duplicate-active-returns";

function buildActiveReturn(
  overrides: Partial<DuplicateActiveReturnRecord>
): DuplicateActiveReturnRecord {
  return {
    id: "ret_1",
    orderItemId: "item_1",
    orderId: "order_1",
    userId: "user_1",
    status: "PENDING",
    createdAt: new Date("2026-04-01T10:00:00.000Z"),
    updatedAt: new Date("2026-04-01T10:00:00.000Z"),
    supplierAuthorizationStatus: null,
    resolutionStatus: "OPEN",
    resolutionNotes: null,
    ...overrides,
  };
}

describe("duplicate active return cleanup helpers", () => {
  it("keeps the most advanced active return before comparing timestamps", () => {
    const keeper = pickDuplicateActiveReturnKeeper([
      buildActiveReturn({
        id: "ret_pending",
        status: "PENDING",
        updatedAt: new Date("2026-04-05T10:00:00.000Z"),
      }),
      buildActiveReturn({
        id: "ret_received",
        status: "RECEIVED",
        updatedAt: new Date("2026-04-04T10:00:00.000Z"),
      }),
      buildActiveReturn({
        id: "ret_approved",
        status: "APPROVED",
        updatedAt: new Date("2026-04-06T10:00:00.000Z"),
      }),
    ]);

    expect(keeper.id).toBe("ret_received");
    expect(mapKeeperToOrderItemReturnStatus(keeper)).toBe("RECEIVED");
  });

  it("falls back to most recently updated when statuses match", () => {
    const keeper = pickDuplicateActiveReturnKeeper([
      buildActiveReturn({
        id: "ret_old",
        status: "APPROVED",
        updatedAt: new Date("2026-04-01T10:00:00.000Z"),
      }),
      buildActiveReturn({
        id: "ret_new",
        status: "APPROVED",
        updatedAt: new Date("2026-04-02T10:00:00.000Z"),
      }),
    ]);

    expect(keeper.id).toBe("ret_new");
    expect(
      getDuplicateActiveReturnLosers(
        [
          buildActiveReturn({
            id: "ret_old",
            status: "APPROVED",
            updatedAt: new Date("2026-04-01T10:00:00.000Z"),
          }),
          buildActiveReturn({
            id: "ret_new",
            status: "APPROVED",
            updatedAt: new Date("2026-04-02T10:00:00.000Z"),
          }),
        ],
        keeper.id
      ).map(item => item.id)
    ).toEqual(["ret_old"]);
  });

  it("appends an audit note without duplicating existing cleanup text", () => {
    const keeper = buildActiveReturn({
      id: "ret_keeper",
      status: "APPROVED",
    });
    const duplicate = buildActiveReturn({
      id: "ret_duplicate",
      status: "PENDING",
    });
    const cleanupNote = buildDuplicateCleanupResolutionNote({
      keeper,
      duplicate,
      executedAt: new Date("2026-04-08T09:00:00.000Z"),
    });

    const combined = appendResolutionNote("Original ops note.", cleanupNote);
    const deduped = appendResolutionNote(combined, cleanupNote);

    expect(combined).toContain("Original ops note.");
    expect(combined).toContain("ret_keeper");
    expect(deduped).toBe(combined);
  });
});

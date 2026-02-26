import {
  appendOosNoteBlock,
  buildOosOpsSnapshot,
  getLatestOosReminderByType,
  parseOosNoteEvents,
  sanitizeOosNoteValue,
} from "@/lib/utils/oos-ops";

describe("oos ops helpers", () => {
  it("parses OOS notes and sorts newest first", () => {
    const notes = [
      "[OOS_DECISION] 2026-02-20T10:00:00.000Z ; action=WAIT_RESTOCK",
      "[OOS_CUSTOMER_NOTIFIED] 2026-02-20T12:00:00.000Z ; channel=EMAIL",
      "[OOS_REMINDER_SENT] 2026-02-20T11:00:00.000Z ; type=CUSTOMER_NOT_NOTIFIED",
    ].join("\n");

    const events = parseOosNoteEvents(notes);

    expect(events).toHaveLength(3);
    expect(events[0].tag).toBe("OOS_CUSTOMER_NOTIFIED");
    expect(events[1].tag).toBe("OOS_REMINDER_SENT");
    expect(events[2].tag).toBe("OOS_DECISION");
    expect(
      getLatestOosReminderByType(events, "CUSTOMER_NOT_NOTIFIED")?.tag
    ).toBe("OOS_REMINDER_SENT");
  });

  it("detects missing customer notification after a decision", () => {
    const notes =
      "[OOS_DECISION] 2026-02-20T10:00:00.000Z ; action=OFFER_REPLACEMENT";

    const snapshot = buildOosOpsSnapshot({
      notes,
      createdAt: "2026-02-20T09:00:00.000Z",
      updatedAt: "2026-02-21T12:30:00.000Z",
      slaWarningHours: 24,
    });

    expect(snapshot.latestDecision?.tag).toBe("OOS_DECISION");
    expect(snapshot.needsCustomerNotification).toBe(true);
    expect(snapshot.isSlaOverdue).toBe(true);
    expect(snapshot.issueAgeHours).not.toBeNull();
  });

  it("clears notification warning when customer notification is newer than decision", () => {
    const notes = [
      "[OOS_DECISION] 2026-02-20T10:00:00.000Z ; action=WAIT_RESTOCK",
      "[OOS_CUSTOMER_NOTIFIED] 2026-02-20T11:00:00.000Z ; channel=EMAIL",
    ].join("\n");

    const snapshot = buildOosOpsSnapshot({
      notes,
      createdAt: "2026-02-20T09:00:00.000Z",
      updatedAt: "2026-02-20T11:30:00.000Z",
    });

    expect(snapshot.needsCustomerNotification).toBe(false);
    expect(snapshot.latestNotification?.tag).toBe("OOS_CUSTOMER_NOTIFIED");
  });

  it("sanitizes and appends note blocks safely", () => {
    expect(sanitizeOosNoteValue("line1;\nline2")).toBe("line1 | line2");
    expect(appendOosNoteBlock("a", "b")).toBe("a\n\nb");
  });
});

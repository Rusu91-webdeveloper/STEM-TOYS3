import { privacyRequestDeadline } from "@/lib/privacy/request-deadline";

test.each([
  ["2026-01-31T12:00:00Z", "2026-02-28T12:00:00.000Z"],
  ["2026-10-07T12:00:00Z", "2026-11-07T12:00:00.000Z"],
  ["2026-12-07T12:00:00Z", "2027-01-07T12:00:00.000Z"],
])("uses one calendar month from %s", (received, expected) => {
  expect(privacyRequestDeadline(received, new Date(received))).toEqual({
    responseDueAt: expected,
    overdue: false,
  });
});
test("flags an overdue response without promising data has been deleted", () => {
  expect(
    privacyRequestDeadline(
      "2026-09-07T12:00:00Z",
      new Date("2026-10-07T12:00:01Z")
    ).overdue
  ).toBe(true);
});

import { readCodHoldSettlement } from "@/lib/checkout/cod-hold-evidence";

const authorization =
  "COD Guarantee authorized at 2026-10-01T10:00:00Z - PI: pi_hold - Amount: 19.99 RON";
const note = (outcome: string, pi = "pi_hold", expiry = true) =>
  `COD Guarantee settlement - PI: ${pi} - Outcome: ${outcome} - Event: delivery - At: 2026-10-07T10:00:00Z${expiry ? " - Expires: 2026-10-06T10:00:00Z" : ""}`;
test("shows the latest settlement for the recorded authorization", () => {
  expect(
    readCodHoldSettlement(
      `${authorization} | ${note("retry_required", "pi_hold", false)} | ${note("expired")} | Other evidence`
    )
  ).toEqual({
    outcome: "expired",
    recordedAt: "2026-10-07T10:00:00Z",
    expiresAt: "2026-10-06T10:00:00Z",
  });
});
test("never applies evidence from another authorization", () => {
  expect(
    readCodHoldSettlement(`${authorization} | ${note("expired", "pi_other")}`)
  ).toBeNull();
});
test("retains a failed-release outcome even without a known expiration", () => {
  expect(
    readCodHoldSettlement(
      `${authorization} | ${note("retry_required", "pi_hold", false)}`
    )?.outcome
  ).toBe("retry_required");
});

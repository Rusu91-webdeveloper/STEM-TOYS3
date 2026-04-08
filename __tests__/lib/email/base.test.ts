/**
 * @jest-environment node
 */

import { generateUnsubscribeLink } from "@/lib/email/base";

describe("generateUnsubscribeLink", () => {
  it("builds a tokenized unsubscribe URL", () => {
    const url = new URL(generateUnsubscribeLink("parent@example.com"));

    expect(url.pathname).toBe("/unsubscribe");
    expect(url.searchParams.get("token")).toBeTruthy();
    expect(url.searchParams.get("email")).toBeNull();
  });
});

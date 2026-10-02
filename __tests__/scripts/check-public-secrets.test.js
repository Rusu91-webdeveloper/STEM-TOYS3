/** @jest-environment node */
const { violations } = require("../../scripts/check-public-secrets");

describe("public repository credential guard", () => {
  it.each([
    "cookies.txt",
    "admin-cookies.txt",
    "debug/cookies-admin.txt",
    "debug/session.cookies.txt",
  ])("rejects a cookie export: %s", file => {
    expect(violations(file, "")).toContain("browser cookie export");
  });
  it("rejects a private supplier URL without echoing its credential", () => {
    const url = `https://www.boribon.ro/feed/products/${"a".repeat(32)}`;
    expect(violations("feed.ts", url)).toEqual([
      "hardcoded private Boribon feed URL",
    ]);
  });
  it("allows documentation placeholders and runtime configuration", () => {
    expect(
      violations(
        "env.example",
        "BORIBON_FEED_URL=https://www.boribon.ro/feed/products/feed1"
      )
    ).toEqual([]);
    expect(violations("feed.ts", "process.env.BORIBON_FEED_URL")).toEqual([]);
  });
});

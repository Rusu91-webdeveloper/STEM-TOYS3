/** @jest-environment node */
const { normalizeMessage } = require("../../scripts/typecheck-diagnostics.js");

describe("TypeScript regression diagnostic normalization", () => {
  it("treats different orderings of the same literal union as identical", () => {
    expect(normalizeMessage('Type "valid" | "missing" | "error"', [])).toBe(
      normalizeMessage('Type "error" | "valid" | "missing"', [])
    );
  });

  it("preserves additions or changes to a union and the surrounding diagnostic", () => {
    const original = normalizeMessage(
      'Type "valid" | "missing" is invalid',
      []
    );
    expect(
      normalizeMessage('Type "error" | "valid" | "missing" is invalid', [])
    ).not.toBe(original);
    expect(
      normalizeMessage('Type "valid" | "missing" is missing a property', [])
    ).not.toBe(original);
  });

  it("preserves pipes within quoted literal members and normalizes project paths", () => {
    expect(
      normalizeMessage('/temporary/project: "x|y" | "z"', [
        "/temporary/project",
      ])
    ).toBe('<project>: "x|y" | "z"');
  });
});

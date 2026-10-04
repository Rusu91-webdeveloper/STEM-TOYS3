/** @jest-environment node */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { collectDiagnostics, normalizeMessage } = require("../../scripts/typecheck-diagnostics.js");

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

  it("collects the complete union rather than a truncated ordering-dependent preview", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "stem-diagnostic-union-"));
    try {
      const members = Array.from({ length: 50 }, (_, i) => `member-${i}`);
      fs.writeFileSync(path.join(root, "tsconfig.json"), JSON.stringify({
        compilerOptions: { noLib: true, types: [] }, include: ["sample.ts"],
      }));
      fs.writeFileSync(path.join(root, "sample.ts"),
        `const invalid: ${members.map(value => JSON.stringify(value)).join(" | ")} = "outside-union";`);
      const mismatch = collectDiagnostics(root).find((diagnostic: { code: number; message: string }) => diagnostic.code === 2322);
      expect(mismatch).toBeDefined();
      expect(mismatch.message).not.toContain("more ...");
      for (const member of members) expect(mismatch.message).toContain(`"${member}"`);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

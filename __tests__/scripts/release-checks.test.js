const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { databaseChanges } = require("../../scripts/migration-change-scope");
const { failures, regressions } = require("../../scripts/test-regressions");
const {
  collectDiagnostics,
  normalizeMessage,
} = require("../../scripts/typecheck-diagnostics");
const { addedDiagnostics } = require("../../scripts/typecheck-regressions");

describe("release regression comparison", () => {
  const diagnostic = {
    file: "lib/existing.ts",
    code: 2322,
    message: "Type mismatch",
  };
  const failure = {
    file: "__tests__/existing.test.ts",
    test: "existing failure",
  };

  it("reports unchanged TypeScript debt without adding errors", () => {
    expect(addedDiagnostics([diagnostic], [{ ...diagnostic }])).toEqual([]);
  });

  it("rejects a changed message even with the same file and error code", () => {
    const changed = { ...diagnostic, message: "Different mismatch" };
    expect(addedDiagnostics([diagnostic], [changed])).toEqual([changed]);
  });

  it("rejects an additional occurrence and allows removed errors", () => {
    expect(addedDiagnostics([diagnostic], [diagnostic, diagnostic])).toEqual([
      diagnostic,
    ]);
    expect(addedDiagnostics([diagnostic], [])).toEqual([]);
  });

  it("rejects errors in new files", () => {
    const added = { ...diagnostic, file: "lib/new.ts" };
    expect(addedDiagnostics([diagnostic], [diagnostic, added])).toEqual([
      added,
    ]);
  });

  it("normalizes snapshot locations while preserving the diagnostic message", () => {
    const baseline =
      'Type import("/tmp/baseline/lib/type").Role differs from import("/repo/node_modules/client").Role';
    const current =
      'Type import("/repo/lib/type").Role differs from import("/repo/node_modules/client").Role';
    expect(normalizeMessage(baseline, ["/tmp/baseline", "/repo"])).toBe(
      normalizeMessage(current, ["/repo", "/repo"])
    );
  });

  it("allows unchanged failures only in untouched test files", () => {
    expect(regressions([failure], [failure], new Set())).toEqual([]);
    expect(regressions([failure], [failure], new Set([failure.file]))).toEqual([
      failure,
    ]);
  });

  it("rejects new failed tests and extra failure occurrences", () => {
    const added = { ...failure, test: "new failure" };
    expect(regressions([failure], [added], new Set())).toEqual([added]);
    expect(regressions([failure], [failure, failure], new Set())).toEqual([
      failure,
    ]);
  });

  it("includes suite setup failures, not only failed assertions", () => {
    expect(
      failures(
        {
          testResults: [
            {
              name: "/repo/__tests__/broken.ts",
              status: "failed",
              assertionResults: [],
            },
          ],
        },
        "/repo"
      )
    ).toEqual([{ file: "__tests__/broken.ts", test: "<suite setup>" }]);
  });
});

describe("real compiler comparison", () => {
  it("blocks an added type error using actual compiler diagnostics", () => {
    const root = fs.mkdtempSync(
      path.join(os.tmpdir(), "release-compiler-test-")
    );
    try {
      fs.writeFileSync(
        path.join(root, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: { strict: true, types: [], skipLibCheck: true },
          include: ["fixture.ts"],
        })
      );
      const source = path.join(root, "fixture.ts");
      fs.writeFileSync(source, 'const value: number = "wrong";\n');
      const baseline = collectDiagnostics(root);
      expect(baseline).toHaveLength(1);
      expect(addedDiagnostics(baseline, collectDiagnostics(root))).toEqual([]);
      fs.appendFileSync(source, "const added: number = false;\n");
      expect(addedDiagnostics(baseline, collectDiagnostics(root))).toHaveLength(
        1
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("migration change scope", () => {
  let root;
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" });
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "release-check-test-"));
    git("init", "-q");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "Test");
    write("prisma/schema.prisma", "// unchanged schema\n");
    write(
      "prisma/migrations/old/migration.sql",
      'DROP INDEX "HistoricalIndex";\n'
    );
    git("add", ".");
    git("-c", "core.hooksPath=/dev/null", "commit", "-qm", "baseline");
    git("branch", "baseline");
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it("does not certify unchanged historical migrations", () => {
    write("route.ts", "// no database changes\n");
    expect(databaseChanges("baseline", root).files).toEqual([]);
    const validator = path.resolve(
      __dirname,
      "../../scripts/validate-migrations.js"
    );
    const scoped = spawnSync(
      process.execPath,
      [validator, "--base", "baseline"],
      { cwd: root, encoding: "utf8" }
    );
    expect(scoped.status).toBe(0);
    expect(scoped.stdout).toContain("have not been certified");
    const full = spawnSync(process.execPath, [validator], {
      cwd: root,
      encoding: "utf8",
    });
    expect(full.status).toBe(1);
    expect(full.stdout).toContain("DANGEROUS OPERATION");
  });

  it("detects an untracked new migration and invokes full validation", () => {
    write(
      "prisma/migrations/new/migration.sql",
      "CREATE TABLE safe (id INTEGER);\n"
    );
    expect(databaseChanges("baseline", root).files).toContain(
      "prisma/migrations/new/migration.sql"
    );
    const validator = path.resolve(
      __dirname,
      "../../scripts/validate-migrations.js"
    );
    const run = spawnSync(process.execPath, [validator, "--base", "baseline"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(run.status).toBe(1);
    expect(run.stdout).toContain(
      "Running full migration and backup validation"
    );
  });

  it("detects modified, staged, committed and deleted database files", () => {
    write("prisma/schema.prisma", "// changed\n");
    expect(databaseChanges("baseline", root).files).toContain(
      "prisma/schema.prisma"
    );
    git("add", ".");
    expect(databaseChanges("baseline", root).files).toContain(
      "prisma/schema.prisma"
    );
    git("-c", "core.hooksPath=/dev/null", "commit", "-qm", "schema change");
    expect(databaseChanges("baseline", root).files).toContain(
      "prisma/schema.prisma"
    );
    fs.unlinkSync(path.join(root, "prisma/migrations/old/migration.sql"));
    expect(databaseChanges("baseline", root).files).toContain(
      "prisma/migrations/old/migration.sql"
    );
  });

  it("fails closed when the base reference is unavailable", () => {
    expect(() => databaseChanges("missing-base", root)).toThrow();
    const validator = path.resolve(
      __dirname,
      "../../scripts/validate-migrations.js"
    );
    expect(
      spawnSync(process.execPath, [validator, "--base", "missing-base"], {
        cwd: root,
      }).status
    ).toBe(1);
    expect(
      spawnSync(process.execPath, [validator, "--base"], { cwd: root }).status
    ).toBe(1);
  });
});

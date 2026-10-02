const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

function addedDiagnostics(baseline, current) {
  const remaining = new Map();
  const key = ({ file, code, message }) =>
    JSON.stringify([file, code, message]);
  for (const diagnostic of baseline) {
    const id = key(diagnostic);
    remaining.set(id, (remaining.get(id) || 0) + 1);
  }
  return current.filter(diagnostic => {
    const id = key(diagnostic);
    const count = remaining.get(id) || 0;
    if (!count) return true;
    remaining.set(id, count - 1);
    return false;
  });
}

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
}

function diagnostics(root, sharedRoot) {
  const output = execFileSync(
    process.execPath,
    [
      "--max-old-space-size=4096",
      path.join(__dirname, "typecheck-diagnostics.js"),
      root,
      sharedRoot,
    ],
    {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "inherit"],
    }
  );
  return JSON.parse(output);
}

function main(baseRef = "origin/main") {
  const root = git(process.cwd(), ["rev-parse", "--show-toplevel"]).trim();
  const base = git(root, ["merge-base", baseRef, "HEAD"]).trim();
  // The shared installed dependency/client tree must represent BOTH snapshots.
  const changed = git(root, [
    "diff",
    "--name-only",
    base,
    "--",
    "package.json",
    "pnpm-lock.yaml",
    "prisma/schema.prisma",
    "tsconfig*.json",
  ]);
  if (changed.trim()) {
    console.log(
      `Dependency, schema or compiler configuration changed (${changed.trim()}). Requiring a clean full typecheck.`
    );
    const current = diagnostics(root, root);
    for (const diagnostic of current)
      console.error(
        `${diagnostic.file} TS${diagnostic.code}: ${diagnostic.message}`
      );
    return current.length ? 1 : 0;
  }
  if (!fs.existsSync(path.join(root, "node_modules")))
    throw new Error("Install locked dependencies first.");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "stem-typecheck-"));
  try {
    const archive = path.join(temp, "baseline.tar");
    const baselineRoot = path.join(temp, "baseline");
    fs.mkdirSync(baselineRoot);
    execFileSync(
      "git",
      ["archive", "--format=tar", `--output=${archive}`, base],
      { cwd: root }
    );
    execFileSync("tar", ["-xf", archive, "-C", baselineRoot]);
    fs.symlinkSync(
      path.join(root, "node_modules"),
      path.join(baselineRoot, "node_modules"),
      "dir"
    );
    // Next generates these locally; use identical generated declarations in both runs.
    for (const generated of ["next-env.d.ts", ".next/types"]) {
      if (fs.existsSync(path.join(root, generated))) {
        fs.cpSync(
          path.join(root, generated),
          path.join(baselineRoot, generated),
          { recursive: true }
        );
      }
    }
    console.log(
      `Comparing TypeScript against ${base} (${baseRef} merge base).`
    );
    const baseline = diagnostics(baselineRoot, root);
    const current = diagnostics(root, root);
    const added = addedDiagnostics(baseline, current);
    console.log(
      `Baseline: ${baseline.length} errors; current: ${current.length}; added: ${added.length}.`
    );
    for (const diagnostic of added)
      console.error(
        `${diagnostic.file} TS${diagnostic.code}: ${diagnostic.message}`
      );
    if (added.length) return 1;
    if (current.length)
      console.warn(
        "Existing TypeScript debt remains; this is a regression check, not a clean full typecheck."
      );
    return 0;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    if (process.argv.length > 3)
      throw new Error(
        "Usage: node scripts/typecheck-regressions.js [base-ref]"
      );
    process.exitCode = main(process.argv[2]);
  } catch (error) {
    console.error(`TypeScript regression check failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { addedDiagnostics };

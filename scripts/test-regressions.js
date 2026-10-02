const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

function failures(result, root) {
  const failed = [];
  for (const suite of result.testResults) {
    const file = path.relative(root, suite.name);
    let assertionFailures = 0;
    for (const assertion of suite.assertionResults) {
      if (assertion.status === "failed") {
        failed.push({ file, test: assertion.fullName });
        assertionFailures++;
      }
    }
    if (suite.status === "failed" && !assertionFailures)
      failed.push({ file, test: "<suite setup>" });
  }
  return failed;
}

function regressions(baseline, current, changedFiles) {
  const known = new Map();
  const key = ({ file, test }) => JSON.stringify([file, test]);
  for (const failure of baseline)
    known.set(key(failure), (known.get(key(failure)) || 0) + 1);
  return current.filter(failure => {
    if (changedFiles.has(failure.file)) return true;
    const id = key(failure);
    const count = known.get(id) || 0;
    if (!count) return true;
    known.set(id, count - 1);
    return false;
  });
}

function runTests(root, output) {
  const run = spawnSync(
    "pnpm",
    [
      "exec",
      "jest",
      "--runInBand",
      "--silent",
      "--forceExit",
      "--json",
      `--outputFile=${output}`,
    ],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    }
  );
  if (
    run.error ||
    run.signal ||
    ![0, 1].includes(run.status) ||
    !fs.existsSync(output)
  ) {
    throw new Error(
      `Jest did not complete (${run.error?.message || run.signal || run.status}). ${run.stderr || ""}`
    );
  }
  const result = JSON.parse(fs.readFileSync(output, "utf8"));
  if (!result.numTotalTestSuites || result.wasInterrupted)
    throw new Error("Jest returned an empty or interrupted run.");
  return { result, failed: failures(result, fs.realpathSync(root)) };
}

function main(baseRef = "origin/main") {
  const git = args =>
    execFileSync("git", args, {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
  const root = git(["rev-parse", "--show-toplevel"]).trim();
  process.chdir(root);
  const base = git(["merge-base", baseRef, "HEAD"]).trim();
  const requiresCleanRun = Boolean(
    git([
      "diff",
      "--name-only",
      base,
      "--",
      "package.json",
      "pnpm-lock.yaml",
      "prisma/schema.prisma",
    ]).trim()
  );
  const changed = new Set(
    [
      ...git(["diff", "--name-only", "-z", base]).split("\0"),
      ...git(["ls-files", "--others", "--exclude-standard", "-z"]).split("\0"),
    ].filter(Boolean)
  );
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "stem-tests-"));
  try {
    if (requiresCleanRun) {
      console.log(
        "Dependencies or schema changed; requiring a clean full Jest run."
      );
      const current = runTests(root, path.join(temp, "current.json"));
      return current.result.success && current.failed.length === 0 ? 0 : 1;
    }
    const baselineRoot = path.join(temp, "baseline");
    const archive = path.join(temp, "baseline.tar");
    fs.mkdirSync(baselineRoot);
    execFileSync("git", [
      "archive",
      "--format=tar",
      `--output=${archive}`,
      base,
    ]);
    execFileSync("tar", ["-xf", archive, "-C", baselineRoot]);
    fs.symlinkSync(
      path.join(root, "node_modules"),
      path.join(baselineRoot, "node_modules"),
      "dir"
    );
    console.log(`Comparing Jest against ${base} (${baseRef} merge base).`);
    const baseline = runTests(baselineRoot, path.join(temp, "baseline.json"));
    console.log(
      `Baseline: ${baseline.result.numFailedTestSuites} failed suites, ${baseline.result.numFailedTests} failed tests.`
    );
    const current = runTests(root, path.join(temp, "current.json"));
    const added = regressions(baseline.failed, current.failed, changed);
    console.log(
      `Current: ${current.result.numFailedTestSuites} failed suites, ${current.result.numFailedTests} failed tests; regressions: ${added.length}.`
    );
    for (const failure of added)
      console.error(`${failure.file}: ${failure.test}`);
    if (added.length) return 1;
    if (current.failed.length)
      console.warn(
        "Existing test failures remain; this is a regression check, not a clean full suite."
      );
    return 0;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    if (process.argv.length > 3)
      throw new Error("Usage: node scripts/test-regressions.js [base-ref]");
    process.exitCode = main(process.argv[2]);
  } catch (error) {
    console.error(`Test regression check failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { failures, regressions };

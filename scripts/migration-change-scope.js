const { execFileSync } = require("node:child_process");

function databaseChanges(baseRef, root = process.cwd()) {
  const git = args =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" });
  const base = git(["merge-base", baseRef, "HEAD"]).trim();
  const tracked = git([
    "diff",
    "--name-only",
    "-z",
    base,
    "--",
    "prisma/schema.prisma",
    "prisma/migrations/",
  ]);
  const untracked = git([
    "ls-files",
    "--others",
    "--exclude-standard",
    "-z",
    "--",
    "prisma/schema.prisma",
    "prisma/migrations/",
  ]);
  return {
    base,
    files: [
      ...new Set(
        [...tracked.split("\0"), ...untracked.split("\0")].filter(Boolean)
      ),
    ],
  };
}

module.exports = { databaseChanges };

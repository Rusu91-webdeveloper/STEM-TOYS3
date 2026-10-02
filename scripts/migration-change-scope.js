const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function databaseChanges(
  baseRef,
  root = process.cwd(),
  environment = process.env
) {
  const git = args =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      env: environment,
    });
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
  const files = [
    ...new Set(
      [...tracked.split("\0"), ...untracked.split("\0")].filter(Boolean)
    ),
  ];
  const historical = new Set(
    git([
      "ls-tree",
      "-r",
      "--name-only",
      "-z",
      base,
      "--",
      "prisma/migrations/",
    ]).split("\0")
  );
  return {
    base,
    files,
    modifiedHistory: files.filter(file => historical.has(file)),
    deletedSchema:
      files.includes("prisma/schema.prisma") &&
      !fs.existsSync(path.join(root, "prisma/schema.prisma")),
  };
}

module.exports = { databaseChanges };

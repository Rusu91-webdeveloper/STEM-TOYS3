const { execFileSync } = require("node:child_process");

function violations(file, contents) {
  const findings = [];
  if (/(^|\/)(cookies(?:[-.][^/]*)?\.txt|[^/]*[-.]cookies\.txt)$/i.test(file)) {
    findings.push("browser cookie export");
  }
  if (
    /https?:\/\/(?:www\.)?boribon\.ro\/feed\/products\/[a-f0-9]{32,}/i.test(
      contents
    )
  ) {
    findings.push("hardcoded private Boribon feed URL");
  }
  return findings;
}

function main() {
  const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  let failed = false;
  for (const file of files) {
    for (const finding of violations(file, "")) {
      console.error(
        `${file}: ${finding}. Remove it from the commit; use private configuration.`
      );
      failed = true;
    }
  }
  try {
    const matches = execFileSync(
      "git",
      [
        "grep",
        "--cached",
        "--name-only",
        "-I",
        "-z",
        "-i",
        "-E",
        "https?://(www\\.)?boribon\\.ro/feed/products/[a-f0-9]{32,}",
      ],
      { encoding: "utf8" }
    );
    for (const file of matches.split("\0").filter(Boolean)) {
      console.error(
        `${file}: hardcoded private Boribon feed URL. Use private configuration.`
      );
      failed = true;
    }
  } catch (error) {
    if (error.status !== 1) throw error;
  }
  if (!failed)
    console.log(
      "No cookie exports or hardcoded private Boribon feed URLs in the index."
    );
  return failed ? 1 : 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { violations };

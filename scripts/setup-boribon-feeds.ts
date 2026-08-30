console.error(
  "This command has been replaced by `pnpm supplier:feeds:repair`. " +
    "Run it without --apply for a dry-run; applying requires a protected backup path."
);
process.exitCode = 1;

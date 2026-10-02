# Release checks while existing failures are repaired

The full checks remain available: `pnpm run typecheck`, `pnpm test` and
`pnpm run validate:migrations`. They currently fail on unchanged main. These
failures must be repaired separately rather than hidden or rewritten into
historical database migrations.

Git hooks compare the candidate against the merge base of `origin/main` and
HEAD. Fetch origin before publishing. A missing base, incomplete process or
comparison failure blocks the operation. No production credentials are required.
Hooks also reject unstaged or untracked files so local edits cannot conceal
failures in the commit being checked. Preserve such work before publishing.

- Pre-commit runs both complete Jest snapshots, sequentially. It blocks new
  failed tests/suite setup failures and **any** failure in a changed test file,
  including a failure that already existed in that file. Existing failures in
  untouched files are reported. This compares failed test identities and
  occurrence counts; it does not certify the existing failing assertions.
- Pre-push checks whether the schema or migration directory differs from the
  base, including untracked files. No database changes means no database release
  checks apply. Any database change invokes the unchanged full migration and
  recent-backup checks. This mode does not certify historical migrations or
  approve a deployment. Manual database SQL/production edits still require the
  existing database safety protocol.
- Pre-push compiles the base and candidate in separate processes using the same
  installed dependencies and generated Next declarations. It blocks added
  diagnostic occurrences, comparing file, error code and complete message.
  Snapshot root paths are normalized; line offsets are not compared. It reports
  baseline debt explicitly. Dependency, schema or compiler-configuration changes
  require a full clean check instead of this comparison.

Standalone commands:

```sh
node scripts/test-regressions.js origin/main
node scripts/typecheck-regressions.js origin/main
pnpm run validate:migrations --base origin/main
```

Archives are created in private temporary directories, share the installed
dependency tree, and are removed in `finally` blocks. These scripts do not run
builds, migrations, seeds or database backups. The build script does run
migrations, so use the existing database release protocol before invoking it.

Repository-wide CI checks remain unchanged and may still fail on the existing
debt. A passing comparison is evidence of no new reported failures, not a claim
that the repository-wide checks are green. A draft PR still needs review and
deployed authentication verification before production closure.

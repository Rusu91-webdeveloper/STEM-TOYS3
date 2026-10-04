// Run in a separate process so two complete TypeScript programs never share a heap.
const path = require("node:path");
const fs = require("node:fs");
const ts = require("typescript");

function normalizeMessage(message, roots) {
  const normalized = roots.reduce(
    (text, root) => text.split(root).join("<project>"),
    message
  );
  // TypeScript can reorder identical literal unions when new files are added.
  // Compare the same members canonically, while preserving real type changes.
  return normalized.replace(
    /"(?:[^"\\]|\\.)*"(?:\s*\|\s*"(?:[^"\\]|\\.)*")+/g,
    union => union.match(/"(?:[^"\\]|\\.)*"/g).sort().join(" | ")
  );
}

function collectDiagnostics(root, sharedRoot = root) {
  const canonicalRoot = fs.realpathSync(root);
  const roots = [
    ...new Set([root, canonicalRoot, sharedRoot, fs.realpathSync(sharedRoot)]),
  ];
  const configPath = path.join(root, "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error)
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, "\n")
    );
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const program = ts.createProgram(parsed.fileNames, {
    ...parsed.options,
    incremental: false,
    noEmit: true,
  });
  return [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
    .filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)
    .map(diagnostic => ({
      file: diagnostic.file
        ? path.relative(
            canonicalRoot,
            fs.realpathSync(diagnostic.file.fileName)
          )
        : "<configuration>",
      code: diagnostic.code,
      message: normalizeMessage(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        roots
      ),
    }));
}

if (require.main === module) {
  try {
    process.stdout.write(
      JSON.stringify(
        collectDiagnostics(path.resolve(process.argv[2]), process.argv[3])
      )
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { collectDiagnostics, normalizeMessage };

/** Retry a transient first-party chunk failure before React caches a rejected
 * module promise. Kept in the client runtime so it also works before hydration. */
const runtimeSource = `
var techtotsEnsureChunk = __webpack_require__.e;
var techtotsLoadScript = __webpack_require__.l;
var techtotsPendingChunks = Object.create(null);
var techtotsRetryingChunks = Object.create(null);
function techtotsChunkAsset(url) {
  try {
    var asset = new URL(url, window.location.href);
    if (asset.origin === window.location.origin &&
      asset.pathname.indexOf("/_next/static/chunks/") === 0 &&
      /\\.js$/.test(asset.pathname)) return asset;
  } catch (_) {}
}
function techtotsFailedInitialScript(url) {
  var asset = techtotsChunkAsset(url);
  if (!asset || typeof document === "undefined" || !window.performance ||
    !window.performance.getEntriesByName) return;
  var entries = window.performance.getEntriesByName(asset.href, "resource");
  var entry = entries[entries.length - 1];
  // A completed, empty same-origin failure can precede Webpack's onerror.
  // Cached successes, preload links and browsers without responseStatus are excluded.
  if (!entry || entry.initiatorType !== "script" || !(entry.responseStatus >= 400 ||
    (entry.responseStatus === 0 && entry.encodedBodySize === 0 && entry.decodedBodySize === 0))) return;
  var scripts = document.getElementsByTagName("script");
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src === asset.href) return scripts[i];
  }
}
__webpack_require__.l = function(url, done, key, chunkId) {
  if (techtotsRetryingChunks[chunkId]) {
    var asset = new URL(url, window.location.href);
    asset.searchParams.set("_chunk_retry", techtotsRetryingChunks[chunkId]);
    url = asset.href;
  } else {
    var failedScript = techtotsFailedInitialScript(url);
    if (failedScript) {
      if (failedScript.parentNode) failedScript.parentNode.removeChild(failedScript);
      done({ type: "error", target: { src: url } });
      return;
    }
  }
  return techtotsLoadScript(url, done, key, chunkId);
};
__webpack_require__.e = function(chunkId) {
  if (techtotsPendingChunks[chunkId]) return techtotsPendingChunks[chunkId];
  var pending = techtotsEnsureChunk(chunkId).catch(function(error) {
    var retryable = false;
    try {
      retryable = error.name === "ChunkLoadError" && !!techtotsChunkAsset(error.request);
    } catch (_) {}
    if (!retryable) throw error;
    return new Promise(function(resolve) { setTimeout(resolve, 250); })
      .then(function() {
        techtotsRetryingChunks[chunkId] = String(Date.now());
        try { return techtotsEnsureChunk(chunkId); }
        finally { delete techtotsRetryingChunks[chunkId]; }
      })
      .catch(function(retryError) {
        if (retryError && typeof retryError === "object" && Object.isExtensible(retryError)) {
          retryError.chunkRetryCount = 1;
        }
        throw retryError;
      });
  });
  techtotsPendingChunks[chunkId] = pending;
  pending.then(function() { delete techtotsPendingChunks[chunkId]; },
    function() { delete techtotsPendingChunks[chunkId]; });
  return pending;
};
`;

class ChunkRetryPlugin {
  apply(compiler) {
    const { RuntimeModule, RuntimeGlobals } = compiler.webpack;
    class ChunkRetryRuntime extends RuntimeModule {
      constructor() {
        super("techtots/chunk retry", RuntimeModule.STAGE_TRIGGER);
      }
      generate() {
        return runtimeSource;
      }
    }
    compiler.hooks.thisCompilation.tap("TechTotsChunkRetry", compilation => {
      compilation.hooks.runtimeRequirementInTree
        .for(RuntimeGlobals.ensureChunk)
        .tap("TechTotsChunkRetry", (chunk, requirements) => {
          requirements.add(RuntimeGlobals.loadScript);
          compilation.addRuntimeModule(chunk, new ChunkRetryRuntime());
        });
    });
  }
}

module.exports = { ChunkRetryPlugin, runtimeSource };

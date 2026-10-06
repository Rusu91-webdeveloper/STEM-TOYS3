import vm from "node:vm";

const { runtimeSource } = require("../../lib/recovery/chunk-retry-plugin.cjs");

function chunkError(
  request = "https://shop.test/_next/static/chunks/42.js?dpl=release"
) {
  return Object.assign(new Error("Loading chunk 42 failed."), {
    name: "ChunkLoadError",
    request,
  });
}

function install(
  ensure: jest.Mock,
  loadScript = jest.fn(),
  extras: Record<string, unknown> = {}
) {
  const loader = { e: ensure, l: loadScript };
  vm.runInNewContext(runtimeSource, {
    __webpack_require__: loader,
    window: {
      location: {
        href: "https://shop.test/checkout",
        origin: "https://shop.test",
      },
    },
    URL,
    setTimeout: (callback: () => void) => callback(),
    ...extras,
  });
  return loader;
}

it("recovers one aborted first-party chunk before its promise rejects", async () => {
  const ensure = jest
    .fn()
    .mockRejectedValueOnce(chunkError())
    .mockResolvedValue(undefined);
  await expect(install(ensure).e(42)).resolves.toBeUndefined();
  expect(ensure).toHaveBeenCalledTimes(2);
});

function initialScriptEnvironment(entry: Record<string, unknown>) {
  const script = {
    src: "https://shop.test/_next/static/chunks/42.js?dpl=release",
    parentNode: { removeChild: jest.fn() },
  };
  return {
    script,
    extras: {
      window: {
        location: {
          href: "https://shop.test/checkout",
          origin: "https://shop.test",
        },
        performance: { getEntriesByName: () => [entry] },
      },
      document: { getElementsByTagName: () => [script] },
    },
  };
}

it.each([0, 404])(
  "recovers an initial script failure before Webpack attaches onerror (%s)",
  async status => {
    const { script, extras } = initialScriptEnvironment({
      initiatorType: "script",
      responseStatus: status,
      encodedBodySize: 0,
      decodedBodySize: 0,
    });
    const loadScript = jest.fn((_url, done) => done({ type: "load" }));
    const ensure = jest.fn();
    const loader = install(ensure, loadScript, extras);
    ensure.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          loader.l(
            script.src,
            (event: { type: string }) =>
              event.type === "error"
                ? reject(chunkError())
                : resolve(undefined),
            "chunk-42",
            42
          );
        })
    );
    await loader.e(42);
    expect(ensure).toHaveBeenCalledTimes(2);
    expect(script.parentNode.removeChild).toHaveBeenCalledWith(script);
    expect(loadScript).toHaveBeenCalledTimes(1);
    expect(
      new URL(loadScript.mock.calls[0][0]).searchParams.has("_chunk_retry")
    ).toBe(true);
  }
);

it.each([
  {
    initiatorType: "script",
    responseStatus: 200,
    encodedBodySize: 100,
    decodedBodySize: 100,
  },
  {
    initiatorType: "script",
    responseStatus: 304,
    encodedBodySize: 0,
    decodedBodySize: 0,
  },
  {
    initiatorType: "link",
    responseStatus: 0,
    encodedBodySize: 0,
    decodedBodySize: 0,
  },
  { initiatorType: "script", encodedBodySize: 0, decodedBodySize: 0 },
])(
  "does not discard successful scripts, failed preloads or unknown timing data",
  entry => {
    const { script, extras } = initialScriptEnvironment(entry);
    const loadScript = jest.fn();
    install(jest.fn(), loadScript, extras).l(
      script.src,
      jest.fn(),
      "chunk-42",
      42
    );
    expect(loadScript).toHaveBeenCalledTimes(1);
    expect(script.parentNode.removeChild).not.toHaveBeenCalled();
  }
);

it("shares a retry between concurrent imports of the same chunk", async () => {
  const ensure = jest
    .fn()
    .mockRejectedValueOnce(chunkError())
    .mockResolvedValue(undefined);
  const loader = install(ensure);
  const first = loader.e(42);
  expect(loader.e(42)).toBe(first);
  await first;
  expect(ensure).toHaveBeenCalledTimes(2);
});

it("stops after one retry and preserves the final error for the existing boundary", async () => {
  const error = chunkError();
  const ensure = jest.fn().mockRejectedValue(error);
  const loader = install(ensure);
  await expect(loader.e(42)).rejects.toBe(error);
  expect(ensure).toHaveBeenCalledTimes(2);
  expect(error).toHaveProperty("chunkRetryCount", 1);
});

it.each([
  new Error("Application code failed"),
  chunkError("https://other.test/_next/static/chunks/42.js"),
  chunkError("https://shop.test/_next/static/css/42.css"),
  chunkError("https://shop.test/api/checkout"),
  null,
])(
  "does not retry application errors, external assets or non-chunk requests",
  async error => {
    const ensure = jest.fn().mockRejectedValue(error);
    await expect(install(ensure).e(42)).rejects.toBe(error);
    expect(ensure).toHaveBeenCalledTimes(1);
  }
);

it("leaves successful loads unchanged and permits a later manual attempt", async () => {
  const ensure = jest.fn().mockResolvedValue(undefined);
  const loader = install(ensure);
  await loader.e(42);
  await loader.e(42);
  expect(ensure).toHaveBeenCalledTimes(2);
});

it("preserves non-extensible failure objects", async () => {
  const error = Object.freeze(chunkError());
  const ensure = jest.fn().mockRejectedValue(error);
  await expect(install(ensure).e(42)).rejects.toBe(error);
  expect(ensure).toHaveBeenCalledTimes(2);
});

it("uses a fresh retry URL while preserving the deployment identifier", async () => {
  const url = "https://shop.test/_next/static/chunks/42.js?dpl=release";
  const loadScript = jest.fn();
  const ensure = jest.fn();
  const loader = install(ensure, loadScript);
  ensure
    .mockImplementationOnce(() => {
      loader.l(url, undefined, "chunk-42", 42);
      return Promise.reject(chunkError(url));
    })
    .mockImplementationOnce(() => {
      loader.l(url, undefined, "chunk-42", 42);
      return Promise.resolve();
    });
  await loader.e(42);
  expect(loadScript.mock.calls[0][0]).toBe(url);
  const retryUrl = new URL(loadScript.mock.calls[1][0]);
  expect(retryUrl.origin).toBe("https://shop.test");
  expect(retryUrl.pathname).toBe("/_next/static/chunks/42.js");
  expect(retryUrl.searchParams.get("dpl")).toBe("release");
  expect(retryUrl.searchParams.has("_chunk_retry")).toBe(true);
  loader.l(url, undefined, "chunk-42", 42);
  expect(loadScript.mock.calls[2][0]).toBe(url);
});

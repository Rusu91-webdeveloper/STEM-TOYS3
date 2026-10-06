import {
  installChunkRecoveryGuard,
  isChunkLoadError,
  recoverChunkLoad,
} from "@/lib/recovery/chunk-recovery";

const chunk = Object.assign(new Error("Loading chunk 42 failed."), {
  name: "ChunkLoadError",
});
let cleanup: () => void;
beforeEach(() => {
  window.history.replaceState({}, "", "/products/test");
  window.sessionStorage.clear();
  document.body.innerHTML = "";
  cleanup = installChunkRecoveryGuard();
});
afterEach(() => cleanup());

it("refreshes a browsing page once and prevents a persistent failure loop", () => {
  const reload = jest.fn();
  expect(recoverChunkLoad(chunk, reload)).toBe(true);
  expect(recoverChunkLoad(chunk, reload)).toBe(false);
  expect(reload).toHaveBeenCalledTimes(1);
});

it.each(["/checkout", "/cart", "/account", "/auth/login", "/admin"])(
  "keeps %s intact",
  path => {
    window.history.replaceState({}, "", path);
    const reload = jest.fn();
    expect(recoverChunkLoad(chunk, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  }
);

it("preserves entered data even after the error boundary removes the form", () => {
  document.body.innerHTML = "<textarea></textarea>";
  const field = document.querySelector("textarea")!;
  field.value = "Recenzia mea";
  field.dispatchEvent(new Event("input", { bubbles: true }));
  cleanup();
  document.body.innerHTML = "";
  const reload = jest.fn();
  expect(recoverChunkLoad(chunk, reload)).toBe(false);
  expect(reload).not.toHaveBeenCalled();
});

it("detects autofilled fields and fails safely when session storage is unavailable", () => {
  document.body.innerHTML = '<input value="">';
  document.querySelector("input")!.value = "client@example.com";
  expect(recoverChunkLoad(chunk, jest.fn())).toBe(false);
  document.body.innerHTML = "";
  const spy = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("blocked");
    });
  const reload = jest.fn();
  expect(recoverChunkLoad(chunk, reload)).toBe(false);
  expect(reload).not.toHaveBeenCalled();
  spy.mockRestore();
});

it("does not refresh ordinary application errors", () => {
  expect(isChunkLoadError(new Error("Database unavailable"))).toBe(false);
  expect(
    isChunkLoadError(new Error("Failed to fetch dynamically imported module"))
  ).toBe(true);
  expect(recoverChunkLoad(new Error("Database unavailable"), jest.fn())).toBe(
    false
  );
});

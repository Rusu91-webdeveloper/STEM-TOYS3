const RECOVERY_KEY = "techtots:chunk-recovery";
const RECOVERY_WINDOW_MS = 5 * 60_000;
let editedFieldSeen = false;

export function installChunkRecoveryGuard(): () => void {
  editedFieldSeen = false;
  const rememberEdit = (event: Event) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    )
      editedFieldSeen = true;
  };
  document.addEventListener("input", rememberEdit, true);
  document.addEventListener("change", rememberEdit, true);
  return () => {
    document.removeEventListener("input", rememberEdit, true);
    document.removeEventListener("change", rememberEdit, true);
  };
}

export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { name, message } = error as { name?: string; message?: string };
  return (
    name === "ChunkLoadError" ||
    (typeof message === "string" &&
      /Loading (?:CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
        message
      ))
  );
}

/** One document refresh can recover stale deployment assets; never loop or
 * discard a customer's checkout, account form or entered product review. */
export function recoverChunkLoad(
  error: unknown,
  reload: () => void = () => window.location.reload()
): boolean {
  if (typeof window === "undefined" || !isChunkLoadError(error)) return false;
  if (editedFieldSeen) return false;
  const path = window.location.pathname;
  if (
    !(
      path === "/" ||
      path === "/products" ||
      path.startsWith("/products/") ||
      path.startsWith("/categories/")
    )
  )
    return false;

  const editedField = Array.from(
    document.querySelectorAll("input, textarea, select")
  ).some(field => {
    if (field instanceof HTMLInputElement) {
      if (["hidden", "button", "submit"].includes(field.type)) return false;
      if (["checkbox", "radio"].includes(field.type))
        return field.checked !== field.defaultChecked;
      return field.value !== field.defaultValue;
    }
    if (field instanceof HTMLTextAreaElement)
      return field.value !== field.defaultValue;
    return (
      field instanceof HTMLSelectElement &&
      Array.from(field.options).some(
        option => option.selected !== option.defaultSelected
      )
    );
  });
  if (editedField) return false;

  try {
    const previous = Number(window.sessionStorage.getItem(RECOVERY_KEY));
    if (previous > 0 && Date.now() - previous < RECOVERY_WINDOW_MS)
      return false;
    window.sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
    reload();
    return true;
  } catch {
    // If storage is unavailable, a reload cannot be safely bounded.
    return false;
  }
}

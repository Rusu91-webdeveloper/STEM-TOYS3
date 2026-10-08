"use client";

import { useEffect, useState } from "react";

export function useSettingsEditor<T>(
  initial: T,
  onDirty: (dirty: boolean) => void
) {
  const [draft, setDraft] = useState(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useEffect(() => {
    onDirty(dirty);
    return () => onDirty(false);
  }, [dirty, onDirty]);
  return { draft, setDraft, dirty };
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { installChunkRecoveryGuard } from "@/lib/recovery/chunk-recovery";

export default function ChunkRecoveryGuard() {
  const pathname = usePathname();
  useEffect(installChunkRecoveryGuard, [pathname]);
  return null;
}

import type { ReactNode } from "react";

import { metadata as aboutMetadata } from "./metadata";

export const metadata = aboutMetadata;

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}

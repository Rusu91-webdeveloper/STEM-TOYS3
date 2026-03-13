import type { ReactNode } from "react";

import { metadata as blogMetadata } from "./metadata";

export const metadata = blogMetadata;

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}

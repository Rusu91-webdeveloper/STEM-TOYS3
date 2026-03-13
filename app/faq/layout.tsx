import type { ReactNode } from "react";

import { metadata as faqMetadata } from "./metadata";

export const metadata = faqMetadata;

export default function FAQLayout({ children }: { children: ReactNode }) {
  return children;
}

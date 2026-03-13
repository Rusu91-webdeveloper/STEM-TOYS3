import type { ReactNode } from "react";

import { metadata as contactMetadata } from "./metadata";

export const metadata = contactMetadata;

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}

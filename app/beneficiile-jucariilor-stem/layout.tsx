import type { ReactNode } from "react";

import { metadata as benefitsMetadata } from "./metadata";

export const metadata = benefitsMetadata;

export default function StemBenefitsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}

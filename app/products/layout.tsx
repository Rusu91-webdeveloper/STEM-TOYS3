import React from "react";

import { metadata as productsMetadata } from "./metadata";

export const metadata = productsMetadata;

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Main content */}
      <main>{children}</main>
    </>
  );
}

import React from "react";

export const metadata = {
  title: "Products | NextCommerce",
  description: "Browse our collection of educational STEM toys for children",
};

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

import React from "react";

// No static metadata - product pages set their own via generateMetadata
// The generic "Jucarii STEM..." metadata was causing soft-404 pages to show
// homepage title instead of proper 404 page

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

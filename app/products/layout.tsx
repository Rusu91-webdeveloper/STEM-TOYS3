import React from "react";
import { getTranslations } from "@/lib/i18n/server";

export const metadata = {
  title: "Products | NextCommerce",
  description: "Browse our collection of educational STEM toys for children",
};

export default async function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations();

  return (
    <>
      {/* Page header banner */}
      <div className="bg-slate-100 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">{t("stemToysTitle")}</h1>
          <p className="mt-2 text-slate-600 max-w-3xl">
            {t("stemToysDescription")}
          </p>
        </div>
      </div>

      {/* Main content */}
      <main>{children}</main>
    </>
  );
}

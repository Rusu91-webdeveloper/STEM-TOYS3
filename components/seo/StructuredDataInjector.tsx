import { headers } from "next/headers";

import { getStructuredDataForPath } from "@/lib/structured-data-registry";

import SeoJsonLd from "./SeoJsonLd";

type StructuredDataInjectorProps = {
  path?: string;
  dataOverride?: Record<string, any> | Record<string, any>[] | null;
};

export default async function StructuredDataInjector({
  path,
  dataOverride,
}: StructuredDataInjectorProps) {
  const headerList = await headers();
  const resolvedPath =
    path ??
    headerList.get("x-current-path") ??
    headerList.get("x-matched-path") ??
    headerList.get("x-original-path") ??
    headerList.get("x-pathname") ??
    headerList.get("x-rsc-path") ??
    headerList.get("next-url") ??
    headerList.get("x-url") ??
    headerList.get("referer") ??
    "/";

  const data =
    dataOverride ??
    (resolvedPath ? getStructuredDataForPath(resolvedPath) : null);

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return null;
  }

  return <SeoJsonLd data={data} />;
}

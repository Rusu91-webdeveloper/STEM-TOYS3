import manifest from "./catalog-images.json";

/** New supplier photos keep their source until the next deliberate photo refresh. */
export function storefrontImage(source: string): string {
  return (manifest as Record<string, string>)[source] ?? source;
}

/** Exact-model videos linked by Gigo's official product pages, reviewed 7 Oct 2026.
 * Links load only when a shopper chooses to open them; no third-party embed. */
const DEMONSTRATIONS: Record<
  string,
  { url: string; source: string; title: string }
> = {
  "kit-stem-manusa-robotica-genius-toy-g_7080": {
    url: "https://www.youtube.com/watch?v=mS1YsJDfLJI",
    source: "https://www.gigotoys.com/en/products/7080/",
    title: "Gigo Ultra Bionic Blaster #7080 Product",
  },
  "kit-stem-energia-eoliana-cu-turbina-si-masinuta-electrica-genius-toy-g_7087":
    {
      url: "https://www.youtube.com/watch?v=wlIMHqDIhLM",
      source: "https://www.gigotoys.com/en/products/7087/",
      title: "Gigo #7087 Wind Power 5.0 Product",
    },
};

export function getProductDemonstration(slug: string) {
  return DEMONSTRATIONS[slug.toLowerCase()] ?? null;
}

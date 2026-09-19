/**
 * Soft-404 product slugs (verified live - return "Product Not Found | TechTots")
 * These products don't exist or can't be rendered - exclude from all sitemaps
 * 
 * IMPORTANT: All slugs MUST be lowercase to match the normalized slugs used in routing.
 * The product page normalizes slugs to lowercase before checking this Set.
 */
export const SOFT_404_PRODUCT_SLUGS = new Set([
  "cubologic-16-joc-de-logica-dj08576",
  "cubologic-9-joc-de-logica-dj08581",
  "instrument-optic-3-in-1-telescop-periscop-microscop-navir-n_8097",
  "iq-test-tangram-in-cutie-metalica-fridolin-fr_17323",
  "joc-circuit-domino-egmont-toys-egm_570135",
  "joc-logic-iq-colour-sudoku-cube-fridolin-fr_17366",
  "kit-constructie-robot---t-rex-kidz-robotix-4m-03460",
  "kit-stem-energia-eoliana-cu-turbina-si-masinuta-electrica-genius-toy-g_7087",
  "kit-stem-fabrica-de-roboti-genius-toy-g_7449",
  "kit-stem-kai-robotul-cu-inteligenta-artificiala-thames-kosmos-k_620392",
  "kit-stem-manusa-robotica-genius-toy-g_7080",
  "kit-stem-puterea-solara-fischertechnik-f_559882",
  "microscop-portabil-cu-led-si-uv-cu-adaptor-de-smartphone-marire-100-250x-microflip-mp-250",
  "mini-experiment-sparge-o-geoda-cristal-4m-03925",
  "orbita-spatiala-joc-de-logica-dj00817",
  "set-constructie-plus-plus-tub-100-piese-robot-pp4105",
  "set-de-activitati-plus-plus-125-piese-spatiu-pp3989",
  "set-magnetic-circuit-cu-bile-compact-60-piese-cleverclixx-cc-1004",
  "terariu-cristale-cu-dinozauri-4m-experiment-stem-4m-03926",
  "zig-go-roll-traseu-reactie-in-lant-dj05640",
  // Hard 404 with trailing slash-slug:
  "giroscop-navir-n_6010-cb",
]);

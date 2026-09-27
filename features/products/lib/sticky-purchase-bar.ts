/** Marks the end of PDP content so the mobile bar can hide before the footer. */
export const PDP_END_SELECTOR = "[data-pdp-end]";

export function collectStickyEndNodes(root: ParentNode): Element[] {
  const nodes: Element[] = [];
  const sentinel = root.querySelector(PDP_END_SELECTOR);
  const footer = root.querySelector("footer");
  if (sentinel) nodes.push(sentinel);
  if (footer && footer !== sentinel) nodes.push(footer);
  return nodes;
}

/**
 * Hide once the end region is on screen, or once the shopper has scrolled past it.
 * A zero-size box (not laid out yet) is not treated as "scrolled past".
 */
export function endRegionHidesSticky(entry: {
  isIntersecting: boolean;
  boundingClientRect: { bottom: number; height?: number };
}): boolean {
  if (entry.isIntersecting) return true;
  const { bottom, height = 0 } = entry.boundingClientRect;
  if (height === 0 && bottom === 0) return false;
  return bottom <= 0;
}

export function shouldShowStickyPurchaseBar(input: {
  isMobile: boolean;
  isOutOfStock: boolean;
  buyButtonVisible: boolean;
  endRegionActive: boolean;
}): boolean {
  return (
    input.isMobile &&
    !input.isOutOfStock &&
    !input.buyButtonVisible &&
    !input.endRegionActive
  );
}

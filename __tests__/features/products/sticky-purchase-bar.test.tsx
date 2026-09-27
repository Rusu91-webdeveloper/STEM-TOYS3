import { render, screen, waitFor } from "@testing-library/react";
import React, { act } from "react";

import { ProductPurchaseActions } from "@/features/products/components/ProductPurchaseActions";
import {
  collectStickyEndNodes,
  endRegionHidesSticky,
  shouldShowStickyPurchaseBar,
} from "@/features/products/lib/sticky-purchase-bar";

type ObserverEntry = {
  isIntersecting: boolean;
  boundingClientRect: { bottom: number; height: number; top: number };
  target: Element;
};

class MockObserver {
  static instances: MockObserver[] = [];
  elements: Element[] = [];
  constructor(private readonly callback: (entries: ObserverEntry[]) => void) {
    MockObserver.instances.push(this);
  }
  observe(element: Element) {
    this.elements.push(element);
  }
  unobserve() {}
  disconnect() {}
  trigger(target: Element, isIntersecting: boolean, bottom: number, height = 20) {
    this.callback([
      {
        isIntersecting,
        boundingClientRect: { bottom, height, top: bottom - height },
        target,
      },
    ]);
  }
}

describe("sticky purchase bar visibility", () => {
  it("hides when the end region is visible or already scrolled past", () => {
    expect(
      shouldShowStickyPurchaseBar({
        isMobile: true,
        isOutOfStock: false,
        buyButtonVisible: false,
        endRegionActive: false,
      })
    ).toBe(true);
    expect(
      shouldShowStickyPurchaseBar({
        isMobile: true,
        isOutOfStock: false,
        buyButtonVisible: false,
        endRegionActive: true,
      })
    ).toBe(false);
    expect(
      endRegionHidesSticky({
        isIntersecting: true,
        boundingClientRect: { bottom: 40, height: 1 },
      })
    ).toBe(true);
    expect(
      endRegionHidesSticky({
        isIntersecting: false,
        boundingClientRect: { bottom: -8, height: 1 },
      })
    ).toBe(true);
    expect(
      endRegionHidesSticky({
        isIntersecting: false,
        boundingClientRect: { bottom: 0, height: 0 },
      })
    ).toBe(false);
  });

  it("finds a sentinel and a footer when both exist", () => {
    document.body.innerHTML =
      '<div data-pdp-end=""></div><footer id="site-footer"></footer>';
    const nodes = collectStickyEndNodes(document);
    expect(nodes).toHaveLength(2);
    expect(nodes[0].hasAttribute("data-pdp-end")).toBe(true);
    expect(nodes[1].tagName).toBe("FOOTER");
    document.body.innerHTML = "";
  });
});

describe("ProductPurchaseActions sticky bar", () => {
  const originalObserver = global.IntersectionObserver;

  beforeEach(() => {
    MockObserver.instances = [];
    global.IntersectionObserver = MockObserver as unknown as typeof IntersectionObserver;
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: true,
      media: "(max-width: 767px)",
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    global.IntersectionObserver = originalObserver;
    document.body.innerHTML = "";
  });

  function renderBar() {
    return render(
      <ProductPurchaseActions
        productName="Kit robotică"
        price={129}
        isOutOfStock={false}
        isAdding={false}
        justAdded={false}
        onAdd={jest.fn()}
      />
    );
  }

  it("hides the bar when the PDP sentinel enters the viewport", () => {
    render(
      <>
        <ProductPurchaseActions
          productName="Kit robotică"
          price={129}
          isOutOfStock={false}
          isAdding={false}
          justAdded={false}
          onAdd={jest.fn()}
        />
        <div data-pdp-end="" />
      </>
    );

    const button = screen.getByTestId("add-to-cart");
    act(() => {
      MockObserver.instances[0].trigger(button, false, 900, 48);
    });
    expect(screen.getByTestId("pdp-sticky-add-to-cart")).toBeInTheDocument();

    const sentinel = document.querySelector("[data-pdp-end]");
    expect(sentinel).not.toBeNull();
    act(() => {
      MockObserver.instances[1].trigger(sentinel as Element, true, 24, 1);
    });
    expect(screen.queryByTestId("pdp-sticky-add-to-cart")).not.toBeInTheDocument();
  });

  it("starts watching a footer that mounts after the bar", async () => {
    renderBar();
    const button = screen.getByTestId("add-to-cart");
    act(() => {
      MockObserver.instances[0].trigger(button, false, 900, 48);
    });
    expect(screen.getByTestId("pdp-sticky-add-to-cart")).toBeInTheDocument();

    const footer = document.createElement("footer");
    act(() => {
      document.body.appendChild(footer);
    });

    await waitFor(() => {
      expect(MockObserver.instances[1].elements).toContain(footer);
    });

    act(() => {
      MockObserver.instances[1].trigger(footer, true, 30, 120);
    });
    expect(screen.queryByTestId("pdp-sticky-add-to-cart")).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { createIntersectionLazyComponent } from "@/lib/bundle-analyzer-client";

jest.mock("@/lib/logger-lite", () => ({
  logger: { debug: jest.fn(), error: jest.fn() },
}));

it("shows a retry after an import failure and restores the section", async () => {
  const observer = global.IntersectionObserver;
  // Old browsers and crawlers without IntersectionObserver must still load content.
  Object.defineProperty(global, "IntersectionObserver", {
    value: undefined,
    configurable: true,
    writable: true,
  });
  const load = jest
    .fn()
    .mockRejectedValueOnce(new Error("Loading chunk 42 failed."))
    .mockResolvedValue({ default: () => <p>Recenzii încărcate</p> });
  const Section = createIntersectionLazyComponent(load, "Reviews");
  try {
    render(<Section />);
    fireEvent.click(await screen.findByRole("button", { name: "Reîncearcă" }));
    expect(await screen.findByText("Recenzii încărcate")).toBeInTheDocument();
    expect(load).toHaveBeenCalledTimes(2);
  } finally {
    global.IntersectionObserver = observer;
  }
});

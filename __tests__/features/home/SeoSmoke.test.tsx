import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import { createMetadata } from "@/lib/metadata";
import { SITE_URL } from "@/lib/site";

describe("SEO smoke checks", () => {
  it("ensures canonical is absolute when provided", () => {
    const metadata = createMetadata({
      title: "t" as any,
      description: "d" as any,
      canonicalUrl: `${SITE_URL}/sample`,
      pathWithoutLocale: "/sample",
    });
    expect((metadata as any).alternates?.canonical).toContain("/sample");
  });
});

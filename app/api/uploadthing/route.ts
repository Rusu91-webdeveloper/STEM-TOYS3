import { createRouteHandler } from "uploadthing/next";

// Ensure this API route is always evaluated at runtime on Node.js
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { ourFileRouter } from "@/lib/uploadthing";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});

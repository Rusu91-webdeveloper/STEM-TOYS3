/**
 * API endpoint for generating CSRF tokens
 * GET /api/csrf-token - Returns a CSRF token for the current session
 */

import { NextRequest } from "next/server";

import { createCsrfTokenResponse } from "@/lib/csrf";

/**
 * GET /api/csrf-token - Generate CSRF token for current session
 */
export async function GET(request: NextRequest) {
  return createCsrfTokenResponse(request);
}

/**
 * Disable caching for CSRF tokens
 */
export const dynamic = "force-dynamic";

export function getCronSecret(): string | null {
  // Only use server-side env vars — never NEXT_PUBLIC_ (those leak to the browser bundle)
  return process.env.CRON_SECRET || process.env.CRON_SECRET_TOKEN || null;
}

export function isAuthorizedCronRequest(authHeader: string | null): boolean {
  const secret = getCronSecret();
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

